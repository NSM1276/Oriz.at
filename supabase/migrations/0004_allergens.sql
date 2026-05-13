-- ORIZ — allergen support (0004)
-- Stores EU allergen codes as comma-separated string, e.g. "A, C, G, L"
alter table items add column if not exists allergens text;
