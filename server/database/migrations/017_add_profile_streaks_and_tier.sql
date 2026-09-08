-- Cross-device streak tracking and dynamic account tiers.
-- Adds daily-activity bookkeeping to profiles and an RPC the server calls on
-- key learning actions (first correct Kana recall, Vocab stage clear, Kanji
-- session completion, PvP match end) so the streak stays correct no matter
-- which device the action came from.
alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_active_date date,
  add column if not exists account_tier text not null default 'N5 NOVICE';

-- Records one activity day for a user and returns the streak outcome.
--
-- Streak rules:
--   * no activity yet          -> streak starts at 1 (streak_extended)
--   * last_active_date = today -> no-op, streak unchanged (idempotent)
--   * last_active_date = yesterday -> current_streak + 1 (streak_extended)
--   * missed more than a day   -> streak resets to 1 (streak_extended)
--
-- `streak_extended` is true whenever a NEW activity day was recorded (streak
-- started, extended, or restarted) so the client celebrates the first action
-- of every day; it is false only for same-day repeat actions.
--
-- The RPC is security definer so it can write the row regardless of RLS, but
-- authenticated callers are pinned to their own profile: `auth.uid()` wins
-- over the passed id. Only the service role may target an arbitrary user.
create or replace function public.record_user_activity(p_user_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_last_active date;
  v_current_streak integer;
  v_longest_streak integer;
  v_previous_tier text;
  v_new_streak integer;
  v_extended boolean;
begin
  v_user_id := coalesce(auth.uid(), p_user_id);
  if v_user_id is null then
    raise exception 'record_user_activity requires an authenticated user or an explicit user_id';
  end if;

  select last_active_date, current_streak, longest_streak, account_tier
    into v_last_active, v_current_streak, v_longest_streak, v_previous_tier
  from public.profiles
  where id = v_user_id;

  if not found then
    -- Profile rows are normally created by the signup trigger; fall back for
    -- users that predate it so activity is never silently dropped.
    insert into public.profiles (id, display_name)
    values (
      v_user_id,
      coalesce((
        select nullif(trim(u.raw_user_meta_data ->> 'full_name'), '')
        from auth.users u
        where u.id = v_user_id
      ), 'Learner')
    )
    on conflict (id) do nothing;

    select last_active_date, current_streak, longest_streak, account_tier
      into v_last_active, v_current_streak, v_longest_streak, v_previous_tier
    from public.profiles
    where id = v_user_id;
  end if;

  if v_last_active is null then
    -- First activity ever: the streak starts today and is worth celebrating.
    v_new_streak := 1;
    v_extended := true;
  elsif v_last_active = current_date then
    -- Already recorded today: idempotent no-op for repeat actions.
    v_new_streak := v_current_streak;
    v_extended := false;
  elsif v_last_active = current_date - 1 then
    v_new_streak := v_current_streak + 1;
    v_extended := true;
  else
    -- Missed more than a day: a new streak starts today.
    v_new_streak := 1;
    v_extended := true;
  end if;

  update public.profiles
  set current_streak = v_new_streak,
      longest_streak = greatest(v_longest_streak, v_new_streak),
      last_active_date = current_date,
      updated_at = now()
  where id = v_user_id;

  return json_build_object(
    'current_streak', v_new_streak,
    'streak_extended', v_extended,
    'previous_tier', v_previous_tier
  );
end;
$$;

revoke execute on function public.record_user_activity(uuid) from anon, public;
grant execute on function public.record_user_activity(uuid) to authenticated, service_role;
