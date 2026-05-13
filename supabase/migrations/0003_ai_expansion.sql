-- ORIZ — AI expansion & RLS fix (0003)

-- 1. Add ai_caption to items (AI-generated dish description, filled by bot)
alter table items add column if not exists ai_caption text;

-- 2. Buffer table for Telegram bot photo/text submissions
create table if not exists ai_content_buffer (
  id         uuid        primary key default gen_random_uuid(),
  venue_id   uuid        not null references venues(id) on delete cascade,
  raw_photo_url text,
  generated_text text,
  status     text        not null default 'pending'
                         check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists ai_buffer_venue_idx on ai_content_buffer(venue_id, created_at desc);

-- RLS: only venue owner can read/write their buffer rows
alter table ai_content_buffer enable row level security;

drop policy if exists "owner all ai_content_buffer" on ai_content_buffer;
create policy "owner all ai_content_buffer" on ai_content_buffer for all
  using  (exists (select 1 from venues v where v.id = ai_content_buffer.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from venues v where v.id = ai_content_buffer.venue_id and v.owner_id = auth.uid()));

-- 3. Fix: allow guests to see ALL items (active + inactive)
--    The UI dims/hides inactive items client-side; Realtime sends UPDATE (not DELETE)
--    when is_active flips, so the guest menu can animate the transition correctly.
drop policy if exists "public read items" on items;
create policy "public read items" on items for select using (true);
