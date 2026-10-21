-- ORIZ — Carta 2 foundation (0016)
-- Roles from the database instead of an email in code, per-table QR codes,
-- and a subscription row per venue. Additive only: the old owner_id policies
-- stay until the old /admin is retired.

-- ── Platform admins ─────────────────────────────────────────────
create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security;

insert into platform_admins (user_id)
select id from auth.users where email = 'nasim2131@gmail.com'
on conflict do nothing;

create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

drop policy if exists "self read platform_admins" on platform_admins;
create policy "self read platform_admins" on platform_admins for select
  using (user_id = auth.uid());

-- ── Venue members ───────────────────────────────────────────────
create table if not exists venue_members (
  venue_id uuid not null references venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);
create index if not exists venue_members_user_idx on venue_members(user_id);
alter table venue_members enable row level security;

insert into venue_members (venue_id, user_id, role)
select id, owner_id, 'owner' from venues where owner_id is not null
on conflict do nothing;

create or replace function is_venue_member(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_platform_admin()
      or exists (select 1 from venue_members where venue_id = v and user_id = auth.uid());
$$;

drop policy if exists "member read venue_members" on venue_members;
create policy "member read venue_members" on venue_members for select
  using (user_id = auth.uid() or is_venue_member(venue_id));

-- Member policies next to the legacy owner_id ones.
drop policy if exists "member update venues" on venues;
create policy "member update venues" on venues for update
  using (is_venue_member(id)) with check (is_venue_member(id));

drop policy if exists "member all sections" on sections;
create policy "member all sections" on sections for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

drop policy if exists "member all items" on items;
create policy "member all items" on items for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

drop policy if exists "member all menus" on menus;
create policy "member all menus" on menus for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

drop policy if exists "member all venue_events" on venue_events;
create policy "member all venue_events" on venue_events for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

drop policy if exists "member all screen_settings" on screen_settings;
create policy "member all screen_settings" on screen_settings for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

-- ── Tables ──────────────────────────────────────────────────────
-- 8 characters from an alphabet without look-alikes (no 0/O, 1/I/L).
create or replace function gen_table_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create table if not exists venue_tables (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 40),
  zone text check (zone is null or length(zone) <= 40),
  code text not null unique default gen_table_code(),
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists venue_tables_venue_idx on venue_tables(venue_id, position);
-- "Bar" and "bar" are the same table for a waiter.
create unique index if not exists venue_tables_label_uidx on venue_tables(venue_id, lower(label));
alter table venue_tables enable row level security;

drop policy if exists "member all venue_tables" on venue_tables;
create policy "member all venue_tables" on venue_tables for all
  using (is_venue_member(venue_id)) with check (is_venue_member(venue_id));

-- Guests never read venue_tables directly; this hands out only what a
-- scanned sticker needs.
create or replace function resolve_table(p_code text)
returns table (table_id uuid, venue_id uuid, venue_slug text, label text)
language sql stable security definer set search_path = public as $$
  select t.id, t.venue_id, v.slug, t.label
  from venue_tables t join venues v on v.id = t.venue_id
  where t.code = upper(p_code) and t.is_active;
$$;
grant execute on function resolve_table(text) to anon, authenticated;

-- ── Subscriptions ───────────────────────────────────────────────
create table if not exists subscriptions (
  venue_id uuid primary key references venues(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'comped')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);
alter table subscriptions enable row level security;

drop policy if exists "member read subscriptions" on subscriptions;
create policy "member read subscriptions" on subscriptions for select
  using (is_venue_member(venue_id));

-- Everything that exists today is a demo or our own test venue.
insert into subscriptions (venue_id, plan, status)
select id, case when plan = 'pro' then 'pro' else 'starter' end, 'comped' from venues
on conflict do nothing;

create table if not exists billing_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table billing_events enable row level security;
