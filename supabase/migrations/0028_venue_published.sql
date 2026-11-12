-- A venue can exist without being online: its menu is visible only to its own team and to us
-- until it is published. Used for restaurants we prepare before talking to them (2026-10-24:
-- Prime and Golden Harp). New venues are published by default — self-sign-up goes live at once.

alter table public.venues add column if not exists published boolean not null default true;
comment on column public.venues.published is 'false = nur für das eigene Team und ORIZ sichtbar (Gästeseite 404).';

update public.venues set published = false where slug in ('prime-steakhouse', 'golden-harp-meidling');

-- Public reads only for published venues; members and platform admins still see their own.
drop policy if exists "public read venues" on public.venues;
create policy "public read venues" on public.venues for select
  using (published or is_venue_member(id) or is_platform_admin());

drop policy if exists "public read sections" on public.sections;
create policy "public read sections" on public.sections for select
  using (exists (select 1 from public.venues v where v.id = sections.venue_id and (v.published or is_venue_member(v.id) or is_platform_admin())));

drop policy if exists "public read items" on public.items;
create policy "public read items" on public.items for select
  using (exists (select 1 from public.venues v where v.id = items.venue_id and (v.published or is_venue_member(v.id) or is_platform_admin())));

drop policy if exists "public read menus" on public.menus;
create policy "public read menus" on public.menus for select
  using (exists (select 1 from public.venues v where v.id = menus.venue_id and (v.published or is_venue_member(v.id) or is_platform_admin())));

-- Only we publish: the owner cannot switch a prepared venue online on their own.
create or replace function public.venues_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    return new;
  end if;
  if new.id               is distinct from old.id
  or new.slug             is distinct from old.slug
  or new.owner_id         is distinct from old.owner_id
  or new.plan             is distinct from old.plan
  or new.ai_credits_used  is distinct from old.ai_credits_used
  or new.ai_credits_reset is distinct from old.ai_credits_reset
  or new.custom_domain    is distinct from old.custom_domain
  or new.logo_svg         is distinct from old.logo_svg
  or new.logo_url         is distinct from old.logo_url
  or new.created_at       is distinct from old.created_at
  or new.published        is distinct from old.published
  then
    raise exception 'protected venue column' using errcode = '42501';
  end if;
  return new;
end;
$$;
