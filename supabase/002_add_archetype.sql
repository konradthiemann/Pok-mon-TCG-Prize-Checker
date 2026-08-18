-- Migration: archetype-Spalte für Decks
-- Im Supabase Dashboard unter "SQL Editor" ausführen.

alter table public.decks add column if not exists archetype text;
