-- ORIZ — AI credits + Storage bucket for item photos (0007)

-- 0. Backfill columns that were added previously via dashboard (idempotent).
alter table venues add column if not exists plan            text not null default 'starter';
alter table venues add column if not exists instagram_url   text;
alter table venues add column if not exists google_maps_url text;

-- 1. Add monthly AI credit counter to venues
alter table venues add column if not exists ai_credits_used  int  not null default 0;
alter table venues add column if not exists ai_credits_reset date not null default (date_trunc('month', now())::date);

-- Constrain plan values (drop+create to be idempotent across reruns)
alter table venues drop constraint if exists venues_plan_check;
alter table venues add  constraint venues_plan_check check (plan in ('trial','starter','pro'));

-- 2. Atomic increment function (called from server-side API route).
--    SECURITY DEFINER so it can write to the credit columns regardless of RLS,
--    but it explicitly verifies auth.uid() owns the venue before doing anything.
--    search_path is pinned to defend against schema-shadowing attacks.
create or replace function public.increment_ai_credits(p_venue_id uuid, p_limit int)
returns table(used int, reset_date date)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used     int;
  v_reset    date;
  v_owner    uuid;
  v_today    date := current_date;
  v_period_start date := date_trunc('month', v_today)::date;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  select ai_credits_used, ai_credits_reset, owner_id
    into v_used, v_reset, v_owner
    from venues
   where id = p_venue_id
   for update;

  if not found then
    raise exception 'venue not found' using errcode = 'P0002';
  end if;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_reset < v_period_start then
    v_used  := 0;
    v_reset := v_period_start;
  end if;

  if v_used >= p_limit then
    return; -- empty result = limit reached
  end if;

  v_used := v_used + 1;

  update venues
     set ai_credits_used = v_used,
         ai_credits_reset = v_reset
   where id = p_venue_id;

  return query select v_used, v_reset;
end;
$$;

revoke all on function public.increment_ai_credits(uuid, int) from public;
grant execute on function public.increment_ai_credits(uuid, int) to authenticated, service_role;

-- Pin search_path on the older trigger function too (security hardening).
alter function public.touch_updated_at() set search_path = public, pg_temp;

-- 3. Storage bucket for item photos (idempotent insert).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,                             -- public read
  2097152,                          -- 2 MB hard cap (compressed WebP is ~150 KB)
  array['image/webp','image/jpeg','image/png']
)
on conflict (id) do update
   set public             = excluded.public,
       file_size_limit    = excluded.file_size_limit,
       allowed_mime_types = excluded.allowed_mime_types;

-- 4. Storage RLS:
--    - public buckets serve their object URLs without RLS, so we deliberately
--      do NOT add a SELECT policy (one would let anyone *list* every file).
--    - only the venue owner can write/update/delete files in their venue's folder
--      (folder convention: `<venue_id>/<filename>`)

drop policy if exists "item images public read"   on storage.objects;

drop policy if exists "item images owner write"   on storage.objects;
create policy "item images owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and exists (
      select 1 from venues v
       where v.id::text = (storage.foldername(storage.objects.name))[1]
         and v.owner_id = auth.uid()
    )
  );

drop policy if exists "item images owner update"  on storage.objects;
create policy "item images owner update"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and exists (
      select 1 from venues v
       where v.id::text = (storage.foldername(storage.objects.name))[1]
         and v.owner_id = auth.uid()
    )
  );

drop policy if exists "item images owner delete"  on storage.objects;
create policy "item images owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and exists (
      select 1 from venues v
       where v.id::text = (storage.foldername(storage.objects.name))[1]
         and v.owner_id = auth.uid()
    )
  );
