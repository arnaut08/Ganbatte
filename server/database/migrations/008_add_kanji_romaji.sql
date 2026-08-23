alter table public.kanji_characters
  add column if not exists romaji text not null default '';

alter table public.kanji_characters
  alter column romaji set not null;

alter table public.kanji_characters
  alter column romaji drop default;