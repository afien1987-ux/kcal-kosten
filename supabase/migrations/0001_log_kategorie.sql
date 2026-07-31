-- Ergänzt Mahlzeit-Kategorien (Frühstück/Mittag/Abend/Snack) für bereits bestehende Projekte.
-- Im Supabase SQL Editor einmal ausführen, falls schema.sql schon vorher gelaufen ist.

alter table log_eintraege add column if not exists kategorie text not null default 'Sonstiges';
