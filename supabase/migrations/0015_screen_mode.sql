-- ORIZ 0015 — Screen presentation mode.
--
-- showcase: the rotating board (hero, photo tiles, spotlight) — restaurants, bars.
-- tafel:    every section on one screen at once, no rotation — counters, Imbiss,
--           bakeries, where the queue must not wait for a category to come back.

alter table screen_settings
  add column if not exists mode text not null default 'showcase';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'screen_settings_mode_check'
  ) then
    alter table screen_settings
      add constraint screen_settings_mode_check
      check (mode in ('showcase', 'tafel'));
  end if;
end $$;
