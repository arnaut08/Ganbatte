create table if not exists public.kanji_groups (
  id text primary key,
  name text not null,
  difficulty text not null default 'n5' check (difficulty in ('n5', 'n4', 'n3', 'n2', 'n1')),
  sort_order integer not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  model text not null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kanji_characters (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.kanji_groups(id) on delete cascade,
  character text not null,
  readings jsonb not null,
  meaning text not null,
  example_japanese text not null,
  example_english text not null,
  sort_order integer not null,
  difficulty text not null default 'n5' check (difficulty in ('n5', 'n4', 'n3', 'n2', 'n1')),
  status text not null default 'published' check (status in ('draft', 'published')),
  unique (character, difficulty)
);

create index if not exists kanji_groups_status_difficulty_idx
  on public.kanji_groups (status, difficulty, sort_order);

create index if not exists kanji_characters_group_status_idx
  on public.kanji_characters (group_id, status, sort_order);

alter table public.kanji_groups enable row level security;
alter table public.kanji_characters enable row level security;

create policy "Authenticated users can view published Kanji groups"
  on public.kanji_groups for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "Authenticated users can view published Kanji characters"
  on public.kanji_characters for select
  using (auth.role() = 'authenticated' and status = 'published');