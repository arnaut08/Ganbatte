create table if not exists public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_number integer not null unique check (lesson_number between 1 and 12),
  content jsonb not null,
  content_version integer not null default 1,
  model text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grammar_lessons_status_number_idx
  on public.grammar_lessons (status, lesson_number);

alter table public.grammar_lessons enable row level security;

create policy "Authenticated users can view published grammar lessons"
  on public.grammar_lessons for select
  using (auth.role() = 'authenticated' and status = 'published');