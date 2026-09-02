alter table public.profiles
  add column if not exists location text,
  add column if not exists learning_goal text,
  add column if not exists bio text,
  add column if not exists avatar_url text;

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);