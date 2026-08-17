-- Prize Checker — Supabase Schema
-- Im Supabase Dashboard unter "SQL Editor" ausführen.
-- Speichert Decks + Runden-History pro Account, abgesichert per Row Level Security.

-- Decks (client-generierte id, pro User eindeutig)
create table if not exists public.decks (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  id         text        not null,
  name       text        not null,
  format     text        not null default 'Standard',
  cards      jsonb       not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.decks enable row level security;

create policy "decks_select_own" on public.decks
  for select using (auth.uid() = user_id);
create policy "decks_insert_own" on public.decks
  for insert with check (auth.uid() = user_id);
create policy "decks_update_own" on public.decks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "decks_delete_own" on public.decks
  for delete using (auth.uid() = user_id);

-- Runden-History (eine Zeile pro gespielter Runde)
create table if not exists public.rounds (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  d          text        not null,          -- Deck-Id
  t          numeric     not null,          -- Zeit in Sekunden
  h          int         not null,          -- Treffer 0..6
  ts         bigint      not null,          -- Client-Zeitstempel (ms)
  created_at timestamptz not null default now()
);

alter table public.rounds enable row level security;

create policy "rounds_select_own" on public.rounds
  for select using (auth.uid() = user_id);
create policy "rounds_insert_own" on public.rounds
  for insert with check (auth.uid() = user_id);
create policy "rounds_delete_own" on public.rounds
  for delete using (auth.uid() = user_id);

create index if not exists rounds_user_ts_idx on public.rounds (user_id, ts);
