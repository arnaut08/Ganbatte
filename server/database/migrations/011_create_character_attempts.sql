create table if not exists public.character_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null,
  character text not null,
  character_type text not null check (character_type in ('kanji', 'kana')),
  prompt_mode text not null check (prompt_mode in ('reading', 'meaning')),
  answer text not null,
  is_correct boolean not null,
  confidence text check (confidence in ('again', 'hard', 'easy')),
  used_hint boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, character_id, character_type)
);

create index if not exists character_attempts_user_type_created_idx
  on public.character_attempts (user_id, character_type, created_at desc);

alter table public.character_attempts enable row level security;
create policy "Users can view their character attempts"
  on public.character_attempts for select using (auth.uid() = user_id);
create policy "Users can create their character attempts"
  on public.character_attempts for insert with check (auth.uid() = user_id);
create policy "Users can update their character attempts"
  on public.character_attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.character_attempts (
  user_id, character_id, character, character_type, prompt_mode, answer,
  is_correct, confidence, used_hint, created_at
)
select attempts.user_id, characters.id, attempts.character, 'kanji', attempts.prompt_mode, attempts.answer,
  attempts.is_correct, attempts.confidence, attempts.used_hint, attempts.created_at
from public.kanji_attempts as attempts
join public.kanji_characters as characters on characters.character = attempts.character
on conflict (user_id, character_id, character_type) do nothing;

drop table if exists public.kanji_attempts;