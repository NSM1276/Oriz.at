-- ORIZ 0014 — publish venues + screen_settings to Realtime.
--
-- Until now only `items` and `sections` were published, so a price change
-- reached the TV instantly while a colour or Screen-setting change did not:
-- the board kept running the old design until the page was reloaded by hand.
-- On a wall-mounted TV that reload is impractical.

alter table venues          replica identity full;
alter table screen_settings replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'venues'
  ) then
    execute 'alter publication supabase_realtime add table venues';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'screen_settings'
  ) then
    execute 'alter publication supabase_realtime add table screen_settings';
  end if;
end $$;
