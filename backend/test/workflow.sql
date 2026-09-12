-- Run only inside a rollback transaction; never persist synthetic customers/invoices.
do $$
declare admin_auth uuid:=gen_random_uuid(); customer_auth uuid:=gen_random_uuid(); other_auth uuid:=gen_random_uuid();
 admin_id uuid; customer_id uuid; other_id uuid; cid uuid; sid uuid; pid uuid; did uuid; lid uuid; qid uuid; linked_pid uuid; denied boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values
 (admin_auth,admin_auth::text||'@example.invalid','{"full_name":"Migration test admin"}'),
 (customer_auth,customer_auth::text||'@example.invalid','{"full_name":"Migration test customer"}'),
 (other_auth,other_auth::text||'@example.invalid','{"full_name":"Migration test other"}');
 select id into admin_id from profiles where auth_user_id=admin_auth;
 select id into customer_id from profiles where auth_user_id=customer_auth;
 select id into other_id from profiles where auth_user_id=other_auth;
 update profiles set role='ADMIN' where id=admin_id;
 select id into cid from customers where profile_id=customer_id;
 insert into services(name,slug,description,active) values('Migration test',gen_random_uuid()::text,'Test',true) returning id into sid;
 insert into leads(full_name,email,message,source,service_id) values('Migration test customer',customer_auth::text||'@example.invalid','Test brief','PROJECT_REQUEST',sid) returning id into lid;
 perform convert_lead(admin_id,lid,cid);
 if (select status from leads where id=lid)<>'CONVERTED' then raise exception 'Lead conversion failed'; end if;
 select project_id into linked_pid from leads where id=lid;
 if linked_pid is null or not exists(select 1 from project_services where project_id=linked_pid and service_id=sid) then raise exception 'Lead brief was not linked to a project'; end if;
 if (convert_lead(admin_id,lid,cid)->>'project_id')::uuid<>linked_pid then raise exception 'Lead conversion is not idempotent'; end if;
 pid:=(project_action(customer_id,null,'create',jsonb_build_object('title','Migration test project','description','Test brief','category','Video','budget',1000,'deadline',current_date+30,'service_ids',jsonb_build_array(sid)))->>'id')::uuid;
 denied:=false;
 begin perform project_action(other_id,pid,'edit','{}'); exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Cross-customer project write was allowed'; end if;
 perform project_action(admin_id,pid,'status','{"status":"REVIEWING"}');
 qid:=(save_quotation(admin_id,pid,jsonb_build_object('items',jsonb_build_array(jsonb_build_object('service_id',sid,'description','Production','quantity',2,'unit_price',500)),'discount',100,'tax_rate',10,'valid_until',current_date+10,'notes','Test terms'),false)->>'id')::uuid;
 if (select status from quotations where id=qid)<>'DRAFT' then raise exception 'Draft save failed'; end if;
 perform manage_quotation(admin_id,qid,'send');
 perform project_action(customer_id,pid,'accept','{}');
 if exists(select 1 from invoices where project_id=pid) then raise exception 'Invoice created before delivery'; end if;
 if (select total from quotations where project_id=pid)<>990 then raise exception 'Quotation total including tax incorrect'; end if;
 perform project_action(admin_id,pid,'status','{"status":"IN_PROGRESS"}');
 perform project_action(admin_id,pid,'deliverable','{"name":"Draft","path":"test/draft.pdf"}');
 perform project_action(admin_id,pid,'status','{"status":"WAITING_REVIEW"}');
 select id into did from deliverables where project_id=pid;
 perform project_action(customer_id,pid,'revision',jsonb_build_object('description','Revise draft','deliverable_id',did));
 if (select status from projects where id=pid)<>'REVISION' then raise exception 'Revision workflow failed'; end if;
 perform project_action(admin_id,pid,'deliverable','{"name":"Final","path":"test/final.pdf"}');
 perform project_action(admin_id,pid,'status','{"status":"WAITING_REVIEW"}');
 perform project_action(customer_id,pid,'complete','{}');
 if (select status from projects where id=pid)<>'COMPLETED' then raise exception 'Acceptance failed'; end if;
 if (select status from deliverables where id=did)<>'REVISION_REQUIRED' then raise exception 'Historical rejected version was falsely approved'; end if;
 if (select status from invoices where project_id=pid)<>'DRAFT' then raise exception 'Missing draft invoice'; end if;
 perform project_action(admin_id,pid,'issue-invoice',jsonb_build_object('due_date',current_date+14));
 if (select status from invoices where project_id=pid)<>'PENDING' then raise exception 'Invoice issue failed'; end if;
 perform project_action(admin_id,pid,'paid','{}');
 if (select status from invoices where project_id=pid)<>'PAID' then raise exception 'Payment recording failed'; end if;
 if has_function_privilege('authenticated','public.project_action(uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'Authenticated role can forge RPC actor'; end if;
 if has_function_privilege('service_role','public.project_action_base(uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'Legacy workflow bypass is executable'; end if;
 perform set_config('request.jwt.claim.sub',other_auth::text,true);
 if owns_project(pid) then raise exception 'RLS helper permits other customer'; end if;
 execute 'set local role authenticated';
 if exists(select 1 from projects where id=pid) then raise exception 'RLS exposes another customer project'; end if;
 if exists(select 1 from invoices where project_id=pid) then raise exception 'RLS exposes another customer invoice'; end if;
 if exists(select 1 from leads where id=lid) then raise exception 'RLS exposes leads to customers'; end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',customer_auth::text,true);
 if not owns_project(pid) then raise exception 'Owner RLS helper failed'; end if;
 update profiles set active=false where id=customer_id;
 if owns_project(pid) then raise exception 'Inactive customer RLS access'; end if;
 if not exists(select 1 from audit_logs where entity_id=pid and actor_id=admin_id) then raise exception 'Missing workflow audit'; end if;
end $$;
