begin;
alter table public.profiles add column active boolean not null default true;
alter table public.profiles add column notification_preferences jsonb not null default '{"email":true,"in_app":true}';
alter table public.invoices add column due_date date;
alter table public.invoices add column quotation_id uuid references public.quotations(id);
create index invoices_quotation_idx on public.invoices(quotation_id);
alter table public.invoices drop constraint invoices_status_check;
alter table public.invoices add constraint invoices_status_check check(status in ('DRAFT','ISSUED','PENDING','PAID','OVERDUE','CANCELLED'));
alter table public.revision_requests add column deliverable_id uuid references public.deliverables(id);
create index revision_deliverable_idx on public.revision_requests(deliverable_id);
alter table public.revision_requests drop constraint revision_requests_status_check;
alter table public.revision_requests add constraint revision_requests_status_check check(status in ('PENDING','REQUESTED','IN_PROGRESS','RESOLVED','REJECTED','CANCELLED'));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where auth_user_id=auth.uid() and role='ADMIN' and active)
$$;
create or replace function public.owns_project(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from projects p join customers c on c.id=p.customer_id join profiles u on u.id=c.profile_id where p.id=pid and u.auth_user_id=auth.uid() and u.role='CUSTOMER' and u.active)
$$;
-- Preserve the existing transactional implementation; only changed actions are intercepted.
alter function public.project_action(uuid,uuid,text,jsonb) rename to project_action_base;
revoke all on function public.project_action_base(uuid,uuid,text,jsonb) from public,anon,authenticated,service_role;
create function public.project_action(actor_id uuid,pid uuid,action text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare u profiles; p projects; q quotations; c uuid; did uuid; rid uuid;
begin
 select * into u from profiles where id=actor_id and active;
 if u.id is null or u.role not in ('ADMIN','CUSTOMER') then raise exception 'Account cannot access this operation'; end if;
 perform set_config('app.actor',actor_id::text,true);
 if action='create' then return project_action_base(actor_id,pid,action,payload); end if;
 select * into p from projects where id=pid for update;
 select id into c from customers where profile_id=actor_id;
 if p.id is null or (u.role<>'ADMIN' and p.customer_id is distinct from c) then raise exception 'Project not found'; end if;
 if action='accept' then
  if u.role<>'CUSTOMER' or p.status<>'QUOTATION_SENT' then raise exception 'Quotation cannot be accepted'; end if;
  select * into q from quotations where project_id=pid and status='SENT' for update;
  if q.id is null or q.valid_until<current_date then raise exception 'Quotation is missing or expired'; end if;
  update quotations set status='ACCEPTED' where id=q.id;
  update projects set status='QUOTATION_ACCEPTED' where id=pid;
 elsif action in ('approve-deliverable','complete') then
  if u.role<>'CUSTOMER' or p.status<>'WAITING_REVIEW' then raise exception 'Project is not awaiting review'; end if;
  if action='approve-deliverable' then
   did:=(payload->>'deliverable_id')::uuid;
   update deliverables set status='APPROVED' where id=did and project_id=pid and status='PENDING_APPROVAL';
   if not found then raise exception 'Deliverable is not awaiting approval'; end if;
  else
   if not exists(select 1 from deliverables where project_id=pid and status in ('PENDING_APPROVAL','APPROVED')) then raise exception 'No deliverables to accept'; end if;
   update deliverables set status='APPROVED' where project_id=pid and status='PENDING_APPROVAL';
  end if;
  if not exists(select 1 from deliverables where project_id=pid and status='PENDING_APPROVAL') then
   update revision_requests set status='RESOLVED' where project_id=pid and status in ('PENDING','REQUESTED','IN_PROGRESS');
   update projects set status='COMPLETED' where id=pid;
   select * into q from quotations where project_id=pid and status='ACCEPTED';
   if q.id is not null then
    insert into invoices(project_id,customer_id,invoice_number,amount,status,quotation_id)
    values(pid,p.customer_id,'MH-'||upper(replace(pid::text,'-','')),q.total,'DRAFT',q.id) on conflict(project_id) do nothing;
   end if;
  end if;
 elsif action='revision' then
  if u.role<>'CUSTOMER' or p.status<>'WAITING_REVIEW' then raise exception 'Project is not awaiting review'; end if;
  did:=nullif(payload->>'deliverable_id','')::uuid;
  if did is not null and not exists(select 1 from deliverables where id=did and project_id=pid and status='PENDING_APPROVAL') then raise exception 'Deliverable cannot be revised'; end if;
  insert into revision_requests(project_id,customer_id,description,attachment_url,deliverable_id,status)
  values(pid,c,payload->>'description',payload->>'attachment_url',did,'REQUESTED');
  update deliverables set status='REVISION_REQUIRED' where project_id=pid and status='PENDING_APPROVAL' and (did is null or id=did);
  update projects set status='REVISION' where id=pid;
 elsif action='revision-status' then
  if u.role<>'ADMIN' then raise exception 'Administrator required'; end if;
  rid:=(payload->>'revision_id')::uuid;
  if payload->>'status' not in ('IN_PROGRESS','RESOLVED','CANCELLED') then raise exception 'Invalid revision status'; end if;
  update revision_requests set status=payload->>'status' where id=rid and project_id=pid and status in ('PENDING','REQUESTED','IN_PROGRESS');
  if not found then raise exception 'Revision is missing or already closed'; end if;
  insert into notifications(user_id,title,message,type) select profile_id,'Revision updated',p.title,'REVISION' from customers where id=p.customer_id;
 elsif action='issue-invoice' then
  if u.role<>'ADMIN' then raise exception 'Administrator required'; end if;
  update invoices set status='PENDING',issued_at=now(),due_date=(payload->>'due_date')::date where project_id=pid and status='DRAFT';
  if not found then raise exception 'No draft invoice to issue'; end if;
  insert into notifications(user_id,title,message,type) select profile_id,'Invoice issued',p.title,'INVOICE' from customers where id=p.customer_id;
 else
  return project_action_base(actor_id,pid,action,payload);
 end if;
 return jsonb_build_object('id',pid);
end $$;
revoke all on function public.project_action(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.project_action(uuid,uuid,text,jsonb) to service_role;
create function public.convert_lead(actor_id uuid,lid uuid,cid uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare l leads; customer_email text;
begin
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 select * into l from leads where id=lid for update;
 if l.id is null then raise exception 'Lead not found'; end if;
 if l.status='CONVERTED' then return jsonb_build_object('customer_id',l.customer_id); end if;
 select p.email into customer_email from customers c join profiles p on p.id=c.profile_id where c.id=cid and p.role='CUSTOMER' and p.active;
 if customer_email is null or lower(customer_email)<>lower(l.email) then raise exception 'Customer email must match the enquiry'; end if;
 update leads set status='CONVERTED',customer_id=cid where id=lid;
 return jsonb_build_object('customer_id',cid);
end $$;
revoke all on function public.convert_lead(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.convert_lead(uuid,uuid,uuid) to service_role;
drop policy own_read on public.invoices;
create policy own_read on public.invoices for select to authenticated using(public.owns_project(project_id) and status<>'DRAFT');
drop policy own_read on public.quotations;
create policy own_read on public.quotations for select to authenticated using(public.owns_project(project_id) and status<>'DRAFT');
drop policy own_items on public.quotation_items;
create policy own_items on public.quotation_items for select to authenticated using(exists(select 1 from quotations q where q.id=quotation_id and q.status<>'DRAFT' and owns_project(q.project_id)));
commit;
