create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  companion_user_id uuid references auth.users(id) on delete set null,
  assessment_type text not null default 'kana-reading',
  score_percentage integer not null check (score_percentage between 0 and 100),
  correct_questions integer not null check (correct_questions >= 0),
  total_questions integer not null check (total_questions > 0),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assessment_results_user_created_idx
  on public.assessment_results (user_id, created_at desc);

create index if not exists assessment_results_companion_idx
  on public.assessment_results (companion_user_id);

alter table public.assessment_results enable row level security;

create policy "Users can view their own assessment results"
  on public.assessment_results for select
  using (auth.uid() = user_id);

create policy "Users can create their own assessment results"
  on public.assessment_results for insert
  with check (auth.uid() = user_id);
