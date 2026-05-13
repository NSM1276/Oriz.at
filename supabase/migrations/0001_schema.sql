-- ORIZ — core schema (0001)
-- Tenants
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  about text,
  currency text not null default 'EUR',
  owner_id uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  position int not null default 0
);
create index if not exists sections_venue_idx on sections(venue_id, position);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  is_active boolean not null default true,
  position int not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists items_section_idx on items(section_id, position);
create index if not exists items_venue_idx on items(venue_id);

create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists items_touch on items;
create trigger items_touch before update on items
  for each row execute function touch_updated_at();

-- RLS
alter table venues   enable row level security;
alter table sections enable row level security;
alter table items    enable row level security;

-- Public read
drop policy if exists "public read venues" on venues;
create policy "public read venues" on venues for select using (true);

drop policy if exists "public read sections" on sections;
create policy "public read sections" on sections for select using (true);

drop policy if exists "public read items" on items;
create policy "public read items" on items for select using (true);

-- Owner write
drop policy if exists "owner all venues" on venues;
create policy "owner all venues" on venues for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owner all sections" on sections;
create policy "owner all sections" on sections for all
  using (exists (select 1 from venues v where v.id = sections.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from venues v where v.id = sections.venue_id and v.owner_id = auth.uid()));

drop policy if exists "owner all items" on items;
create policy "owner all items" on items for all
  using (exists (select 1 from venues v where v.id = items.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from venues v where v.id = items.venue_id and v.owner_id = auth.uid()));

-- Owner also needs SELECT visibility on inactive rows
drop policy if exists "owner read items" on items;
create policy "owner read items" on items for select
  using (exists (select 1 from venues v where v.id = items.venue_id and v.owner_id = auth.uid()));
