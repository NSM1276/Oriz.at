-- ══════════════════════════════════════════════════════════════════════════
-- ORIZ Casa — schema + tables + RLS + seed
-- Applied via Supabase MCP as two migrations:
--   1) casa_schema       (DDL: schema, tables, indexes, RLS, grants)
--   2) casa_seed_belmondo (seed Pension Belmondo + 6 content blocks)
--
-- Manual step required ONCE in Supabase dashboard:
--   Settings → API → "Exposed schemas" → add "casa"
--   (otherwise PostgREST won't expose tables under non-public schema)
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Schema ─────────────────────────────────────────────────────────────

create schema if not exists casa;

-- ── 2. Tables ─────────────────────────────────────────────────────────────

create table casa.properties (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  city          text,
  about         text,
  color_bg      text default '#0A0A0A',
  color_primary text default '#C69B3C',
  logo_url      text,
  owner_id      uuid references auth.users(id) on delete restrict,
  created_at    timestamptz default now()
);
create index casa_properties_slug_idx  on casa.properties(slug);
create index casa_properties_owner_idx on casa.properties(owner_id);

create table casa.content_blocks (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references casa.properties(id) on delete cascade,
  block_type  text not null,           -- wifi, checkin, breakfast, rules, parking, contact, other...
  icon        text,                    -- reserved for future use
  title_de    text,
  title_en    text,
  body_de     text,
  body_en     text,
  position    int  not null default 0,
  updated_at  timestamptz default now()
);
create index casa_content_blocks_property_idx on casa.content_blocks(property_id, position);

create table casa.photos (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references casa.properties(id) on delete cascade,
  url         text not null,
  position    int  not null default 0,
  created_at  timestamptz default now()
);
create index casa_photos_property_idx on casa.photos(property_id, position);

create table casa.leads (
  id              uuid primary key default gen_random_uuid(),
  property_name   text,
  property_type   text,
  units           text,
  languages       text,
  contact_name    text,
  email           text not null,
  phone           text,
  website         text,
  message         text,
  source          text default 'casa_landing',
  created_at      timestamptz default now()
);
create index casa_leads_created_idx on casa.leads(created_at desc);

-- ── 3. RLS ────────────────────────────────────────────────────────────────

alter table casa.properties     enable row level security;
alter table casa.content_blocks enable row level security;
alter table casa.photos         enable row level security;
alter table casa.leads          enable row level security;

-- Public read for guest pages
create policy "casa properties public read"
  on casa.properties for select using (true);

create policy "casa content_blocks public read"
  on casa.content_blocks for select using (true);

create policy "casa photos public read"
  on casa.photos for select using (true);

-- Owner write
create policy "casa properties owner all"
  on casa.properties for all
  using (auth.uid() = owner_id);

create policy "casa content_blocks owner all"
  on casa.content_blocks for all
  using (exists (
    select 1 from casa.properties p
    where p.id = content_blocks.property_id and p.owner_id = auth.uid()
  ));

create policy "casa photos owner all"
  on casa.photos for all
  using (exists (
    select 1 from casa.properties p
    where p.id = photos.property_id and p.owner_id = auth.uid()
  ));

-- Leads: anon can insert (landing form), authenticated can read
create policy "casa leads anon insert"
  on casa.leads for insert
  to anon, authenticated
  with check (true);

create policy "casa leads auth read"
  on casa.leads for select
  to authenticated
  using (true);

-- ── 4. Grants (needed for non-public schema to be exposed by PostgREST) ───

grant usage on schema casa to anon, authenticated, service_role;
grant select on all tables in schema casa to anon, authenticated, service_role;
grant insert on casa.leads to anon, authenticated;
grant all on casa.properties, casa.content_blocks, casa.photos to authenticated, service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- SEED — Pension Belmondo demo (slug 'belmondo')
-- ══════════════════════════════════════════════════════════════════════════

with new_property as (
  insert into casa.properties (slug, name, city, about, color_bg, color_primary)
  values (
    'belmondo',
    'Pension Belmondo',
    'Wien',
    'Eine ruhige Pension im Herzen Wiens, zwei Schritte vom Belvedere.',
    '#0A0A0A',
    '#C69B3C'
  )
  returning id
)
insert into casa.content_blocks (property_id, block_type, title_de, title_en, body_de, body_en, position)
select
  np.id, t.block_type, t.title_de, t.title_en, t.body_de, t.body_en, t.position
from new_property np,
(values
  (
    'wifi', 'WLAN', 'Wi-Fi',
    E'Netzwerk: Belmondo_Guest\nPasswort: wien2026',
    E'Network: Belmondo_Guest\nPassword: wien2026',
    0
  ),
  (
    'checkin', 'Check-in · Check-out', 'Check-in · Check-out',
    E'Check-in ab 15:00\nCheck-out bis 10:00',
    E'Check-in from 15:00\nCheck-out by 10:00',
    1
  ),
  (
    'breakfast', 'Frühstück', 'Breakfast',
    '07:00 – 10:00 · Frühstücksraum EG · Hausgemachtes Brot und regionaler Schinken.',
    '07:00 – 10:00 · Breakfast room ground floor · Homemade bread and regional ham.',
    2
  ),
  (
    'rules', 'Hausordnung', 'House Rules',
    'Bitte Ruhezeiten von 22:00 – 8:00 einhalten. Im ganzen Haus rauchfrei.',
    'Please respect quiet hours 22:00 – 8:00. No smoking inside.',
    3
  ),
  (
    'parking', 'Parken', 'Parking',
    'Tiefgarage Süd, 80 m entfernt · €18 pro Nacht.',
    'Underground garage South, 80 m away · €18 per night.',
    4
  ),
  (
    'contact', 'Kontakt', 'Contact',
    E'Tel: +43 1 555 1234\nE-Mail: rezeption@belmondo-wien.at',
    E'Phone: +43 1 555 1234\nEmail: reception@belmondo-wien.at',
    5
  )
) as t(block_type, title_de, title_en, body_de, body_en, position);
