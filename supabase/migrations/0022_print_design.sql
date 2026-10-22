-- Print design (Pro): the venue's look for printed menu sheets, which sections sit on which
-- sheet, and what each sheet looked like when it was last printed.
--
-- pages  = [{ "id": "p_ab12cd", "sections": ["<section uuid>", ...] }, ...]   (ordered)
-- states = { "<pageId>|<locale>": { "hash": "...", "changedAt": "2026-10-22",
--                                   "printedHash": "...", "printedAt": "2026-10-22" } }
--
-- Written and read only by the server (service role), like service_orders: the owner never
-- touches this table directly, so the plan check in the server actions cannot be bypassed.

create table if not exists print_designs (
  venue_id uuid primary key references venues(id) on delete cascade,
  template text not null default 'klassisch' check (template in ('klassisch', 'elegant', 'modern')),
  accent text check (accent is null or accent ~ '^#[0-9A-Fa-f]{6}$'),
  show_qr boolean not null default true,
  show_about boolean not null default true,
  pages jsonb not null default '[]'::jsonb,
  states jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table print_designs enable row level security;
revoke all on print_designs from anon, authenticated;
