begin;
create or replace function public.manage_user(actor_id uuid,target_id uuid,new_role text,new_active boolean) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(736231928);
 if not exists(select 1 from profiles where id=actor_id and role='ADMIN' and active) then raise exception 'Administrator required'; end if;
 if new_role not in ('ADMIN','CUSTOMER','STAFF') then raise exception 'Unsupported role'; end if;
 if actor_id=target_id and (new_role<>'ADMIN' or not new_active) then raise exception 'Cannot remove your own administrator access'; end if;
 if not exists(select 1 from profiles where id=target_id) then raise exception 'Account not found'; end if;
 if not exists(select 1 from profiles where role='ADMIN' and active and id<>target_id) and (new_role<>'ADMIN' or not new_active) then raise exception 'At least one active administrator is required'; end if;
 perform set_config('app.actor',actor_id::text,true);
 update profiles set role=new_role,active=new_active where id=target_id;
 if new_role='CUSTOMER' then insert into customers(profile_id) values(target_id) on conflict(profile_id) do nothing; end if;
 insert into audit_logs(actor_id,action,entity,entity_id) values(actor_id,'UPDATE','profiles',target_id);
 return jsonb_build_object('id',target_id);
end $$;
revoke all on function public.manage_user(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.manage_user(uuid,uuid,text,boolean) to service_role;

commit;
