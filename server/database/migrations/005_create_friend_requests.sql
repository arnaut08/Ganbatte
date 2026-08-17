create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create index if not exists friend_requests_receiver_idx
  on public.friend_requests (receiver_id, status);

create index if not exists friend_requests_sender_idx
  on public.friend_requests (sender_id, status);

alter table public.friend_requests enable row level security;

create policy "Users can view friend requests they are involved in"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert friend requests they send"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can update friend requests they receive"
  on public.friend_requests for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "Users can delete friend requests they are involved in"
  on public.friend_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);