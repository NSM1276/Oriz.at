-- Carta 2, stage 2: lock the database down before anyone can sign up on their own.
--
-- Once /registrieren is open, every stranger is "authenticated". Until now that
-- role could create venues and Casa properties with any slug or plan, change a
-- venue's plan / owner / slug / logo SVG, and read every Casa sales lead.
-- After this migration:
--   * venues and casa.properties are created only by the server (service role)
--     or by a platform admin;
--   * members edit their venue's content, but not the columns that decide who
--     owns it, what it pays, where it lives or raw logo SVG (trigger below);
--   * subscriptions / billing_events / roles are written only by the server;
--   * AI credits are counted only by the server.

-- ── venues ────────────────────────────────────────────────────────────────
drop policy if exists "owner all venues" on public.venues;
drop policy if exists "super admin write venues" on public.venues;

create policy "admin insert venues" on public.venues
  for insert with check (public.is_platform_admin());
create policy "admin delete venues" on public.venues
  for delete using (public.is_platform_admin());
-- "member update venues" (is_venue_member) and "public read venues" stay.

create or replace function public.venues_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- The server (service_role, postgres) and platform admins may change anything.
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
  then
    raise exception 'protected venue column' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists venues_guard on public.venues;
create trigger venues_guard before update on public.venues
  for each row execute function public.venues_guard();

-- ── casa.properties ───────────────────────────────────────────────────────
drop policy if exists "casa properties owner all" on casa.properties;

create policy "casa properties owner update" on casa.properties
  for update
  using (owner_id = auth.uid() or public.is_platform_admin())
  with check (owner_id = auth.uid() or public.is_platform_admin());
create policy "casa properties admin insert" on casa.properties
  for insert with check (public.is_platform_admin());
create policy "casa properties admin delete" on casa.properties
  for delete using (public.is_platform_admin());

create or replace function casa.properties_guard()
returns trigger
language plpgsql
set search_path = casa, public
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_platform_admin() then
    return new;
  end if;
  if new.id            is distinct from old.id
  or new.slug          is distinct from old.slug
  or new.owner_id      is distinct from old.owner_id
  or new.custom_domain is distinct from old.custom_domain
  or new.logo_svg      is distinct from old.logo_svg
  or new.logo_url      is distinct from old.logo_url
  or new.created_at    is distinct from old.created_at
  then
    raise exception 'protected property column' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists properties_guard on casa.properties;
create trigger properties_guard before update on casa.properties
  for each row execute function casa.properties_guard();

-- ── casa.leads: ORIZ's own sales leads, not a tenant's data ───────────────
drop policy if exists "casa leads auth read" on casa.leads;
create policy "casa leads admin read" on casa.leads
  for select to authenticated using (public.is_platform_admin());
revoke select on casa.leads from anon;

-- ── server-only tables ────────────────────────────────────────────────────
revoke insert, update, delete on public.subscriptions, public.billing_events,
  public.platform_admins, public.venue_members from anon, authenticated;
revoke select on public.subscriptions, public.billing_events,
  public.platform_admins, public.venue_members from anon;
revoke select on public.billing_events from authenticated;

-- Not reachable through the API anyway, but nobody outside the server needs them.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke truncate, references, trigger on all tables in schema casa from anon, authenticated;

-- ── functions ─────────────────────────────────────────────────────────────
-- Platform admins come from the table, not from an email address in SQL.
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id into result_id from auth.users where lower(email) = lower(p_email) limit 1;
  return result_id;
end;
$$;

-- Credits are counted by /api/caption with the service role after it has
-- checked membership and worked out the plan's limit itself; a signed-in
-- client can no longer pass its own limit.
create or replace function public.increment_ai_credits(p_venue_id uuid, p_limit integer)
returns table(used integer, reset_date date)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used  int;
  v_reset date;
  v_period_start date := date_trunc('month', current_date)::date;
begin
  select ai_credits_used, ai_credits_reset into v_used, v_reset
    from venues where id = p_venue_id for update;
  if not found then
    raise exception 'venue not found' using errcode = 'P0002';
  end if;

  if v_reset is null or v_reset < v_period_start then
    v_used  := 0;
    v_reset := v_period_start;
  end if;
  if v_used >= p_limit then
    return;
  end if;

  v_used := v_used + 1;
  update venues set ai_credits_used = v_used, ai_credits_reset = v_reset where id = p_venue_id;
  return query select v_used, v_reset;
end;
$$;

revoke execute on function public.increment_ai_credits(uuid, int) from public, anon, authenticated;
grant execute on function public.increment_ai_credits(uuid, int) to service_role;

-- ── venues.owner_id → venue_members, new venue → trial ───────────────────
-- The old admin still sets venues.owner_id (assign-owner, invite-client, the
-- super-admin "add venue" form). Keep the member list and the subscription in
-- step with it here, so no code path can leave an owner without access or a
-- venue without a subscription row.
create or replace function public.venues_sync_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.owner_id is not null and old.owner_id is distinct from new.owner_id then
    delete from venue_members where venue_id = new.id and user_id = old.owner_id and role = 'owner';
  end if;
  if new.owner_id is not null then
    insert into venue_members (venue_id, user_id, role) values (new.id, new.owner_id, 'owner')
    on conflict (venue_id, user_id) do update set role = 'owner';
  end if;
  if tg_op = 'INSERT' then
    insert into subscriptions (venue_id, plan, status, trial_ends_at)
    values (new.id, 'starter', 'trialing', now() + interval '14 days')
    on conflict (venue_id) do nothing;
  end if;
  return null;
end;
$$;

revoke execute on function public.venues_sync_owner() from public, anon, authenticated;

drop trigger if exists venues_sync_owner on public.venues;
create trigger venues_sync_owner after insert or update of owner_id on public.venues
  for each row execute function public.venues_sync_owner();
