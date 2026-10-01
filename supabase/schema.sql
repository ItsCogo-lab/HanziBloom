-- Cloud copy of each VividHanzi user's data.
-- Run once in Supabase → SQL Editor.
--
-- One row per user with the same JSON the app stores in localStorage
-- (progress, study sets, custom sets and settings). The policies only let
-- each user read and write their own row, which is why the publishable key
-- can ship to the browser.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Read own data" on public.user_data
  for select using ((select auth.uid()) = user_id);

create policy "Insert own data" on public.user_data
  for insert with check ((select auth.uid()) = user_id);

create policy "Update own data" on public.user_data
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
