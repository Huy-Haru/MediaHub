begin;
create function public.project_action(actor_id uuid,pid uuid,action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public as $$
declare u profiles; c uuid; p projects; q quotations; item jsonb; total_amount numeric; qid uuid; newid uuid; next_status text;
begin
 select * into u from profiles where id=actor_id;
 if u.id is null or u.role not in ('CUSTOMER','ADMIN') then raise exception 'Không có quyền truy cập'; end if;
 perform set_config('app.actor',u.id::text,true);
 select id into c from customers where profile_id=u.id;
 if action='create' then
  if u.role<>'CUSTOMER' then raise exception 'Chỉ khách hàng được tạo dự án'; end if;
  insert into projects(customer_id,title,description,category,budget,deadline,status) values(c,payload->>'title',payload->>'description',payload->>'category',(payload->>'budget')::numeric,(payload->>'deadline')::date,coalesce(payload->>'status','SUBMITTED')) returning id into newid;
  for item in select * from jsonb_array_elements(payload->'service_ids') loop
   if not exists(select 1 from services where id=(item#>>'{}')::uuid and active) then raise exception 'Dịch vụ không khả dụng'; end if;
   insert into project_services(project_id,service_id) values(newid,(item#>>'{}')::uuid);
  end loop;
  return jsonb_build_object('id',newid);
 end if;
 select * into p from projects where id=pid for update;
 if p.id is null or (u.role<>'ADMIN' and p.customer_id is distinct from c) then raise exception 'Không tìm thấy dự án'; end if;
 if action in ('quotation','status','deliverable','paid') and u.role<>'ADMIN' then raise exception 'Chỉ quản trị viên được thực hiện'; end if;
 if action in ('accept','reject','revision','complete','review','edit') and u.role<>'CUSTOMER' then raise exception 'Chỉ chủ dự án được thực hiện'; end if;
 if action='edit' then
  if p.status<>'DRAFT' then raise exception 'Chỉ có thể sửa bản nháp'; end if;
  update projects set title=payload->>'title',description=payload->>'description',category=payload->>'category',budget=(payload->>'budget')::numeric,deadline=(payload->>'deadline')::date,status=payload->>'status' where id=pid;
  delete from project_services where project_id=pid;
  insert into project_services(project_id,service_id) select pid,value::uuid from jsonb_array_elements_text(payload->'service_ids');
 elsif action='quotation' then
  if p.status<>'REVIEWING' then raise exception 'Dự án phải đang được xem xét'; end if;
  select sum((v->>'quantity')::numeric*(v->>'unit_price')::numeric) into total_amount from jsonb_array_elements(payload->'items') v;
  if (payload->>'discount')::numeric>total_amount or (payload->>'valid_until')::date<current_date then raise exception 'Giảm giá hoặc hạn báo giá không hợp lệ'; end if;
  insert into quotations(project_id,subtotal,discount,total,valid_until,status,notes) values(pid,total_amount,(payload->>'discount')::numeric,total_amount-(payload->>'discount')::numeric,(payload->>'valid_until')::date,'SENT',payload->>'notes') returning id into qid;
  for item in select * from jsonb_array_elements(payload->'items') loop insert into quotation_items(quotation_id,service_id,description,quantity,unit_price,total) values(qid,(item->>'service_id')::uuid,item->>'description',(item->>'quantity')::integer,(item->>'unit_price')::numeric,(item->>'quantity')::numeric*(item->>'unit_price')::numeric); end loop;
  update projects set status='QUOTATION_SENT' where id=pid;
 elsif action in ('accept','reject') then
  select * into q from quotations where project_id=pid and status='SENT' for update;
  if q.id is null or p.status<>'QUOTATION_SENT' or q.valid_until<current_date then raise exception 'Báo giá chưa gửi hoặc đã hết hạn'; end if;
  update quotations set status=case when action='accept' then 'ACCEPTED' else 'REJECTED' end where id=q.id;
  update projects set status=case when action='accept' then 'QUOTATION_ACCEPTED' else 'CANCELLED' end where id=pid;
  if action='accept' then insert into invoices(project_id,customer_id,invoice_number,amount) values(pid,p.customer_id,'MH-'||upper(replace(pid::text,'-','')),q.total); end if;
 elsif action='status' then
  next_status:=payload->>'status';
  if next_status not in ('REVIEWING','IN_PROGRESS','WAITING_REVIEW','COMPLETED','CANCELLED') then raise exception 'Trạng thái không hợp lệ'; end if;
  if next_status='WAITING_REVIEW' and not exists(select 1 from deliverables where project_id=pid and status='PENDING_APPROVAL') then raise exception 'Cần tải sản phẩm bàn giao'; end if;
  if next_status='COMPLETED' and (not exists(select 1 from deliverables where project_id=pid) or exists(select 1 from deliverables where project_id=pid and status<>'APPROVED')) then raise exception 'Khách hàng chưa duyệt sản phẩm'; end if;
  update projects set status=next_status where id=pid;
 elsif action='file' then
  if p.status in ('COMPLETED','CANCELLED') then raise exception 'Dự án đã đóng'; end if;
  insert into project_files(project_id,uploaded_by,file_name,file_url,file_type,file_size) values(pid,u.id,payload->>'name',payload->>'path',payload->>'type',(payload->>'size')::bigint);
 elsif action='deliverable' then
  if p.status not in ('IN_PROGRESS','REVISION') then raise exception 'Dự án chưa sẵn sàng bàn giao'; end if;
  insert into deliverables(project_id,name,file_url,version) values(pid,payload->>'name',payload->>'path',(select coalesce(max(version),0)+1 from deliverables where project_id=pid));
  insert into notifications(user_id,title,message,type) select profile_id,'Sản phẩm bàn giao mới',p.title,'DELIVERABLE' from customers where id=p.customer_id;
 elsif action='revision' then
  if p.status<>'WAITING_REVIEW' then raise exception 'Chỉ yêu cầu chỉnh sửa khi đang chờ duyệt'; end if;
  insert into revision_requests(project_id,customer_id,description,attachment_url) values(pid,c,payload->>'description',payload->>'attachment_url');
  update deliverables set status='REVISION_REQUIRED' where project_id=pid and status='PENDING_APPROVAL';
  update projects set status='REVISION' where id=pid;
 elsif action='complete' then
  if p.status<>'WAITING_REVIEW' or not exists(select 1 from deliverables where project_id=pid and status='PENDING_APPROVAL') then raise exception 'Chưa có sản phẩm để duyệt'; end if;
  update deliverables set status='APPROVED' where project_id=pid;
  update revision_requests set status='RESOLVED' where project_id=pid and status in ('PENDING','IN_PROGRESS');
  update projects set status='COMPLETED' where id=pid;
 elsif action='review' then
  if p.status<>'COMPLETED' or exists(select 1 from reviews where project_id=pid) then raise exception 'Chỉ đánh giá một lần sau khi hoàn thành'; end if;
  insert into reviews(project_id,customer_id,rating,quality_rating,communication_rating,value_rating,comment) values(pid,c,(payload->>'rating')::integer,(payload->>'quality_rating')::integer,(payload->>'communication_rating')::integer,(payload->>'value_rating')::integer,payload->>'comment') returning id into newid;
  insert into testimonials(review_id,content) values(newid,payload->>'comment');
 elsif action='paid' then
  update invoices set status='PAID',paid_at=now() where project_id=pid and status='PENDING';
  if not found then raise exception 'Hóa đơn không ở trạng thái chờ thanh toán'; end if;
 else raise exception 'Thao tác không hợp lệ'; end if;
 return jsonb_build_object('id',pid);
end $$;
revoke all on function public.project_action(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.project_action(uuid,uuid,text,jsonb) to service_role;
commit;
