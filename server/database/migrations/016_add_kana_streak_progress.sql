-- Streak-based mastery tracking for character recall.
-- Replaces SRS/interval bookkeeping: a character is mastered when the user
-- answers it correctly 3 times in a row (correct_streak >= 3).
alter table public.character_attempts
  add column if not exists correct_streak integer not null default 0,
  add column if not exists total_attempts integer not null default 0;