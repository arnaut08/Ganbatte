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
  with stage_items as (
    select
      vi.stage_number,
      vi.theme,
      count(distinct vi.id) as total_words
    from public.vocab_items vi
    where vi.jlpt_level = p_level
    group by vi.stage_number, vi.theme
  ),
  progress_by_vocab as (
    select
      uvp.vocab_id,
      max(uvp.srs_stage) as srs_stage,
      min(uvp.next_review_at) as next_review_at
    from public.user_vocab_progress uvp
    where uvp.user_id = p_user_id
    group by uvp.vocab_id
  ),
  quiz_by_stage as (
    select
      usq.jlpt_level,
      usq.stage_number,
      bool_or(usq.passed) as quiz_passed
    from public.user_stage_quiz_results usq
    where usq.user_id = p_user_id
    group by usq.jlpt_level, usq.stage_number
  ),
  stage_progress as (
    select
      vi.stage_number,
      vi.theme,
      count(distinct vi.id) filter (where coalesce(p.srs_stage, 0) >= 1) as learned_words,
      count(distinct vi.id) filter (where coalesce(p.srs_stage, 0) >= 4) as mastered_words,
      count(distinct vi.id) filter (where p.next_review_at <= now()) as due_words
    from public.vocab_items vi
    left join progress_by_vocab p on p.vocab_id = vi.id
    where vi.jlpt_level = p_level
    group by vi.stage_number, vi.theme
  )
  select
    si.stage_number,
    si.theme,
    si.total_words,
    sp.learned_words,
    sp.mastered_words,
    sp.due_words,
    coalesce(q.quiz_passed, false) as quiz_passed,
    sp.learned_words = si.total_words and coalesce(q.quiz_passed, false) as is_cleared,
    sp.mastered_words = si.total_words and coalesce(q.quiz_passed, false) as is_mastered
  from stage_items si
  join stage_progress sp
    on sp.stage_number = si.stage_number and sp.theme = si.theme
  left join quiz_by_stage q
    on q.jlpt_level = p_level and q.stage_number = si.stage_number
  order by si.stage_number;
$$;