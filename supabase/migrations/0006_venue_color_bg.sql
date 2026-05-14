-- ORIZ — venue background color for dark themes (0006)
alter table venues add column if not exists color_bg text;

-- Prime Steakhouse: deep dark red background
update venues set color_bg = '#0F0000' where slug = 'prime-steakhouse';
