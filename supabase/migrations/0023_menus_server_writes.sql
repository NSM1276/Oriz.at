-- Menus (lunch, dinner, drinks…) are written by the server only.
--
-- Until now any member of a venue could insert, change and delete menus straight through the
-- database API with their own session, which would let a Starter venue skip the "one menu" limit
-- of its plan. Every write already goes through server code (service role): the /app actions and
-- /api/admin/menus. Guests keep reading menus (policy "public read menus" stays).

drop policy if exists "member all menus" on public.menus;
drop policy if exists "owner manage menus" on public.menus;

revoke insert, update, delete on public.menus from anon, authenticated;
