-- ORIZ demo seed.
-- Run AFTER you have signed up via magic link at /admin/login.
-- Replace OWNER_EMAIL below with your auth email, then execute in Supabase SQL Editor.

do $$
declare
  v_owner uuid;
  v_venue uuid;
  v_starters uuid;
  v_mains uuid;
  v_desserts uuid;
begin
  select id into v_owner from auth.users where email = 'OWNER_EMAIL' limit 1;
  if v_owner is null then
    raise exception 'No auth user found for OWNER_EMAIL — sign in via /admin/login first.';
  end if;

  insert into venues (slug, name, owner_id, about)
  values (
    'oriz-demo',
    'Maison Solane',
    v_owner,
    'A quiet table in the Marais. Seasonal French cooking, hand-written daily.'
  )
  returning id into v_venue;

  insert into sections (venue_id, name, position) values (v_venue, 'Entrées', 0) returning id into v_starters;
  insert into sections (venue_id, name, position) values (v_venue, 'Plats', 1)   returning id into v_mains;
  insert into sections (venue_id, name, position) values (v_venue, 'Desserts', 2) returning id into v_desserts;

  insert into items (section_id, venue_id, name, description, price_cents, position) values
    (v_starters, v_venue, 'Tartare de bœuf', 'Charolais, câpres, jaune confit', 2200, 0),
    (v_starters, v_venue, 'Burrata des Pouilles', 'Tomates anciennes, basilic', 1900, 1),
    (v_starters, v_venue, 'Velouté de châtaignes', 'Truffe noire, huile de noisette', 2400, 2),

    (v_mains, v_venue, 'Filet de Saint-Pierre', 'Beurre blanc, fenouil rôti', 3800, 0),
    (v_mains, v_venue, 'Pigeon en deux services', 'Cuisse confite, suprême rosé', 4600, 1),
    (v_mains, v_venue, 'Ris de veau croustillant', 'Pommes Anna, jus court', 4200, 2),

    (v_desserts, v_venue, 'Paris-Brest', 'Praliné noisette du Piémont', 1400, 0),
    (v_desserts, v_venue, 'Tarte fine aux pommes', 'Glace vanille de Madagascar', 1200, 1),
    (v_desserts, v_venue, 'Soufflé Grand Marnier', 'À la commande, 15 min', 1600, 2);
end $$;
