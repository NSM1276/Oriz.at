-- Realtime publication for items + sections + venues
alter table items    replica identity full;
alter table sections replica identity full;
alter table venues   replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'items'
  ) then
    execute 'alter publication supabase_realtime add table items';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sections'
  ) then
    execute 'alter publication supabase_realtime add table sections';
  end if;
end $$;
