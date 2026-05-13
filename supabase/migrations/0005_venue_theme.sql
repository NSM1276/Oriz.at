-- ORIZ — per-venue accent color (0005)
alter table venues add column if not exists color_primary text;

-- Prime Steakhouse: red from their brand
update venues set color_primary = '#CC0000' where slug = 'prime-steakhouse';
