-- Statistics for the owner: how often the menu was opened (per day, per table) and which
-- dishes guests opened. Counters per day, not single events: no personal data, nothing about
-- a guest is stored — only "table 8, 24 October, opened 31 times".
--
--   kind 'view' + ref = table id   menu opened at that table (ref = zero uuid: no table, e.g. a shared link)
--   kind 'dish' + ref = item id    a dish card opened
--
-- Written only by our server through count_menu_event(); read by the owner's statistics page
-- through the service role. No client policies.

create table public.menu_stats (
  venue_id uuid not null references public.venues(id) on delete cascade,
  day      date not null,
  kind     text not null check (kind in ('view', 'dish')),
  ref      uuid not null default '00000000-0000-0000-0000-000000000000',
  n        int  not null default 0 check (n >= 0),
  primary key (venue_id, day, kind, ref)
);
create index menu_stats_venue_day_idx on public.menu_stats (venue_id, day desc);

alter table public.menu_stats enable row level security;
revoke all on public.menu_stats from anon, authenticated;

-- One more count for today (Vienna day). The caller checks that ref belongs to the venue.
create function public.count_menu_event(p_venue uuid, p_kind text, p_ref uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.menu_stats (venue_id, day, kind, ref, n)
  values (p_venue, (now() at time zone 'Europe/Vienna')::date, p_kind,
          coalesce(p_ref, '00000000-0000-0000-0000-000000000000'), 1)
  on conflict (venue_id, day, kind, ref) do update set n = public.menu_stats.n + 1;
$$;
revoke all on function public.count_menu_event(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.count_menu_event(uuid, text, uuid) to service_role;
grant select, insert, update on public.menu_stats to service_role;
