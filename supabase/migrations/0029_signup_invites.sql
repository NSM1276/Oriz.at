-- Sign-up is by invitation only (2026-11-13). After talking to a restaurant owner we create a
-- personal link and send it by WhatsApp; the link opens the sign-up form once and then is spent.
-- Without it nobody can open an account, so nobody can squat on a restaurant's name.
-- Read and written only by server code (service role): row level security is on, with no policy.

create table public.signup_invites (
  token      text primary key check (token ~ '^[a-z0-9]{20,40}$'),
  venue_name text not null check (char_length(venue_name) between 1 and 200),
  lead_id    uuid references casa.leads (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz,
  used_by    uuid references auth.users (id) on delete set null
);

comment on table public.signup_invites is 'Persönliche Einladungslinks für die Registrierung; nur Servercode liest und schreibt.';

alter table public.signup_invites enable row level security;
revoke all on public.signup_invites from anon, authenticated;
create index signup_invites_lead_idx on public.signup_invites (lead_id);
