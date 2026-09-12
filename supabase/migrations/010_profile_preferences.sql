begin;
create function public.update_profile(actor_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=actor_id and active) then raise exception 'Account not available'; end if;
 perform set_config('app.actor',actor_id::text,true);
 update profiles set full_name=payload->>'full_name',phone=payload->>'phone',
 avatar_url=case when payload?'avatar_url' then payload->>'avatar_url' else avatar_url end,
 notification_preferences=case when payload?'notification_preferences' then payload->'notification_preferences' else notification_preferences end
 where id=actor_id;
 if payload?'company_name' then update customers set company_name=payload->>'company_name' where profile_id=actor_id; end if;
 insert into audit_logs(actor_id,action,entity,entity_id) values(actor_id,'UPDATE','profiles',actor_id);
 return jsonb_build_object('id',actor_id);
end $$;
revoke all on function public.update_profile(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.update_profile(uuid,jsonb) to service_role;
create function public.filter_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=new.user_id and active and coalesce((notification_preferences->>'in_app')::boolean,true)) then return null; end if;
 return new;
end $$;
create trigger notification_preferences before insert on public.notifications for each row execute function public.filter_notification();
commit;
