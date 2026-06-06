-- ORIZ — restaurant profile fields + menu filter support (0012)
-- All columns nullable / defaulted — non-destructive, safe for live venues.

-- ── Restaurant profile (powers the new /[venueSlug]/profile page) ──
alter table venues add column if not exists phone           text;
alter table venues add column if not exists address         text;
alter table venues add column if not exists tripadvisor_url text;
alter table venues add column if not exists facebook_url    text;
alter table venues add column if not exists website_url     text;
alter table venues add column if not exists google_review_url text;
-- price band: '€' | '€€' | '€€€' | '€€€€'
alter table venues add column if not exists price_range     text;
-- opening hours as structured json, e.g.
--   { "mon": [["09:00","22:00"]], "tue": [...], ... }  ([] = closed)
alter table venues add column if not exists opening_hours   jsonb;
-- gallery: json array of image urls
alter table venues add column if not exists gallery         jsonb default '[]'::jsonb;

-- ── Menu filters (item-level diet tags) ──
-- comma-separated tags, e.g. "vegan", "vegetarian"
-- (glutenfrei is derived from absence of EU allergen code 'A')
alter table items add column if not exists diet_tags text;
