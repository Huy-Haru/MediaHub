begin;

alter table public.conversations add column if not exists last_message_at timestamptz not null default now();
alter table public.conversations add column if not exists last_message_preview text not null default '';
alter table public.conversation_members add column if not exists muted boolean not null default false;
alter table public.conversation_members add column if not exists archived boolean not null default false;

create or replace function public.touch_conversation_message() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  update conversations set updated_at=now(), last_message_at=new.created_at,
    last_message_preview=left(new.content, 120) where id=new.conversation_id;
  insert into notifications(user_id,title,message,type)
  select cm.profile_id,'Tin nhắn mới',left(new.content,160),'MESSAGE'
  from conversation_members cm where cm.conversation_id=new.conversation_id and cm.profile_id<>new.sender_id;
  return new;
end $$;
drop trigger if exists conversation_message_touch on public.conversation_messages;
create trigger conversation_message_touch after insert on public.conversation_messages
for each row execute function public.touch_conversation_message();

create or replace function public.is_conversation_member(cid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from conversation_members cm join profiles p on p.id=cm.profile_id
    where cm.conversation_id=cid and p.auth_user_id=auth.uid())
$$;
drop policy if exists member_conversations on public.conversations;
create policy member_conversations on public.conversations for select to authenticated using (
  public.is_conversation_member(id)
);
drop policy if exists member_list on public.conversation_members;
create policy member_list on public.conversation_members for select to authenticated using (
  public.is_conversation_member(conversation_id)
);
drop policy if exists member_messages on public.conversation_messages;
create policy member_messages on public.conversation_messages for select to authenticated using (
  public.is_conversation_member(conversation_id)
);
alter table public.conversation_messages replica identity full;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='conversation_messages') then
    alter publication supabase_realtime add table public.conversation_messages;
  end if;
end $$;

create index if not exists conversation_members_profile_idx on public.conversation_members(profile_id, archived, conversation_id);
create index if not exists conversations_last_message_idx on public.conversations(last_message_at desc);
commit;
