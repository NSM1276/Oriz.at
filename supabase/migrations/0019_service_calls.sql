-- Carta 2, stage 4: guests call the staff from their table.
--
-- Staff are devices, not accounts: the owner shows a pairing QR in /app, a
-- phone or the bar tablet scans it and keeps a long-lived cookie whose hash is
-- stored here. Every read and write goes through our server (service role),
-- so none of these tables has a client policy.

alter table public.venues
  add column if not exists service_calls_enabled boolean not null default false;

create table public.staff_devices (
  id                uuid primary key default gen_random_uuid(),
  venue_id          uuid not null references public.venues(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 40),
  token_hash        text not null unique,
  push_subscription jsonb,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  revoked_at        timestamptz
);
create index staff_devices_venue_idx on public.staff_devices (venue_id) where revoked_at is null;

-- One-time codes behind the pairing QR; valid for minutes, used once.
create table public.staff_pairings (
  token_hash text primary key,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  created_by uuid not null,
  expires_at timestamptz not null,
  used_at    timestamptz
);

create table public.service_calls (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid not null references public.venues(id) on delete cascade,
  table_id         uuid references public.venue_tables(id) on delete set null,
  -- Snapshot, so a renamed or deleted table still reads right in the history.
  table_label      text not null,
  kind             text not null check (kind in ('order', 'bill', 'help')),
  status           text not null default 'open' check (status in ('open', 'accepted', 'done', 'cancelled')),
  -- The guest's handle for status and cancel; only its hash is stored.
  guest_secret_hash text not null,
  accepted_by      uuid references public.staff_devices(id) on delete set null,
  accepted_by_name text,
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  closed_at        timestamptz
);
create index service_calls_board_idx on public.service_calls (venue_id, created_at desc);
create index service_calls_table_idx on public.service_calls (table_id, created_at desc);

alter table public.staff_devices  enable row level security;
alter table public.staff_pairings enable row level security;
alter table public.service_calls  enable row level security;

revoke all on public.staff_devices, public.staff_pairings, public.service_calls from anon, authenticated;
