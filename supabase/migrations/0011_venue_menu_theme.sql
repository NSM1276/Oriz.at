-- ORIZ — per-venue menu theme (0011)
-- Values: 'classic' | 'modern' | 'visual'
alter table venues add column if not exists menu_theme text not null default 'classic';
