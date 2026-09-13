begin;
create table public.creator_reviews (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  content text not null,
  created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '',
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, profile_id)
);
create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  attachments text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table public.project_team_members (
  project_id uuid references public.projects(id) on delete cascade,
  creator_id uuid references public.creator_profiles(id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  primary key (project_id, creator_id)
);
create index creator_reviews_creator_idx on public.creator_reviews(creator_id, created_at desc);
create index conversation_messages_idx on public.conversation_messages(conversation_id, created_at);
create index conversations_project_idx on public.conversations(project_id);
alter table public.creator_reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.project_team_members enable row level security;
create policy public_creator_reviews on public.creator_reviews for select to anon,authenticated using(true);
commit;
