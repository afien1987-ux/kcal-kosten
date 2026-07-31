-- Kalorien & Kosten — Schema für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" einmal komplett ausführen.

create table if not exists zutaten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  -- kcal100 ist "kcal pro Referenzmenge": bei einheit='g'/'ml' pro 100 Einheiten,
  -- bei einheit='Stück' pro 1 Stück (Name bleibt aus Kompatibilitätsgründen).
  kcal100 numeric not null,
  einheit text not null default 'g',
  einkaufsmenge numeric not null,
  einkaufspreis numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists rezepte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  portionen numeric not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists rezept_zutaten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rezept_id uuid not null references rezepte (id) on delete cascade,
  zutat_id uuid not null references zutaten (id) on delete cascade,
  menge numeric not null
);

create table if not exists log_eintraege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rezept_id uuid references rezepte (id) on delete set null,
  rezept_name text not null,
  faktor numeric not null default 1,
  kcal numeric not null,
  kosten numeric not null,
  kategorie text not null default 'Sonstiges',
  zeit timestamptz not null default now()
);

alter table zutaten enable row level security;
alter table rezepte enable row level security;
alter table rezept_zutaten enable row level security;
alter table log_eintraege enable row level security;

create policy "eigene zutaten lesen" on zutaten for select using (user_id = auth.uid());
create policy "eigene zutaten anlegen" on zutaten for insert with check (user_id = auth.uid());
create policy "eigene zutaten aendern" on zutaten for update using (user_id = auth.uid());
create policy "eigene zutaten loeschen" on zutaten for delete using (user_id = auth.uid());

create policy "eigene rezepte lesen" on rezepte for select using (user_id = auth.uid());
create policy "eigene rezepte anlegen" on rezepte for insert with check (user_id = auth.uid());
create policy "eigene rezepte aendern" on rezepte for update using (user_id = auth.uid());
create policy "eigene rezepte loeschen" on rezepte for delete using (user_id = auth.uid());

create policy "eigene rezept_zutaten lesen" on rezept_zutaten for select using (user_id = auth.uid());
create policy "eigene rezept_zutaten anlegen" on rezept_zutaten for insert with check (user_id = auth.uid());
create policy "eigene rezept_zutaten aendern" on rezept_zutaten for update using (user_id = auth.uid());
create policy "eigene rezept_zutaten loeschen" on rezept_zutaten for delete using (user_id = auth.uid());

create policy "eigene log_eintraege lesen" on log_eintraege for select using (user_id = auth.uid());
create policy "eigene log_eintraege anlegen" on log_eintraege for insert with check (user_id = auth.uid());
create policy "eigene log_eintraege aendern" on log_eintraege for update using (user_id = auth.uid());
create policy "eigene log_eintraege loeschen" on log_eintraege for delete using (user_id = auth.uid());
