-- "20+ Sprachen": an add-on next to the plan. Every plan has DE + EN/IT/FR/ES; this flag opens all languages.
-- Written by the server only (same rule as the rest of subscriptions); shown in /admin/tarife until Stripe sells it.
alter table subscriptions add column if not exists languages_all boolean not null default false;
comment on column subscriptions.languages_all is 'Zusatzpaket „20+ Sprachen“: alle Sprachen der Gästekarte statt der fünf im Tarif.';
