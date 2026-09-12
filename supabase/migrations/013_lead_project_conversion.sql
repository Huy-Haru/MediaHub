begin;
alter table public.leads add column project_id uuid references public.projects(id);
create index leads_project_idx on public.leads(project_id);
create or replace function public.convert_lead(actor_id uuid,lid uuid,cid uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare l leads; customer_email text; pid uuid;
begin
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 select * into l from leads where id=lid for update;
 if l.id is null then raise exception 'Lead not found'; end if;
 if l.status='CONVERTED' then return jsonb_build_object('customer_id',l.customer_id,'project_id',l.project_id); end if;
 select p.email into customer_email from customers c join profiles p on p.id=c.profile_id where c.id=cid and p.role='CUSTOMER' and p.active;
 if customer_email is null or lower(customer_email)<>lower(l.email) then raise exception 'Customer email must match the enquiry'; end if;
 if l.source='PROJECT_REQUEST' and l.service_id is not null then
  if not exists(select 1 from services where id=l.service_id and active) then raise exception 'Requested service is no longer active'; end if;
  insert into projects(customer_id,title,description,category,deadline,status)
  values(cid,coalesce(nullif(l.project_type,''),'Project request'),l.message||case when l.budget_range<>'' then E'\nBudget range: '||l.budget_range else '' end,(select category from services where id=l.service_id),l.deadline,'SUBMITTED') returning id into pid;
  insert into project_services(project_id,service_id) values(pid,l.service_id);
 end if;
 update leads set status='CONVERTED',customer_id=cid,project_id=pid where id=lid;
 return jsonb_build_object('customer_id',cid,'project_id',pid);
end $$;
commit;
