begin;
create table public.leads (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(full_name) between 1 and 150),
 email text not null check(length(email) <= 254),
 phone text not null default '' check(length(phone) <= 30),
 company text not null default '' check(length(company) <= 200),
 service_id uuid references public.services(id) on delete set null,
 project_type text not null default '' check(length(project_type) <= 100),
 message text not null check(length(message) between 1 and 5000),
 budget_range text not null default '' check(length(budget_range) <= 100),
 deadline date,
 source text not null check(source in ('CONTACT','PROJECT_REQUEST')),
 status text not null default 'NEW' check(status in ('NEW','CONTACTED','QUALIFIED','CONVERTED','LOST')),
 notes text not null default '' check(length(notes) <= 10000),
 customer_id uuid references public.customers(id),
 assigned_to uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status <> 'CONVERTED' or customer_id is not null)
);
create index leads_status_created_idx on public.leads(status,created_at desc);
create index leads_email_idx on public.leads(lower(email));
create index leads_service_idx on public.leads(service_id);
create index leads_customer_idx on public.leads(customer_id);
create index leads_assigned_idx on public.leads(assigned_to);
alter table public.leads enable row level security;
revoke all on public.leads from anon,authenticated;
grant select,insert,update,delete on public.leads to authenticated,service_role;
create policy admin_all on public.leads for all to authenticated using(public.is_admin()) with check(public.is_admin());
create trigger touch before update on public.leads for each row execute function public.touch_updated();
create function public.notify_new_lead() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,title,message,type)
 select id,'New project enquiry',new.full_name || ' — ' || new.source,'NEW_LEAD' from profiles where role='ADMIN';
 return new;
end $$;
create trigger new_lead after insert on public.leads for each row execute function public.notify_new_lead();
commit;
