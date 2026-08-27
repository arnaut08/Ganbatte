create table if not exists public.kana_groups (
  id text primary key,
  name text not null,
  script text not null check (script in ('hiragana', 'katakana')),
  sort_order integer not null,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create table if not exists public.kana_characters (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.kana_groups(id) on delete cascade,
  character text not null unique,
  romaji text not null,
  example_japanese text not null,
  example_romaji text not null,
  example_english text not null,
  sort_order integer not null,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create index if not exists kana_groups_status_sort_idx on public.kana_groups (status, sort_order);
create index if not exists kana_characters_group_status_sort_idx on public.kana_characters (group_id, status, sort_order);

alter table public.kana_groups enable row level security;
alter table public.kana_characters enable row level security;

create policy "Authenticated users can view published Kana groups"
  on public.kana_groups for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "Authenticated users can view published Kana characters"
  on public.kana_characters for select
  using (auth.role() = 'authenticated' and status = 'published');