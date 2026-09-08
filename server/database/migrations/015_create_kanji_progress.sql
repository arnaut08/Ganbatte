create table if not exists public.user_kanji_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.kanji_characters(id) on delete cascade,
  srs_stage integer not null default 0,
  interval_days integer not null default 0,
  ease_factor numeric(4, 2) not null default 2.50,
  repetitions integer not null default 0,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (user_id, character_id)
);

create index if not exists user_kanji_progress_user_review_idx
  on public.user_kanji_progress (user_id, next_review_at);

alter table public.user_kanji_progress enable row level security;

create policy "Users can view their Kanji progress"
  on public.user_kanji_progress for select
  using (auth.uid() = user_id);

create policy "Users can create their Kanji progress"
  on public.user_kanji_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their Kanji progress"
  on public.user_kanji_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their Kanji progress"
  on public.user_kanji_progress for delete
  using (auth.uid() = user_id);

create table if not exists public.user_kanji_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null references public.kanji_groups(id) on delete cascade,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  passed boolean not null default false,
  completed_at timestamptz not null default now(),
  unique (user_id, group_id),
  check (score <= total_questions)
);

alter table public.user_kanji_quiz_results enable row level security;

create policy "Users can manage their Kanji quiz results"
  on public.user_kanji_quiz_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);