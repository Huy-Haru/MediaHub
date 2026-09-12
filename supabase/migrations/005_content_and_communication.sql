begin;
create table public.partners (
 id uuid primary key default gen_random_uuid(), name text not null, logo text not null default '',
 website text not null default '', description text not null default '', industry text not null default '',
 display_order integer not null default 0 check(display_order>=0), active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.work_processes (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null,
 step integer not null check(step>0), icon text not null default '', image text not null default '',
 active boolean not null default false, display_order integer not null default 0 check(display_order>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.website_settings (
 id uuid primary key default gen_random_uuid(), key text not null unique check(key ~ '^[a-z0-9_]+$'),
 title text not null, content text not null default '', image text not null default '',
 published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
comment on table public.website_settings is 'Public website copy and contact configuration only; never store secrets here.';
create table public.project_messages (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
 sender_id uuid not null references public.profiles(id), message text not null check(length(message) between 1 and 5000),
 created_at timestamptz not null default now()
);
create table public.project_milestones (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
 title text not null check(length(title) between 1 and 200), description text not null default '',
 due_date date, status text not null default 'PENDING' check(status in ('PENDING','IN_PROGRESS','COMPLETED')),
 display_order integer not null default 0 check(display_order>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
 action text not null, entity text not null, entity_id uuid not null,
 created_at timestamptz not null default now()
);
create index partners_display_idx on public.partners(active,display_order);
create index work_processes_display_idx on public.work_processes(active,display_order);
create index project_messages_project_idx on public.project_messages(project_id,created_at);
create index project_messages_sender_idx on public.project_messages(sender_id);
create index project_milestones_project_idx on public.project_milestones(project_id,display_order);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id);
do $$ declare t text; begin
 foreach t in array array['partners','work_processes','website_settings','project_messages','project_milestones','audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy admin_read on public.%I for select to authenticated using(public.is_admin())',t);
 end loop;
 foreach t in array array['partners','work_processes','website_settings','project_milestones'] loop
  execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated()',t);
 end loop;
 foreach t in array array['partners','work_processes'] loop
  execute format('grant select on public.%I to anon',t);
  execute format('create policy public_read on public.%I for select to anon,authenticated using(active)',t);
 end loop;
end $$;
grant select on public.website_settings to anon;
create policy public_read on public.website_settings for select to anon,authenticated using(published);
create policy owner_read on public.project_messages for select to authenticated using(public.owns_project(project_id));
create policy owner_read on public.project_milestones for select to authenticated using(public.owns_project(project_id));
create function public.record_audit() returns trigger language plpgsql security definer set search_path=public as $$
declare actor uuid; record_id uuid;
begin
 actor:=nullif(current_setting('app.actor',true),'')::uuid;
 if actor is null then select id into actor from profiles where auth_user_id=auth.uid(); end if;
 if TG_OP='DELETE' then record_id:=old.id; else record_id:=new.id; end if;
 insert into audit_logs(actor_id,action,entity,entity_id) values(actor,TG_OP,TG_TABLE_NAME,record_id);
 return null;
end $$;
do $$ declare t text; begin
 foreach t in array array['leads','projects','quotations','invoices','services','portfolio','partners','work_processes','website_settings','revision_requests','deliverables','project_milestones'] loop
  execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.record_audit()',t);
 end loop;
end $$;
create function public.notify_project_message() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into notifications(user_id,title,message,type)
 select u.id,'New project message',p.title,'PROJECT_MESSAGE' from profiles u cross join projects p
 where p.id=new.project_id and u.id<>new.sender_id and (u.role='ADMIN' or u.id=(select profile_id from customers where id=p.customer_id));
 return new;
end $$;
create trigger project_message_notification after insert on public.project_messages for each row execute function public.notify_project_message();
commit;
