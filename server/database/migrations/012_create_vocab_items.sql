create table if not exists public.vocab_items (
  id uuid primary key default gen_random_uuid(),
  jlpt_level text not null check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  kanji text not null,
  kana text not null,
  furigana text not null,
  romaji text,
  theme text not null,
  stage_number integer not null,
  english text[] not null,
  pos text not null,
  metadata jsonb not null default '{}'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vocab_items_jlpt_level_idx
  on public.vocab_items (jlpt_level);

create index if not exists vocab_items_pos_idx
  on public.vocab_items (pos);

alter table public.vocab_items enable row level security;

create policy "Authenticated users can view vocabulary items"
  on public.vocab_items for select
  using (auth.role() = 'authenticated');

create table if not exists public.user_vocab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vocab_id uuid not null references public.vocab_items(id) on delete cascade,
  srs_stage integer not null default 0,
  interval_days integer not null default 0,
  ease_factor numeric(4, 2) not null default 2.50,
  repetitions integer not null default 0,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (user_id, vocab_id)
);

create index if not exists user_vocab_progress_user_review_idx
  on public.user_vocab_progress (user_id, next_review_at);

alter table public.user_vocab_progress enable row level security;

create policy "Users can view their vocabulary progress"
  on public.user_vocab_progress for select
  using (auth.uid() = user_id);

create policy "Users can create their vocabulary progress"
  on public.user_vocab_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their vocabulary progress"
  on public.user_vocab_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their vocabulary progress"
  on public.user_vocab_progress for delete
  using (auth.uid() = user_id);