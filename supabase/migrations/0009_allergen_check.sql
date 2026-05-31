-- ORIZ 0009 — prevent empty-string allergen values
-- Any existing "" rows are normalized to NULL before the constraint is added.
UPDATE items SET allergens = NULL WHERE allergens IS NOT NULL AND trim(allergens) = '';

ALTER TABLE items
  ADD CONSTRAINT items_allergens_not_empty
  CHECK (allergens IS NULL OR length(trim(allergens)) > 0);
