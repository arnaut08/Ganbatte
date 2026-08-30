-- Grammar quiz results for the Genki Vol. 1 learning module.
-- One row per completed practice quiz. `lesson_number` 0 is reserved for
-- mixed-lesson ("bridging") sessions; the overview RPC aggregates 1-12 only.
-- `passed` mirrors the client rule: score_percentage >= 80.

create table if not exists public.grammar_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_number integer not null check (lesson_number between 0 and 12),
  total_questions integer not null check (total_questions > 0),
  correct_count integer not null check (correct_count >= 0 and correct_count <= total_questions),
  score_percentage numeric(5, 2) not null check (score_percentage >= 0 and score_percentage <= 100),
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  check (passed = (score_percentage >= 80))
);

create index if not exists grammar_quiz_results_user_lesson_idx
  on public.grammar_quiz_results (user_id, lesson_number);

alter table public.grammar_quiz_results enable row level security;

create policy "Users can manage their own grammar quiz results"
  on public.grammar_quiz_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Aggregated per-lesson grammar progress for the Mastery Passport:
-- { total_lessons: 12, lessons: [{ lesson_number, is_cleared, is_mastered,
--   best_score, total_attempts }] }
--
-- is_cleared:  the learner passed the lesson at least once (score >= 80).
-- is_mastered: the learner hit a perfect score on any attempt, OR passed on
--              two consecutive UTC calendar days (window functions pair each
--              attempt with the previous one per lesson; a failed attempt or
--              a day gap breaks the streak).
create or replace function public.get_grammar_overview(
  user_id_input uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  with ranked_attempts as (
    select
      gqr.lesson_number,
      gqr.score_percentage,
      gqr.passed,
      (gqr.created_at at time zone 'UTC')::date as attempt_date,
      lag((gqr.created_at at time zone 'UTC')::date) over (
        partition by gqr.lesson_number
        order by gqr.created_at asc
      ) as prev_attempt_date,
      lag(gqr.passed) over (
        partition by gqr.lesson_number
        order by gqr.created_at asc
      ) as prev_passed
    from public.grammar_quiz_results gqr
    where gqr.user_id = user_id_input
      and gqr.lesson_number between 1 and 12
  ),
  lesson_stats as (
    select
      lesson_number,
      bool_or(passed) as is_cleared,
      bool_or(
        score_percentage >= 100
        or (
          passed = true
          and prev_passed = true
          and attempt_date = prev_attempt_date + interval '1 day'
        )
      ) as is_mastered,
      coalesce(max(score_percentage), 0) as best_score,
      count(*)::int as total_attempts
    from ranked_attempts
    group by lesson_number
  ),
  all_lessons as (
    select generate_series(1, 12) as lesson_number
  )
  select jsonb_build_object(
    'total_lessons', 12,
    'lessons', jsonb_agg(
      jsonb_build_object(
        'lesson_number', al.lesson_number,
        'is_cleared', coalesce(ls.is_cleared, false),
        'is_mastered', coalesce(ls.is_mastered, false),
        'best_score', coalesce(ls.best_score, 0),
        'total_attempts', coalesce(ls.total_attempts, 0)
      ) order by al.lesson_number
    )
  )
  into result
  from all_lessons al
  left join lesson_stats ls on al.lesson_number = ls.lesson_number;

  return result;
end;
$$;
