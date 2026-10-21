-- Carta 2, stage 5: one dish, several sizes or prices ("0,3 l 3,90 / 0,5 l 4,90").
--
-- An ordered list of { "label": text, "price_cents": int }. Empty = the dish
-- has one price, items.price_cents. When variants exist, price_cents keeps the
-- lowest of them so the TV screen, print view and old admin still show a price.

alter table public.items
  add column if not exists price_variants jsonb not null default '[]'::jsonb;

alter table public.items
  add constraint items_price_variants_array check (jsonb_typeof(price_variants) = 'array');
