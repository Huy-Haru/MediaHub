begin;

-- Public talent marketplace. Profiles remain the single source of identity while
-- creator_profiles stores searchable professional information.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('CUSTOMER','ADMIN','STAFF','BUSINESS','CREATOR','STUDENT_CREATOR'));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'sparkles',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  title text not null,
  bio text not null default '',
  avatar_url text,
  cover_url text,
  location text not null default '',
  university text,
  major text,
  study_year integer check (study_year between 1 and 8),
  experience_level text not null default 'JUNIOR' check (experience_level in ('STUDENT','JUNIOR','MID','SENIOR','LEAD')),
  tools text[] not null default '{}',
  languages text[] not null default '{Tiếng Việt}',
  rating numeric(2,1) check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  completed_projects integer not null default 0 check (completed_projects >= 0),
  completion_rate integer not null default 100 check (completion_rate between 0 and 100),
  response_rate integer not null default 100 check (response_rate between 0 and 100),
  response_time text not null default 'Trong 2 giờ',
  availability text not null default 'AVAILABLE' check (availability in ('AVAILABLE','LIMITED','BUSY','UNAVAILABLE')),
  price_from numeric(16,2) check (price_from >= 0),
  verified boolean not null default false,
  featured boolean not null default false,
  social_links jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.creator_categories (
  creator_id uuid references public.creator_profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (creator_id, category_id)
);
create table public.creator_skills (
  creator_id uuid references public.creator_profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  proficiency integer not null default 3 check (proficiency between 1 and 5),
  primary key (creator_id, skill_id)
);
create table public.creator_portfolio (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  thumbnail_url text,
  gallery text[] not null default '{}',
  video_url text,
  category text not null default '',
  skills text[] not null default '{}',
  client text not null default '',
  project_year integer,
  project_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.project_applications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  cover_letter text not null,
  proposed_price numeric(16,2) not null check (proposed_price >= 0),
  proposed_duration text not null,
  attachments text[] not null default '{}',
  status text not null default 'PENDING' check (status in ('PENDING','SHORTLISTED','ACCEPTED','REJECTED','WITHDRAWN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, project_id)
);
create table public.favorite_creators (
  profile_id uuid references public.profiles(id) on delete cascade,
  creator_id uuid references public.creator_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, creator_id)
);
create table public.saved_projects (
  profile_id uuid references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create index creator_profiles_discovery_idx on public.creator_profiles(featured desc, verified desc, rating desc nulls last);
create index creator_profiles_location_idx on public.creator_profiles(location);
create index creator_profiles_availability_idx on public.creator_profiles(availability);
create index creator_portfolio_creator_idx on public.creator_portfolio(creator_id, created_at desc);
create index project_applications_project_idx on public.project_applications(project_id, status, created_at desc);

alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.creator_categories enable row level security;
alter table public.creator_skills enable row level security;
alter table public.creator_portfolio enable row level security;
alter table public.project_applications enable row level security;
alter table public.favorite_creators enable row level security;
alter table public.saved_projects enable row level security;
create policy public_categories on public.categories for select to anon, authenticated using (active);
create policy public_skills on public.skills for select to anon, authenticated using (active);
create policy public_creators on public.creator_profiles for select to anon, authenticated using (true);
create policy public_creator_categories on public.creator_categories for select to anon, authenticated using (true);
create policy public_creator_skills on public.creator_skills for select to anon, authenticated using (true);
create policy public_creator_portfolio on public.creator_portfolio for select to anon, authenticated using (true);

commit;
