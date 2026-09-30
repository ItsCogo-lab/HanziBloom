-- Copia en la nube de los datos de cada usuario de HanziBloom.
-- Se ejecuta una vez en Supabase → SQL Editor.
--
-- Una fila por usuario con el mismo JSON que la app guarda en localStorage
-- (progreso, sets, sets propios y ajustes). Las políticas hacen que cada
-- usuario solo pueda leer y escribir su propia fila: por eso la clave pública (publishable)
-- puede ir en el navegador.

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
