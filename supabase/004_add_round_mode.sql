-- Migration: Spielmodus für Runden (Offline-Modus mit echten Karten)
-- Im Supabase Dashboard unter "SQL Editor" ausführen — VOR dem Deploy des
-- Offline-Modus, sonst schlägt das Laden der History (select ...,m) fehl.
-- null = digitale Runde (alle bestehenden Zeilen), 'offline' = echte Karten.

alter table public.rounds add column if not exists m text;
alter table public.rounds drop constraint if exists rounds_m_valid;
alter table public.rounds add constraint rounds_m_valid check (m is null or m = 'offline');
