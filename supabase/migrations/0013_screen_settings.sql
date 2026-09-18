-- ORIZ 0013 — Screen (TV board) settings, one row per venue.
-- Missing row = defaults; the board never requires a row to exist.

create table if not exists screen_settings (
  venue_id      uuid primary key references venues(id) on delete cascade,
  active        boolean     not null default true,
  rotation_sec  int         not null default 10 check (rotation_sec between 3 and 60),
  spotlight     boolean     not null default true,
  color_bg      text,                                  -- null = inherit venues.color_bg
  color_primary text,                                  -- null = inherit venues.color_primary
  sections      jsonb,                                 -- null = all sections in position order; else ordered array of section ids
  hero_items    jsonb       not null default '{}'::jsonb, -- { [sectionId]: itemId } pinned hero dish
  style         jsonb       not null default '{}'::jsonb, -- future design knobs (no migration needed)
  updated_at    timestamptz not null default now()
);

alter table screen_settings enable row level security;

drop policy if exists "public read screen_settings" on screen_settings;
create policy "public read screen_settings" on screen_settings
  for select using (true);

drop policy if exists "owner all screen_settings" on screen_settings;
create policy "owner all screen_settings" on screen_settings
  for all
  using      (exists (select 1 from venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from venues v where v.id = venue_id and v.owner_id = auth.uid()));

grant select on screen_settings to anon, authenticated;
grant all    on screen_settings to service_role;
