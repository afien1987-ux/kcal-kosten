-- Ergänzt Mengeneinheiten (g / ml / Stück) für bereits bestehende Projekte.
-- Im Supabase SQL Editor einmal ausführen, falls schema.sql schon vorher gelaufen ist.

alter table zutaten add column if not exists einheit text not null default 'g';
