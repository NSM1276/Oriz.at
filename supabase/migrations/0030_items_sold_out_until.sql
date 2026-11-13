-- "Heute aus": a dish that ran out during service comes back by itself the next morning, the way
-- restaurant owners know it from every ordering app. is_active stays the one flag every reader
-- uses; sold_out_until only tells the nightly run (/api/cron/sold-out-reset) which dishes to
-- switch on again. Empty = off until somebody switches it back on.

alter table public.items add column if not exists sold_out_until timestamptz;
comment on column public.items.sold_out_until is 'Gesetzt bei "heute aus": ab diesem Zeitpunkt schaltet der nächtliche Lauf das Gericht wieder auf verfügbar. Leer = aus, bis es jemand einschaltet.';
create index if not exists items_sold_out_until_idx on public.items (sold_out_until) where sold_out_until is not null;
