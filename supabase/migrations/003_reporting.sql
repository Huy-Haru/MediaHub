create function public.dashboard_report(actor_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare u profiles; cid uuid; output jsonb;
begin
 select * into u from profiles where id=actor_id;
 if u.id is null or u.role not in ('ADMIN','CUSTOMER') then raise exception 'Không có quyền truy cập'; end if;
 select id into cid from customers where profile_id=actor_id;
 with ps as (select * from projects where u.role='ADMIN' or customer_id=cid), ins as (select * from invoices where u.role='ADMIN' or customer_id=cid), paid as (select * from ins where status='PAID')
 select jsonb_build_object(
 'total_projects',(select count(*) from ps),'active_projects',(select count(*) from ps where status not in ('COMPLETED','CANCELLED','DRAFT')),'completed_projects',(select count(*) from ps where status='COMPLETED'),
 'pending_quotations',(select count(*) from ps where status='QUOTATION_SENT'),
 'total_customers',case when u.role='ADMIN' then (select count(*) from customers c join profiles p on p.id=c.profile_id where p.role='CUSTOMER') else 1 end,
 'total_revenue',(select coalesce(sum(amount),0) from paid),
 'monthly_revenue',(select coalesce(sum(amount),0) from paid where paid_at>=date_trunc('month',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'),
 'yearly_revenue',(select coalesce(sum(amount),0) from paid where paid_at>=date_trunc('year',now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'),
 'average_project_value',(select coalesce(sum(amount)/nullif(count(distinct project_id),0),0) from paid),
 'pending_payment',(select coalesce(sum(amount),0) from ins where status='PENDING'),'paid_invoices',(select count(*) from paid),
 'by_status',(select coalesce(jsonb_agg(t),'[]') from (select status,count(*) as count from ps group by status) t),
 'by_month',(select coalesce(jsonb_agg(t),'[]') from (select to_char(paid_at at time zone 'Asia/Ho_Chi_Minh','YYYY-MM') as label,sum(amount) as value from paid group by 1 order by 1) t),
 'by_service',(select coalesce(jsonb_agg(t),'[]') from (select s.name as label,sum(case when q.subtotal>0 then i.amount*qi.total/q.subtotal else 0 end) as value from paid i join quotations q on q.project_id=i.project_id and q.status='ACCEPTED' join quotation_items qi on qi.quotation_id=q.id join services s on s.id=qi.service_id group by s.name) t)
 ) into output;
 return output;
end $$;
revoke all on function public.dashboard_report(uuid) from public,anon,authenticated;
grant execute on function public.dashboard_report(uuid) to service_role;
