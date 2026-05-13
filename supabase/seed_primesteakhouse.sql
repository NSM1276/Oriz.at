-- ORIZ — Prime Argentinian Steakhouse demo seed
-- Naschmarkt Stand 217-219, 1060 Wien
-- Run after seed.sql (owner user must already exist)

do $$
declare
  v_owner_id uuid;
  v_venue_id  uuid;
  s_suppen    uuid;
  s_vorspeisen uuid;
  s_salate    uuid;
  s_pasta     uuid;
  s_steaks    uuid;
  s_saucen    uuid;
  s_burger    uuid;
  s_beilagen  uuid;
  s_fleisch   uuid;
  s_fisch     uuid;
  s_dessert   uuid;
begin
  -- find owner
  select id into v_owner_id from auth.users where email = 'nasim2131@gmail.com' limit 1;
  if v_owner_id is null then
    raise exception 'Owner user not found. Run seed.sql first.';
  end if;

  -- venue
  insert into venues (slug, name, about, currency, owner_id)
  values (
    'prime-steakhouse',
    'PRIME Argentinian Steakhouse',
    'Steak perfection takes time. Naschmarkt Stand 217–219, 1060 Wien.',
    'EUR',
    v_owner_id
  )
  returning id into v_venue_id;

  -- sections
  insert into sections (venue_id, name, position) values (v_venue_id, 'Suppen', 0) returning id into s_suppen;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Vorspeisen', 1) returning id into s_vorspeisen;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Salate', 2) returning id into s_salate;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Pasta', 3) returning id into s_pasta;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Steaks', 4) returning id into s_steaks;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Saucen', 5) returning id into s_saucen;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Prime Burger', 6) returning id into s_burger;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Beilagen', 7) returning id into s_beilagen;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Fleisch & Fisch', 8) returning id into s_fleisch;
  insert into sections (venue_id, name, position) values (v_venue_id, 'Dessert', 9) returning id into s_dessert;

  -- SUPPEN
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_suppen, 'Gemüsesuppe', 'Hausgemachte Gemüsesuppe der Saison', 650, null, 0),
    (v_venue_id, s_suppen, 'Rindfleischsuppe', 'Kräftige Rindssuppe mit Einlage', 750, null, 1);

  -- VORSPEISEN
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_vorspeisen, 'Rindstatar', 'Handgeschnittenes Rindersteak Tartar mit Toast', 1300, 'A, C, G', 0),
    (v_venue_id, s_vorspeisen, 'Hausmacher Rindswürstel', 'Hausgemachte Würstel vom Rind', 1100, 'A, G', 1);

  -- SALATE
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_salate, 'Bauernsalat', 'Tomate, Gurke, Zwiebel, Oliven, Feta', 1300, 'G', 0),
    (v_venue_id, s_salate, 'Gemischter Salat', 'Zitronendressing, Brot', 900, 'A', 1),
    (v_venue_id, s_salate, 'Avocado Salat', 'Avocado, Tomate, Rucola, Limettendressing', 1200, null, 2),
    (v_venue_id, s_salate, 'Caesar Salat', 'Römersalat, Croutons, Parmesan, Caesar Dressing', 1200, 'A, C, G', 3),
    (v_venue_id, s_salate, 'Caesar Salat mit Huhn', 'Caesar Salat mit gegrilltem Hühnerbrust', 1600, 'A, C, G', 4),
    (v_venue_id, s_salate, 'Caesar Salat mit Shrimps', 'Caesar Salat mit gegrillten Garnelen', 1600, 'A, B, C, G', 5);

  -- PASTA
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_pasta, 'Spaghetti Pomodoro', 'Spaghetti mit frischer Tomatensoße und Basilikum', 900, 'A, G', 0),
    (v_venue_id, s_pasta, 'Spaghetti Bolognese', 'Spaghetti mit hausgemachtem Rinderhackfleisch-Ragout', 1200, 'A, C, G', 1),
    (v_venue_id, s_pasta, 'Pasta Arrabiata', 'Penne mit scharfer Tomatensoße, Knoblauch, Chili', 1100, 'A', 2);

  -- STEAKS
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_steaks, 'New York Striploin 200g', 'Zartes Roastbeef, trocken gereift, aus Argentinien', 2800, null, 0),
    (v_venue_id, s_steaks, 'New York Striploin 300g', 'Zartes Roastbeef, trocken gereift, aus Argentinien', 3200, null, 1),
    (v_venue_id, s_steaks, 'Rib-Eye Steak 200g', 'Marmoriertes Rib-Eye, intensiver Geschmack', 2900, null, 2),
    (v_venue_id, s_steaks, 'Rib-Eye Steak 300g', 'Marmoriertes Rib-Eye, intensiver Geschmack', 3300, null, 3),
    (v_venue_id, s_steaks, 'Filet Steak 200g', 'Das zarteste Stück vom Rind, butterweich', 3400, null, 4),
    (v_venue_id, s_steaks, 'T-Bone Steak 500g', 'Klassiker — Filet und Roastbeef vereint', 3800, null, 5),
    (v_venue_id, s_steaks, 'Tomahawk 900g', 'Spektakuläres Rib-Eye am langen Knochen, für zwei', 6800, null, 6),
    (v_venue_id, s_steaks, 'Surf & Turf', 'Filet Steak 200g mit gegrillten Garnelen', 3400, 'B', 7);

  -- SAUCEN
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_saucen, 'Chimichurri', 'Argentinische Kräutersoße', 300, null, 0),
    (v_venue_id, s_saucen, 'Pfeffersauce', 'Cremige Pfeffersauce', 300, 'G', 1),
    (v_venue_id, s_saucen, 'Whiskysoße', 'Soße mit Scotch Whisky und Rahm', 300, 'G', 2),
    (v_venue_id, s_saucen, 'BBQ-Sauce', 'Hausgemachte rauchige BBQ-Sauce', 200, null, 3),
    (v_venue_id, s_saucen, 'Scharfe Sauce', 'Chili-Soße nach Hausrezept', 200, null, 4);

  -- BURGER
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_burger, 'Homemade Burger', 'Hausgemachtes Rindfleisch-Patty, Salat, Tomate, Zwiebel', 1200, 'A, C, H', 0),
    (v_venue_id, s_burger, 'Philly Cheese Steak Sandwich', 'Dünn geschnittenes Rindfleisch, Paprika, Zwiebel, Cheddar', 1300, 'A, G, L, M', 1),
    (v_venue_id, s_burger, 'Cheeseburger', 'Doppeltes Rindfleisch-Patty mit Cheddar', 1800, 'A, C, G, M', 2),
    (v_venue_id, s_burger, 'Prime Burger', 'Signature-Burger mit Dry-Aged Beef, Trüffelmajonäse', 2300, 'A, C, G, M, H', 3);

  -- BEILAGEN
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_beilagen, 'Pommes Frites', 'Knusprig frittierte Kartoffeln', 400, null, 0),
    (v_venue_id, s_beilagen, 'Kartoffelpüree', 'Cremiges Kartoffelpüree mit Butter', 400, 'G', 1),
    (v_venue_id, s_beilagen, 'Kartoffelpüree mit Knoblauch', 'Kartoffelpüree verfeinert mit Knoblauchbutter', 450, 'G', 2),
    (v_venue_id, s_beilagen, 'Gegrilltes Gemüse', 'Saisonales Gemüse vom Grill', 400, null, 3),
    (v_venue_id, s_beilagen, 'Gemischter Salat', 'Mit Hausdressing', 400, null, 4),
    (v_venue_id, s_beilagen, 'Gegrillter Maiskolben', 'Mit Butter und Kräutern', 400, 'G', 5);

  -- FLEISCH & FISCH
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_fleisch, 'Rinderfilet-Ragout', 'Geschmortes Rinderfilet in Rotweinjus', 1700, 'G', 0),
    (v_venue_id, s_fleisch, 'Lammkoteletten', 'Gegrillte Lammkoteletten mit Kräuterbutter', 2400, 'G', 1),
    (v_venue_id, s_fleisch, 'Spareribs', 'Langsam gegartes Rippchen mit rauchiger BBQ-Sauce', 1400, 'A, G', 2),
    (v_venue_id, s_fleisch, 'Buffalo Chicken Wings', 'Scharfe Chicken Wings mit Dip (4 Stück)', 900, 'A, C, G, M', 3),
    (v_venue_id, s_fleisch, 'Wiener Kalbsschnitzel', 'Klassisches paniertes Kalbsschnitzel mit Petersilienkartoffeln', 1490, 'A, C, G', 4),
    (v_venue_id, s_fleisch, 'Gegrillter Lachs', 'Atlantischer Lachs vom Grill mit Zitronenbutter', 1800, 'D, G', 5),
    (v_venue_id, s_fleisch, 'Thunfischsteak', 'Gegrilltes Thunfischsteak mit Avocadocreme', 2400, 'D', 6);

  -- DESSERT
  insert into items (venue_id, section_id, name, description, price_cents, allergens, position) values
    (v_venue_id, s_dessert, 'Cheesecake', 'Hausgemachter New York Cheesecake', 700, 'A, C, G', 0),
    (v_venue_id, s_dessert, 'Schoko-Lavakuchen', 'Warmer Schokoladenkuchen mit Vanilleeis', 800, 'A, C, G', 1),
    (v_venue_id, s_dessert, 'Crème brûlée', 'Klassische französische Crème brûlée', 700, 'C, G', 2);

  raise notice 'Prime Steakhouse seeded successfully (venue_id: %)', v_venue_id;
end $$;
