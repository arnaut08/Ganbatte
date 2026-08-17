create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_friend_idx
  on public.friendships (friend_id, user_id);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = user_id);

create policy "Users can insert their own friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id);
