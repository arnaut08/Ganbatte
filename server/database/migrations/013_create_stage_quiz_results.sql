create table if not exists public.user_stage_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jlpt_level text not null default 'N5' check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  stage_number integer not null check (stage_number > 0),
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  passed boolean not null default false,
  completed_at timestamptz not null default now(),
  unique (user_id, jlpt_level, stage_number),
  check (score <= total_questions)
);

create index if not exists user_stage_quiz_results_user_level_idx
  on public.user_stage_quiz_results (user_id, jlpt_level, stage_number);

alter table public.user_stage_quiz_results enable row level security;

create policy "Users can manage their own quiz results"
  on public.user_stage_quiz_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.get_vocab_stage_overview(
  p_level text default 'N5',
  p_user_id uuid default auth.uid()
)
returns table (
  stage_number integer,
  theme text,
  total_words bigint,
  learned_words bigint,
  mastered_words bigint,
  due_words bigint,
  quiz_passed boolean,
  is_cleared boolean,
  is_mastered boolean
)
language sql
security definer
set search_path = public
as $$
  select
    vi.stage_number,
    vi.theme,
    count(vi.id) as total_words,
    count(case when uvp.srs_stage >= 1 then 1 end) as learned_words,
    count(case when uvp.srs_stage >= 4 then 1 end) as mastered_words,
    count(case when uvp.next_review_at <= now() then 1 end) as due_words,
    coalesce(bool_or(usq.passed), false) as quiz_passed,
    count(case when uvp.srs_stage >= 1 then 1 end) = count(vi.id)
      and coalesce(bool_or(usq.passed), false) as is_cleared,
    count(case when uvp.srs_stage >= 4 then 1 end) = count(vi.id)
      and coalesce(bool_or(usq.passed), false) as is_mastered
  from public.vocab_items vi
  left join public.user_vocab_progress uvp
    on vi.id = uvp.vocab_id and uvp.user_id = p_user_id
  left join public.user_stage_quiz_results usq
    on vi.stage_number = usq.stage_number
    and vi.jlpt_level = usq.jlpt_level
    and usq.user_id = p_user_id
  where vi.jlpt_level = p_level
  group by vi.stage_number, vi.theme
  order by vi.stage_number;
$$;