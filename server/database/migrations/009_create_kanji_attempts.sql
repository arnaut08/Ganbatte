create table if not exists public.kanji_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character text not null,
  prompt_mode text not null check (prompt_mode in ('reading', 'meaning')),
  answer text not null,
  is_correct boolean not null,
  confidence text check (confidence in ('again', 'hard', 'easy')),
  used_hint boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists kanji_attempts_user_character_created_idx
  on public.kanji_attempts (user_id, character, created_at desc);

alter table public.kanji_attempts enable row level security;

create policy "Users can view their Kanji attempts"
  on public.kanji_attempts for select
  using (auth.uid() = user_id);

create policy "Users can create their Kanji attempts"
  on public.kanji_attempts for insert
  with check (auth.uid() = user_id);