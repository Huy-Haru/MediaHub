begin;
alter table public.quotations drop constraint quotations_status_check;
alter table public.quotations add constraint quotations_status_check check(status in ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED','CANCELLED'));
alter table public.quotations add column quotation_number text not null default 'MHQ-'||upper(replace(gen_random_uuid()::text,'-',''));
create unique index quotation_number_idx on public.quotations(quotation_number);
alter table public.quotations add column tax_rate numeric(5,2) not null default 0 check(tax_rate between 0 and 100);
alter table public.quotations add column tax numeric(16,2) not null default 0 check(tax>=0);
create unique index one_draft_quote on public.quotations(project_id) where status='DRAFT';
create function public.save_quotation(actor_id uuid,pid uuid,payload jsonb,send_now boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare p projects; qid uuid; item jsonb; subtotal_amount numeric; discount_amount numeric; rate numeric; tax_amount numeric;
begin
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 select * into p from projects where id=pid for update;
 if p.id is null or p.status<>'REVIEWING' then raise exception 'Project must be under review'; end if;
 if jsonb_array_length(payload->'items') not between 1 and 50 then raise exception 'Invalid quotation items'; end if;
 select sum((v->>'quantity')::numeric*(v->>'unit_price')::numeric) into subtotal_amount from jsonb_array_elements(payload->'items') v;
 discount_amount:=coalesce((payload->>'discount')::numeric,0);rate:=coalesce((payload->>'tax_rate')::numeric,0);
 if discount_amount<0 or discount_amount>subtotal_amount or rate<0 or rate>100 then raise exception 'Invalid discount or tax'; end if;
 if send_now and (payload->>'valid_until')::date<current_date then raise exception 'Quotation has expired'; end if;
 tax_amount:=round((subtotal_amount-discount_amount)*rate/100,2);
 if subtotal_amount-discount_amount+tax_amount>1e12 then raise exception 'Quotation total exceeds limit'; end if;
 insert into quotations(project_id,subtotal,discount,tax_rate,tax,total,valid_until,status,notes)
 values(pid,subtotal_amount,discount_amount,rate,tax_amount,subtotal_amount-discount_amount+tax_amount,(payload->>'valid_until')::date,'DRAFT',payload->>'notes')
 on conflict(project_id) where status='DRAFT' do update set subtotal=excluded.subtotal,discount=excluded.discount,tax_rate=excluded.tax_rate,tax=excluded.tax,total=excluded.total,valid_until=excluded.valid_until,notes=excluded.notes returning id into qid;
 delete from quotation_items where quotation_id=qid;
 for item in select * from jsonb_array_elements(payload->'items') loop
  if not exists(select 1 from services where id=(item->>'service_id')::uuid and active) then raise exception 'Service is unavailable'; end if;
  insert into quotation_items(quotation_id,service_id,description,quantity,unit_price,total)
  values(qid,(item->>'service_id')::uuid,item->>'description',(item->>'quantity')::integer,(item->>'unit_price')::numeric,(item->>'quantity')::numeric*(item->>'unit_price')::numeric);
 end loop;
 if send_now then update quotations set status='SENT' where id=qid;update projects set status='QUOTATION_SENT' where id=pid;end if;
 return jsonb_build_object('id',qid,'project_id',pid);
end $$;
create function public.manage_quotation(actor_id uuid,qid uuid,operation text) returns jsonb language plpgsql security definer set search_path=public as $$
declare q quotations; payload jsonb;
begin
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 select * into q from quotations where id=qid;
 if q.id is null then raise exception 'Quotation not found'; end if;
 perform 1 from projects where id=q.project_id for update;
 select * into q from quotations where id=qid for update;
 perform set_config('app.actor',actor_id::text,true);
 if operation='send' then
  if q.status<>'DRAFT' then raise exception 'Only draft quotations may be sent'; end if;
  payload:=jsonb_build_object('items',(select jsonb_agg(to_jsonb(i)) from quotation_items i where quotation_id=qid),'discount',q.discount,'tax_rate',q.tax_rate,'valid_until',q.valid_until,'notes',q.notes);
  return save_quotation(actor_id,q.project_id,payload,true);
 elsif operation='cancel' then
  if q.status not in ('DRAFT','SENT') then raise exception 'Quotation cannot be cancelled'; end if;
  update quotations set status='CANCELLED' where id=qid;
  if q.status='SENT' then update projects set status='CANCELLED' where id=q.project_id;end if;
 else raise exception 'Unsupported quotation operation';end if;
 return jsonb_build_object('id',qid,'project_id',q.project_id);
end $$;
revoke all on function public.save_quotation(uuid,uuid,jsonb,boolean),public.manage_quotation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.save_quotation(uuid,uuid,jsonb,boolean),public.manage_quotation(uuid,uuid,text) to service_role;
commit;
