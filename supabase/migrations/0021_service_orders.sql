-- Paid services done by hand: "Wir richten Ihre Karte ein" and photo editing.
--
-- An owner sends their files and pays (Stripe, or after talking to us and a
-- bank transfer); a platform admin does the work and marks the order done.
-- No AI runs on its own. Everything goes through server code (service role):
-- no client policies, and the uploads bucket is private — admins read files
-- through short-lived signed links.

create table public.service_orders (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues(id) on delete cascade,
  kind          text not null check (kind in ('menu_setup', 'photo_edit')),
  status        text not null default 'entwurf'
                check (status in ('entwurf', 'neu', 'bezahlt', 'in_arbeit', 'fertig', 'storniert')),
  -- Photos for photo_edit; 1 for menu_setup. Price is fixed when the order is placed.
  quantity      int  not null default 1 check (quantity between 1 and 500),
  price_cents   int  not null check (price_cents >= 0),
  link_url      text,
  languages     text[] not null default '{}',
  notes         text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  -- [{ path, name, size, type }] inside the service-uploads bucket.
  files         jsonb not null default '[]'::jsonb check (jsonb_typeof(files) = 'array'),
  admin_note    text,
  created_by    uuid not null,
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  paid_at       timestamptz,
  done_at       timestamptz
);
create index service_orders_venue_idx on public.service_orders (venue_id, created_at desc);
create index service_orders_status_idx on public.service_orders (status, submitted_at desc);

alter table public.service_orders enable row level security;
revoke all on public.service_orders from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-uploads', 'service-uploads', false, 26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;
