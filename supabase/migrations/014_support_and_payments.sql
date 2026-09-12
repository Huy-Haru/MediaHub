begin;
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id),
 subject text not null check(length(subject) between 1 and 160), category text not null default 'GENERAL' check(category in ('GENERAL','PROJECT','PAYMENT','TECHNICAL')),
 status text not null default 'OPEN' check(status in ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
 assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.support_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 sender_id uuid not null references public.profiles(id), message text not null check(length(message) between 1 and 5000), created_at timestamptz not null default now()
);
create index support_customer_idx on public.support_tickets(customer_id,updated_at desc);
create index support_assigned_idx on public.support_tickets(assigned_to,status);
create index support_messages_ticket_idx on public.support_messages(ticket_id,created_at);
create table public.payment_settings (
 id text primary key default 'default' check(id='default'), bank_name text not null default '', account_number text not null default '', account_name text not null default '',
 qr_image text not null default '', deposit_percent integer not null default 30 check(deposit_percent between 1 and 99), enabled boolean not null default false,
 instructions text not null default '', updated_at timestamptz not null default now()
);
insert into public.payment_settings(id) values('default');
create table public.payment_plans (
 id uuid primary key default gen_random_uuid(), project_id uuid not null unique references public.projects(id), quotation_id uuid not null references public.quotations(id),
 total numeric(16,2) not null check(total>0), deposit_percent integer not null check(deposit_percent between 1 and 99), created_at timestamptz not null default now()
);
create table public.payment_installments (
 id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.payment_plans(id), stage text not null check(stage in ('DEPOSIT','BALANCE')),
 amount numeric(16,2) not null check(amount>0), status text not null default 'PENDING' check(status in ('PENDING','REPORTED','PAID')),
 reference text not null unique default ('MH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 transfer_note text not null default '', reported_at timestamptz, paid_at timestamptz, confirmed_by uuid references public.profiles(id), unique(plan_id,stage)
);
create index payment_installments_plan_idx on public.payment_installments(plan_id);
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.payment_settings enable row level security;
alter table public.payment_plans enable row level security;
alter table public.payment_installments enable row level security;
-- All writes are through the API's service role and checked transaction functions.
revoke all on public.support_tickets,public.support_messages,public.payment_settings,public.payment_plans,public.payment_installments from anon,authenticated;
grant all on public.support_tickets,public.support_messages,public.payment_settings,public.payment_plans,public.payment_installments to service_role;
create function public.support_action(actor_id uuid,operation text,target_id uuid,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare u profiles; t support_tickets; cid uuid; recipient uuid;
begin
 select * into u from profiles where id=actor_id and active;
 if u.id is null then raise exception 'Active account required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 if operation='create' then
  if u.role<>'CUSTOMER' then raise exception 'Customer required'; end if;
  select id into cid from customers where profile_id=u.id;
  insert into support_tickets(customer_id,subject,category) values(cid,payload->>'subject',payload->>'category') returning * into t;
  insert into support_messages(ticket_id,sender_id,message) values(t.id,u.id,payload->>'message');
  insert into notifications(user_id,title,message,type) select id,'Yêu cầu hỗ trợ mới',t.subject,'SUPPORT' from profiles where role in ('ADMIN','STAFF') and active;
 else
  select * into t from support_tickets where id=target_id for update;
  if t.id is null then raise exception 'Ticket not found'; end if;
  if u.role='CUSTOMER' and not exists(select 1 from customers where id=t.customer_id and profile_id=u.id) then raise exception 'Ticket not found'; end if;
  if u.role='STAFF' and t.assigned_to is distinct from u.id and not(operation='claim' and t.assigned_to is null) then raise exception 'Assignment required'; end if;
  if operation='claim' then
   if u.role not in ('STAFF','ADMIN') or t.assigned_to is not null then raise exception 'Ticket is already assigned'; end if;
   update support_tickets set assigned_to=u.id,status='IN_PROGRESS',updated_at=now() where id=t.id;
  elsif operation='assign' then
   if u.role<>'ADMIN' then raise exception 'Administrator required'; end if;
   if not exists(select 1 from profiles where id=(payload->>'assigned_to')::uuid and role in ('STAFF','ADMIN') and active) then raise exception 'Active support agent required'; end if;
   update support_tickets set assigned_to=(payload->>'assigned_to')::uuid,status='IN_PROGRESS',updated_at=now() where id=t.id;
  elsif operation='message' then
   if t.status='CLOSED' then raise exception 'Ticket is closed'; end if;
   insert into support_messages(ticket_id,sender_id,message) values(t.id,u.id,payload->>'message');
   update support_tickets set updated_at=now(),status=case when status='RESOLVED' then 'IN_PROGRESS' else status end where id=t.id;
   if u.role='CUSTOMER' then recipient:=t.assigned_to; else select profile_id into recipient from customers where id=t.customer_id; end if;
   if recipient is not null then insert into notifications(user_id,title,message,type) values(recipient,'Tin nhắn hỗ trợ mới',t.subject,'SUPPORT'); end if;
  elsif operation='status' then
   if u.role not in ('STAFF','ADMIN') then raise exception 'Support agent required'; end if;
   update support_tickets set status=payload->>'status',updated_at=now() where id=t.id;
  else raise exception 'Unsupported operation'; end if;
 end if;
 insert into audit_logs(actor_id,action,entity,entity_id) values(u.id,operation,'support_tickets',t.id);
 return jsonb_build_object('id',t.id);
end $$;
revoke all on function public.support_action(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.support_action(uuid,text,uuid,jsonb) to service_role;
create function public.payment_action(actor_id uuid,operation text,target_id uuid,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare u profiles; p projects; q quotations; plan payment_plans; item payment_installments; settings payment_settings; deposit numeric;
begin
 select * into u from profiles where id=actor_id and active;
 if u.id is null or u.role not in ('ADMIN','CUSTOMER') then raise exception 'Account not permitted'; end if;
 perform set_config('app.actor',actor_id::text,true);
 if operation='create-plan' then
  if u.role<>'ADMIN' then raise exception 'Administrator required'; end if;
  select * into p from projects where id=target_id for update;
  select * into q from quotations where project_id=p.id and status='ACCEPTED';
  if q.id is null or q.total<=0 or p.status in ('CANCELLED','COMPLETED') then raise exception 'Active project with accepted quotation required'; end if;
  select * into settings from payment_settings where id='default';
  insert into payment_plans(project_id,quotation_id,total,deposit_percent) values(p.id,q.id,q.total,coalesce((payload->>'deposit_percent')::integer,settings.deposit_percent)) on conflict(project_id) do nothing returning * into plan;
  if plan.id is null then select * into plan from payment_plans where project_id=p.id; end if;
  deposit:=round(plan.total*plan.deposit_percent/100,2);
  insert into payment_installments(plan_id,stage,amount) values(plan.id,'DEPOSIT',deposit),(plan.id,'BALANCE',plan.total-deposit) on conflict(plan_id,stage) do nothing;
 else
  select * into item from payment_installments where id=target_id for update;
  if item.id is null then raise exception 'Payment not found'; end if;
  select * into plan from payment_plans where id=item.plan_id;
  select * into p from projects where id=plan.project_id;
  if u.role='CUSTOMER' and not exists(select 1 from customers where id=p.customer_id and profile_id=u.id) then raise exception 'Payment not found'; end if;
  if operation='report' then
   if u.role<>'CUSTOMER' or item.status<>'PENDING' then raise exception 'Payment cannot be reported'; end if;
   if not exists(select 1 from payment_settings where id='default' and enabled) then raise exception 'Bank payment is not configured'; end if;
   if item.stage='BALANCE' and p.status<>'COMPLETED' then raise exception 'Final acceptance required before balance payment'; end if;
   update payment_installments set status='REPORTED',transfer_note=left(payload->>'transfer_note',1000),reported_at=now() where id=item.id;
  elsif operation in ('confirm','reject') then
   if u.role<>'ADMIN' or item.status<>'REPORTED' then raise exception 'Reported payment and administrator required'; end if;
   update payment_installments set status=case when operation='confirm' then 'PAID' else 'PENDING' end,paid_at=case when operation='confirm' then now() else null end,confirmed_by=case when operation='confirm' then u.id else null end where id=item.id;
   if operation='confirm' and not exists(select 1 from payment_installments where plan_id=plan.id and status<>'PAID') then
    update invoices set status='PAID',paid_at=now() where project_id=p.id and status in ('PENDING','ISSUED','OVERDUE');
   end if;
  else raise exception 'Unsupported payment operation'; end if;
 end if;
 insert into audit_logs(actor_id,action,entity,entity_id) values(u.id,operation,'payment_plans',plan.id);
 return jsonb_build_object('id',plan.id);
end $$;
revoke all on function public.payment_action(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.payment_action(uuid,text,uuid,jsonb) to service_role;
commit;
