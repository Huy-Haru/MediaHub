begin;
alter table public.projects add column progress integer not null default 0 check(progress between 0 and 100);
alter table public.projects add column scope text not null default '';
update public.projects set progress=100 where status='COMPLETED';
create function public.edit_project(actor_id uuid,pid uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 update projects set title=payload->>'title',description=payload->>'description',scope=payload->>'scope',
 progress=(payload->>'progress')::integer,deadline=(payload->>'deadline')::date
 where id=pid and status not in ('COMPLETED','CANCELLED');
 if not found then raise exception 'Project is missing or closed'; end if;
 return jsonb_build_object('id',pid);
end $$;
revoke all on function public.edit_project(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.edit_project(uuid,uuid,jsonb) to service_role;
create function public.complete_progress() returns trigger language plpgsql set search_path=public as $$
begin if new.status='COMPLETED' then new.progress=100; end if;return new;end $$;
create trigger complete_progress before update of status on public.projects for each row execute function public.complete_progress();
alter function public.dashboard_report(uuid) rename to dashboard_report_base;
revoke all on function public.dashboard_report_base(uuid) from public,anon,authenticated,service_role;
create function public.dashboard_report(actor_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u profiles; cid uuid; base jsonb;
begin
 select * into u from profiles where id=actor_id and active;
 if u.id is null or u.role not in ('ADMIN','CUSTOMER') then raise exception 'Account not available'; end if;
 select id into cid from customers where profile_id=actor_id;
 base:=dashboard_report_base(actor_id);
 return base||jsonb_build_object(
 'new_leads',case when u.role='ADMIN' then (select count(*) from leads where status='NEW') else 0 end,
 'pending_reviews',(select count(*) from projects where status='WAITING_REVIEW' and (u.role='ADMIN' or customer_id=cid)),
 'outstanding_invoices',(select count(*) from invoices where status in ('PENDING','ISSUED','OVERDUE') and (u.role='ADMIN' or customer_id=cid)),
 'recent_notifications',(select coalesce(jsonb_agg(t),'[]') from (select id,title,message,created_at,read_at from notifications where user_id=actor_id order by created_at desc limit 5)t)
 );
end $$;
revoke all on function public.dashboard_report(uuid) from public,anon,authenticated;
grant execute on function public.dashboard_report(uuid) to service_role;
commit;
