-- ORIZ 0010 — Casa extra columns
-- These columns were added directly to the prod DB after 0008_casa_schema.sql was applied.
-- IF NOT EXISTS guards make this safe to run against an already-migrated instance.

ALTER TABLE casa.properties
  ADD COLUMN IF NOT EXISTS logo_svg         text,
  ADD COLUMN IF NOT EXISTS cover_url        text,
  ADD COLUMN IF NOT EXISTS website_url      text,
  ADD COLUMN IF NOT EXISTS instagram_url    text,
  ADD COLUMN IF NOT EXISTS facebook_url     text,
  ADD COLUMN IF NOT EXISTS google_maps_url  text,
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS email            text;

ALTER TABLE casa.content_blocks
  ADD COLUMN IF NOT EXISTS image_url        text;
