import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Venue IDs ──────────────────────────────────────────────────────────────
const BELVEDERE     = "9019d1cf-f1af-482f-9673-2a78846fa405";
const TOSCA         = "5781d254-df4b-4713-bfed-41111bd75a2d";
const LUMIERE       = "f039c06c-d196-4f12-8145-fb20eeab0502";
const SUSHI         = "ac0094c8-4c04-42e7-b404-a57ebbbed314";

// ── Section IDs ────────────────────────────────────────────────────────────
// Belvedere
const SB_ANTIPASTI = "7db0d81e-e139-4586-8e57-599dd85bb948";
const SB_ZUPPE     = "3e118b21-eddd-4ee2-8575-9a5ced5e60ea";
const SB_PASTA     = "2db00df6-15f7-4a61-9b51-c2584439a70b";
const SB_SECONDI   = "784b8549-e6ff-40ec-915b-157ed82d8a93";
const SB_CONTORNI  = "7c521dce-3756-46c5-9ade-2dc9b3b58e5f";
const SB_DOLCI     = "972fe15e-66ea-4809-b298-6490e1f0c498";
// Tosca
const ST_ANTIPASTI = "41e70238-78ed-4030-8282-ae083411e749";
const ST_PASTA     = "3d3f4ea5-5bc8-4f3e-ad0a-9efffa7f73df";
const ST_SECONDI   = "5d5b7ef4-5009-4d28-ad54-d14e3db15025";
// Lumière
const SL_ENTREES   = "9843c4eb-75d6-4938-a03e-3ff506a5647a";
const SL_PLATS     = "335d3cad-f070-4733-9be8-dce7f949984f";
const SL_DESSERTS  = "f99bfeeb-e765-4d16-80ac-bb53c4e8f059";
// Sushi
const SS_ROLLS     = "121c367f-38d8-4dc1-b48e-0ff79c5392da";
const SS_NIGIRI    = "1707932d-07ca-4ddf-8cac-7b7fbd8ed762";
const SS_KITCHEN   = "4fe1f593-3168-4fd5-bd3b-3796934f1b92";

// ── Venue snapshots ────────────────────────────────────────────────────────
const VENUE_RESET = [
  {
    id: TOSCA,
    color_bg: "#325a30", color_primary: "#f09999", menu_theme: "visual",
    cover_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=85",
    gallery: [
      "/gallery/ristorante-tosca/gallery-1.jpg",
      "/gallery/ristorante-tosca/gallery-2.jpg",
      "/gallery/ristorante-tosca/gallery-3.jpg",
      "/gallery/ristorante-tosca/gallery-4.jpg",
      "/gallery/ristorante-tosca/gallery-5.jpg",
    ],
  },
  {
    id: LUMIERE,
    color_bg: "#0F1624", color_primary: "#8BA7C4", menu_theme: "classic",
    cover_url: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1400&q=85",
    gallery: [
      "/gallery/brasserie-lumiere/gallery-1.jpg",
      "/gallery/brasserie-lumiere/gallery-2.jpg",
      "/gallery/brasserie-lumiere/gallery-3.jpg",
      "/gallery/brasserie-lumiere/gallery-4.jpg",
    ],
  },
  {
    id: SUSHI,
    color_bg: "#0A0A0A", color_primary: "#C69B3C", menu_theme: "modern",
    cover_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&q=80",
      "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=900&q=80",
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=900&q=80",
      "https://images.unsplash.com/photo-1562802378-063ec186a863?w=900&q=80",
    ],
  },
];

// ── Events snapshots ───────────────────────────────────────────────────────
const EVENTS_RESET = [
  { id: "demo-tosca-ev1", venue_id: TOSCA, title: "Weinabend: Toskana trifft Wien", event_date: "2026-06-20", time_start: "19:00", duration_hours: 3 },
  { id: "demo-tosca-ev2", venue_id: TOSCA, title: "Sommerliche Pasta-Masterclass", event_date: "2026-07-05", time_start: "14:00", duration_hours: 2.5 },
  { id: "demo-tosca-ev3", venue_id: TOSCA, title: "Trüffel-Dinner — limitiert auf 20 Gäste", event_date: "2026-07-18", time_start: "19:30", duration_hours: 4 },
  { id: "demo-lumiere-ev1", venue_id: LUMIERE, title: "Champagner-Frühstück mit Live-Jazz", event_date: "2026-06-14", time_start: "10:30", duration_hours: 2 },
  { id: "demo-lumiere-ev2", venue_id: LUMIERE, title: "Bouillabaisse-Abend — klassische Marseiller Art", event_date: "2026-06-28", time_start: "19:00", duration_hours: 3 },
  { id: "demo-lumiere-ev3", venue_id: LUMIERE, title: "Bastille Day Spécial — 14. Juli", event_date: "2026-07-14", time_start: "18:30", duration_hours: 5 },
  { id: "demo-sushi-ev1", venue_id: SUSHI, title: "Omakase Dinner — Chef's Secret Menu", event_date: "2026-06-21", time_start: "19:00", duration_hours: 3 },
  { id: "demo-sushi-ev2", venue_id: SUSHI, title: "Sake-Tasting mit 6 Gängen", event_date: "2026-07-11", time_start: "19:30", duration_hours: 2.5 },
];

// ── Items snapshots ────────────────────────────────────────────────────────
const BELVEDERE_ITEMS = [
  { id: "29fa4a29-9996-40f8-b08d-30a5dd427a00", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Bruschetta al Pomodoro", price_cents: 750,  is_active: true, description: "Geröstetes Hausbrot mit frischen Tomaten, Basilikum und extra-nativem Olivenöl", image_url: null, allergens: null },
  { id: "633869c8-83a5-4a10-8852-ce36d0dcc2b5", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Vitello Tonnato", price_cents: 1400, is_active: true, description: "Dünn aufgeschnittenes Kalbfleisch mit Thunfischcreme, Kapern und Sardellenfilets", image_url: null, allergens: null },
  { id: "235ab49f-503c-4e39-a958-18ee5940a18b", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Burrata con Rucola", price_cents: 1350, is_active: true, description: "Cremige Burrata mit wildem Rucola, Kirschtomaten und nativem Olivenöl aus Apulien", image_url: null, allergens: null },
  { id: "2bec388f-69c0-44bc-8daf-91a4f92a916d", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Carpaccio di Manzo", price_cents: 1500, is_active: true, description: "Hauchdünnes Rinderfilet, Rucola, Parmesanspäne, Zitronen-Olivenöl", image_url: null, allergens: null },
  { id: "ea1e81cb-e75a-4617-a606-93a2a31284f6", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Prosciutto e Fichi", price_cents: 1600, is_active: true, description: "24 Monate gereifter Parmaschinken mit frischen Feigen und Grissini", image_url: null, allergens: null },
  { id: "5bb11b7b-cf1f-456a-be29-e60219488c61", section_id: SB_ANTIPASTI, venue_id: BELVEDERE, name: "Fritto Misto di Mare", price_cents: 1800, is_active: true, description: "Gemischte frittierte Meeresfrüchte — Calamari, Garnelen, Jacobsmuscheln — mit Aioli", image_url: null, allergens: null },
  { id: "0345c071-71b4-44f7-8847-555044330d55", section_id: SB_ZUPPE,     venue_id: BELVEDERE, name: "Minestrone della Nonna", price_cents: 850, is_active: true, description: "Hausgemachte Gemüsesuppe nach Großmutters Rezept, mit Parmesanrinde geköchelt", image_url: null, allergens: null },
  { id: "3d1a67df-fae8-49db-b8af-3d471856a81d", section_id: SB_ZUPPE,     venue_id: BELVEDERE, name: "Zuppa di Pesce", price_cents: 1400, is_active: true, description: "Kräftige Fischsuppe mit Meeresfrüchten, Tomaten und geröstetem Knoblauchbrot", image_url: null, allergens: null },
  { id: "caf05952-3a25-4b48-beb0-3f385d034b1f", section_id: SB_ZUPPE,     venue_id: BELVEDERE, name: "Insalata Caprese", price_cents: 1100, is_active: true, description: "Büffelmozzarella, Heirloom-Tomaten, frisches Basilikum, weißer Balsamico", image_url: null, allergens: null },
  { id: "14bdbaf4-8da3-4678-90af-003e9d7ec2c4", section_id: SB_ZUPPE,     venue_id: BELVEDERE, name: "Insalata Mista", price_cents: 750, is_active: true, description: "Gemischter Blattsalat mit Hausdressing, Kirschtomaten und Knoblauchcroutons", image_url: null, allergens: null },
  { id: "275cdb4f-bb71-467d-a6b9-5e9bc6a5a7bd", section_id: SB_ZUPPE,     venue_id: BELVEDERE, name: "Panzanella Toscana", price_cents: 1050, is_active: true, description: "Toskanischer Brotsalat mit Tomaten, Gurken, Schalotten, Basilikum und Rotweinessig", image_url: null, allergens: null },
  { id: "c7dfb93a-75d9-4dfb-a213-48af624b239c", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Spaghetti alla Carbonara", price_cents: 1600, is_active: true, description: "Klassische Carbonara mit Guanciale, Pecorino Romano und frischem Ei — kein Rahm", image_url: null, allergens: null },
  { id: "93417698-ac68-4fe7-8ac5-a2e1cfb8a80e", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Tagliatelle al Ragù", price_cents: 1750, is_active: true, description: "Hausgemachte Tagliatelle mit 6-Stunden-Rindfleischragout nach original Bolognese-Rezept", image_url: null, allergens: null },
  { id: "5a07de18-cb71-452f-b63a-73597cb21219", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Pappardelle al Cinghiale", price_cents: 1900, is_active: true, description: "Breite Pasta mit langsam geschmortem Wildschweinragout, Rosmarin und Rotwein", image_url: null, allergens: null },
  { id: "70d77e49-4093-49d1-8a58-35f2c88c339f", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Risotto ai Porcini", price_cents: 1850, is_active: true, description: "Cremiges Carnaroli-Risotto mit frischen und getrockneten Steinpilzen, Parmesan", image_url: null, allergens: null },
  { id: "3d707c31-4634-4c58-ac18-527df8547911", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Gnocchi al Gorgonzola", price_cents: 1650, is_active: true, description: "Hausgemachte Kartoffelgnocchi mit Gorgonzolacreme, Walnüssen und Birne", image_url: null, allergens: null },
  { id: "bad60920-bf11-480a-8799-d7646ba9b0e4", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Tonnarelli Cacio e Pepe", price_cents: 1500, is_active: true, description: "Tonnarelli mit Pecorino Romano und frisch gemahlenem schwarzem Pfeffer — römischer Klassiker", image_url: null, allergens: null },
  { id: "c28be8e0-dab3-4c57-a7b4-1f13100255e2", section_id: SB_PASTA,     venue_id: BELVEDERE, name: "Linguine alle Vongole", price_cents: 2200, is_active: true, description: "Linguine mit frischen Venusmuscheln, Weißwein, Knoblauch und Petersilie", image_url: null, allergens: null },
  { id: "2b21412b-6eff-46e1-b438-39d45ccdf674", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Saltimbocca alla Romana", price_cents: 2600, is_active: true, description: "Kalbsmedaillons mit Parmaschinken und Salbei, in Weißwein und Butter geschwenkt", image_url: null, allergens: null },
  { id: "235edeff-57bc-4431-a293-d449fd73d6d1", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Branzino al Forno", price_cents: 2800, is_active: true, description: "Ganzer ofengebackener Wolfsbarsch mit Kapern, Oliven, Kirschtomaten und Kräutern", image_url: null, allergens: null },
  { id: "555f32f0-4aff-473c-bf50-01712a93b79f", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Bistecca Fiorentina", price_cents: 4800, is_active: true, description: "T-Bone vom Chianina-Rind, 600 g, trocken gereift — am Tisch portioniert, für zwei", image_url: null, allergens: null },
  { id: "9e64e866-fafd-4135-8f5a-75beb66045be", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Costolette d'Agnello", price_cents: 3000, is_active: true, description: "Gegrillte Lammkoteletts aus der Toskana, Kräutermarinade, Minz-Jus", image_url: null, allergens: null },
  { id: "80d4e800-154e-4eab-a39a-f58821704263", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Pollo alla Cacciatora", price_cents: 2400, is_active: true, description: "Geschmortes Hähnchen mit Tomaten, schwarzen Oliven, Kapern und Weißwein", image_url: null, allergens: null },
  { id: "292a5fbf-99e6-4782-8d25-43eec9ca36da", section_id: SB_SECONDI,   venue_id: BELVEDERE, name: "Ossobuco alla Milanese", price_cents: 3200, is_active: true, description: "Geschmorte Kalbshaxe nach Mailänder Art, Gremolata, serviert mit Safranrisotto", image_url: null, allergens: null },
  { id: "c8acf1bf-2896-42c7-9c1c-dec81fd0a44d", section_id: SB_CONTORNI,  venue_id: BELVEDERE, name: "Patate al Rosmarino", price_cents: 550, is_active: true, description: "Ofenkartoffeln mit frischem Rosmarin, Knoblauch und Olivenöl", image_url: null, allergens: null },
  { id: "d45000b1-600c-4e3c-8960-14782628fc0b", section_id: SB_CONTORNI,  venue_id: BELVEDERE, name: "Spinaci Saltati", price_cents: 500, is_active: true, description: "Sautierter Blattspinat mit Knoblauch, Chili und nativem Olivenöl", image_url: null, allergens: null },
  { id: "54e895e0-878f-4a51-9dac-fec9c006cc03", section_id: SB_CONTORNI,  venue_id: BELVEDERE, name: "Verdure alla Griglia", price_cents: 600, is_active: true, description: "Gegrilltes Saisongemüse — Zucchini, Aubergine, Paprika — mit Kräuteröl", image_url: null, allergens: null },
  { id: "ecbee82e-f4af-42f1-8543-83778216d7d7", section_id: SB_CONTORNI,  venue_id: BELVEDERE, name: "Polenta Cremosa", price_cents: 550, is_active: true, description: "Cremige Polenta mit Parmesan, Butter und frischem Salbei", image_url: null, allergens: null },
  { id: "fe492cd8-74bb-48a3-bb87-87df0af01108", section_id: SB_CONTORNI,  venue_id: BELVEDERE, name: "Fagiolini Burro e Mandorle", price_cents: 500, is_active: true, description: "Grüne Bohnen in Nussbutter mit gerösteten Mandelblättchen und Zitrone", image_url: null, allergens: null },
  { id: "0163bb1e-637c-4499-b727-d95a1bb597d8", section_id: SB_DOLCI,     venue_id: BELVEDERE, name: "Tiramisù della Casa", price_cents: 850, is_active: true, description: "Hausgemachtes Tiramisù mit Savoiardi, Mascarpone, Espresso und Marsala", image_url: null, allergens: null },
  { id: "2f8753ae-031b-4e83-9ff5-823dde6c905d", section_id: SB_DOLCI,     venue_id: BELVEDERE, name: "Panna Cotta alla Vaniglia", price_cents: 750, is_active: true, description: "Zarte Vanille-Panna-Cotta mit frischer Himbeersauce und essbaren Blüten", image_url: null, allergens: null },
  { id: "d9db9a01-be5d-4256-8226-2a028068bcda", section_id: SB_DOLCI,     venue_id: BELVEDERE, name: "Cannolo Siciliano", price_cents: 700, is_active: true, description: "Knuspriger Cannolo aus Sizilien mit Ricottacreme, kandierter Orange und Pistazien", image_url: null, allergens: null },
  { id: "fb464d0b-3234-4523-a403-87e5ae52a2ca", section_id: SB_DOLCI,     venue_id: BELVEDERE, name: "Gelato Artigianale", price_cents: 650, is_active: true, description: "Drei Kugeln hausgemachtes Eis — Pistazie, Fior di Latte, Cioccolato Fondente", image_url: null, allergens: null },
  { id: "694fd999-fa3d-476b-ac1c-2e2f3ec62cdd", section_id: SB_DOLCI,     venue_id: BELVEDERE, name: "Tortino al Cioccolato", price_cents: 850, is_active: true, description: "Warmer Schokoladenkuchen mit flüssigem Kern, Vanilleeis und Karamellsauce", image_url: null, allergens: null },
];

const TOSCA_ITEMS = [
  { id: "80772923-f095-487f-852f-0c001d45acd6", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Bruschetta al Pomodoro", price_cents: 890, is_active: true, description: "Geröstetes Brot, Tomaten, Basilikum, Olivenöl", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Bruschetta%20al%20Pomodoro.webp", allergens: "Gluten" },
  { id: "8b7a8d0f-2988-4ffc-b9e4-3bd9ed5f5937", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Carpaccio di Polpo", price_cents: 1690, is_active: true, description: "Oktopus hauchdünn, Kapern, Zitrone, Olivenöl", image_url: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&h=440&fit=crop", allergens: "Weichtiere" },
  { id: "a96b7237-3e34-456b-984a-3b76a6f018af", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Insalata di Burrata", price_cents: 1890, is_active: true, description: "Burrata, Heirloom-Tomaten, Basilikum, Balsamico", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Insalata%20di%20Burrata.webp", allergens: "Milch" },
  { id: "de51c794-059e-425c-9c3c-1764da37ccf6", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Prosciutto e Melone", price_cents: 1590, is_active: true, description: "Parmaschinken, Cantaloupe-Melone", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Prosciutto%20e%20Melone.webp", allergens: null },
  { id: "cc745929-fc0e-4e8e-aae1-059c54c3b6be", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Crostini Toscani", price_cents: 1290, is_active: true, description: "Geröstetes Brot, Hühnerleber-Creme, Salbei", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Crostini%20Toscani.webp", allergens: "Gluten, Milch" },
  { id: "2cbd2173-303b-4b18-b5fe-a5a1b40adfa1", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Antipasto della Casa", price_cents: 2290, is_active: true, description: "Salumi, Formaggi, mariniertes Gemüse, Oliven", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Antipasto%20della%20Casa.webp", allergens: "Milch" },
  { id: "05b42c9e-3a71-466b-8889-61fa3bae316e", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Insalata Caprese", price_cents: 1590, is_active: true, description: "Mozzarella di Bufala, Tomaten, Basilikum", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Insalata%20Caprese.webp", allergens: "Milch" },
  { id: "53a6558a-2123-4633-830e-8f6e9bb73a5a", section_id: ST_ANTIPASTI, venue_id: TOSCA, name: "Fiori di Zucca Fritti", price_cents: 1390, is_active: true, description: "Zucchiniblüten, Ricotta, Zitronenschale, frittiert", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Fiori%20di%20Zucca%20Fritti.webp", allergens: "Gluten, Milch, Ei" },
  { id: "d270f1cb-f366-41a5-bc8a-91ff247cf357", section_id: ST_PASTA, venue_id: TOSCA, name: "Pappardelle al Cinghiale", price_cents: 1990, is_active: true, description: "Breite Pasta, toskanisches Wildschwein-Ragù", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Pappardelle%20al%20Cinghiale.webp", allergens: "Gluten, Ei" },
  { id: "d7838f4d-989d-4298-905f-db256d7117b5", section_id: ST_PASTA, venue_id: TOSCA, name: "Ribollita", price_cents: 1490, is_active: true, description: "Schwarzkohl, Bohnen, altbackenes Brot, Olivenöl", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Ribollita.webp", allergens: "Gluten" },
  { id: "2efd8cb1-6a48-4f2c-9ce8-de50993e2e2c", section_id: ST_PASTA, venue_id: TOSCA, name: "Pici all'Aglione", price_cents: 1890, is_active: true, description: "Handgerollte Pici, Knoblauch-Tomatensauce, Peperoncino", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Pici%20all'Aglione.webp", allergens: "Gluten, Ei" },
  { id: "bfc8188f-5c7d-4fbb-848d-a51d05c99fed", section_id: ST_PASTA, venue_id: TOSCA, name: "Risotto al Tartufo Nero", price_cents: 2490, is_active: true, description: "Schwarzer Trüffel aus Norcia, Parmesan, Butter", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Risotto%20al%20Tartufo%20Nero.webp", allergens: "Milch" },
  { id: "153de67c-9c8d-4c1c-938a-0662bec1b51d", section_id: ST_PASTA, venue_id: TOSCA, name: "Tagliolini al Limone", price_cents: 1790, is_active: true, description: "Eiernudeln, Zitrone, Butter, Parmesan", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Tagliolini%20al%20Limone.webp", allergens: "Gluten, Milch, Ei" },
  { id: "a1f3e28a-c836-46a0-9f9d-6ffe487be0da", section_id: ST_PASTA, venue_id: TOSCA, name: "Tortelli di Ricotta", price_cents: 1990, is_active: true, description: "Hausgemachte Tortelli, Ricotta, Spinat, Salbei-Butter", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Tortelli%20di%20Ricotta.webp", allergens: "Gluten, Milch, Ei" },
  { id: "323ade6e-21d5-4523-84e4-94ecfc23a5b0", section_id: ST_PASTA, venue_id: TOSCA, name: "Gnudi al Burro", price_cents: 1890, is_active: true, description: "Spinat-Ricotta-Klößchen, braune Butter, Parmesan", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Gnudi%20al%20Burro.webp", allergens: "Gluten, Milch, Ei" },
  { id: "17a19394-c9cd-4219-b272-e8a19d64448d", section_id: ST_PASTA, venue_id: TOSCA, name: "Risotto ai Frutti di Mare", price_cents: 2290, is_active: true, description: "Meeresfrüchte, Weißwein, frische Kräuter", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Risotto%20ai%20Frutti%20di%20Mare.webp", allergens: "Krustentiere, Weichtiere, Sulfite" },
  { id: "cc717345-7b9b-4493-8e0b-572b60c37746", section_id: ST_SECONDI, venue_id: TOSCA, name: "Bistecca alla Fiorentina", price_cents: 6900, is_active: true, description: "T-Bone vom Chianina-Rind, 600g, Bohnen, Rosmarin-Öl", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Bistecca%20alla%20Fiorentina.webp", allergens: null },
  { id: "5cd06e5c-9529-40df-ba98-f1ca6dc5a790", section_id: ST_SECONDI, venue_id: TOSCA, name: "Tagliata di Manzo", price_cents: 2890, is_active: true, description: "Rinderfilet, Rucola, Parmesan, Balsamico-Reduktion", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Tagliata%20di%20Manzo.webp", allergens: "Milch" },
  { id: "92058e97-f42c-455e-8cd9-2c5c990f0fcf", section_id: ST_SECONDI, venue_id: TOSCA, name: "Arista di Maiale", price_cents: 2490, is_active: true, description: "Schweinelende, Rosmarin, Knoblauch, Fenchelsamen", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Arista%20di%20Maiale.webp", allergens: null },
  { id: "903f7769-75fb-4230-992f-6892bccb6311", section_id: ST_SECONDI, venue_id: TOSCA, name: "Pollo alla Diavola", price_cents: 2190, is_active: true, description: "Ganzes Hähnchen flach gegrillt, Chili, Zitrone", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Pollo%20alla%20Diavola.webp", allergens: null },
  { id: "752327f7-4b1e-415e-8098-58e83fcd986f", section_id: ST_SECONDI, venue_id: TOSCA, name: "Agnello alla Scottadito", price_cents: 2890, is_active: true, description: "Lammkotelett gegrillt, Zitrone, frische Kräuter", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Agnello%20alla%20Scottadito.webp", allergens: null },
  { id: "ab8e1935-c803-423f-9dec-e65df525b24e", section_id: ST_SECONDI, venue_id: TOSCA, name: "Cinghiale in Umido", price_cents: 2690, is_active: true, description: "Wildschwein-Ragù, Polenta cremosa, Rosmarin-Jus", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Cinghiale%20in%20Umido.webp", allergens: "Sellerie, Sulfite" },
  { id: "e787bdba-b525-4f63-a1fd-3da31dc66520", section_id: ST_SECONDI, venue_id: TOSCA, name: "Scaloppine al Marsala", price_cents: 2290, is_active: true, description: "Kalbsschnitzel, Marsala-Sauce, Kapern", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Scaloppine%20al%20Marsala.webp", allergens: "Milch, Sulfite" },
  { id: "4be82b75-952b-4a56-98dd-fccc5c69c35a", section_id: ST_SECONDI, venue_id: TOSCA, name: "Filetto al Pepe Verde", price_cents: 3490, is_active: true, description: "Rinderfilet, grüner Pfeffer, Cognac-Sahne, Polenta", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Filetto%20al%20Pepe%20Verde.webp", allergens: "Milch" },
  { id: "b1353764-fd87-4dfe-99b3-18b3a91a0d41", section_id: ST_SECONDI, venue_id: TOSCA, name: "Arrosto di Vitello", price_cents: 2790, is_active: true, description: "Kalbsbraten langsam gegart, Erdäpfeln, Rosmarin-Jus", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/ristorante-tosca/Arrosto%20di%20Vitello.webp", allergens: null },
];

const LUMIERE_ITEMS = [
  { id: "5c9c432a-1caf-4e19-a2b2-1547fc9ddab7", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Soupe à l'oignon", price_cents: 1090, is_active: true, description: "Gratinierte Zwiebelsuppe, Gruyère-Croûton", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/soupe-a-loignon.webp", allergens: "Gluten, Milch" },
  { id: "65c13fb7-0916-428a-9766-ff3eb85310f9", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Salade Niçoise", price_cents: 1390, is_active: true, description: "Thunfisch, Ei, Oliven, Bohnen, Anchovis", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/salade-nicoise.webp", allergens: "Fisch, Ei" },
  { id: "6ddae66b-2b02-41ce-bea8-a6fc75c8c7bb", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Foie de Volaille", price_cents: 1590, is_active: true, description: "Gebratene Geflügelleber, Schalotten, Thymian, Brioche", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/foie-de-volaille.webp", allergens: "Gluten, Milch, Ei" },
  { id: "39816207-f7c1-4722-86ef-b49fe3a8568b", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Escargots de Bourgogne", price_cents: 1890, is_active: true, description: "Sechs Schnecken, Petersilien-Knoblauch-Butter, gratiniert", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/escargots-de-bourgogne.webp", allergens: "Milch, Weichtiere, Gluten" },
  { id: "3e7c4423-4719-4c8b-9e34-2812127486b8", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Terrine Maison", price_cents: 1690, is_active: true, description: "Leberterrine, Cornichons, Senf, Vollkorntoast", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/terrine-maison.webp", allergens: "Gluten, Sellerie" },
  { id: "0701381c-e156-45d2-be58-59782759c713", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Tartare de saumon", price_cents: 1990, is_active: true, description: "Lachstatar, Kapern, Schalotten, Dill-Crème fraîche", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/tartare-de-saumon.webp", allergens: "Fisch, Milch" },
  { id: "14f4a78a-4b2a-41ea-94b8-56a12abcdcf6", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Velouté de potiron", price_cents: 1290, is_active: true, description: "Cremige Kürbissuppe, Sahne, Kürbiskernöl", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/veloute-de-potiron.webp", allergens: "Milch" },
  { id: "466821ae-8dc2-498d-b162-643de46ef5cb", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Salade de chèvre chaud", price_cents: 1490, is_active: true, description: "Ziegenfrischkäse gebacken, Walnuss-Honig-Vinaigrette", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/salade-de-chevre-chaud.webp", allergens: "Milch, Nüsse, Gluten" },
  { id: "7eb1d326-6db4-4092-9991-aa74f580e148", section_id: SL_ENTREES, venue_id: LUMIERE, name: "Moules marinières", price_cents: 1690, is_active: true, description: "Miesmuscheln, Weißwein, Knoblauch, Petersilie, Baguette", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/moules-marinieres.webp", allergens: "Weichtiere, Gluten, Sulfite" },
  { id: "a559fc9e-33a1-4d59-814d-794b9724809c", section_id: SL_PLATS, venue_id: LUMIERE, name: "Steak-Frites", price_cents: 2690, is_active: true, description: "Entrecôte 200g, belgische Pommes, Sauce Béarnaise", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/steak-frites.webp", allergens: "Milch, Ei" },
  { id: "d678199a-1115-491d-b2cb-4ce5515047f4", section_id: SL_PLATS, venue_id: LUMIERE, name: "Poulet Rôti", price_cents: 2390, is_active: true, description: "Ganzes Hähnchen aus der Bretagne, Ratatouille, Kartoffelpüree", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/poulet-roti.webp", allergens: "Milch" },
  { id: "e8c0a89e-0992-40ce-ac39-cd5af18886fa", section_id: SL_PLATS, venue_id: LUMIERE, name: "Confit de canard", price_cents: 2890, is_active: true, description: "Entenkeule konfiert, Haricots verts, Sarladaiser Kartoffeln", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/confit-de-canard.webp", allergens: null },
  { id: "d253d8a9-a107-41de-9e68-2dc22c463f80", section_id: SL_PLATS, venue_id: LUMIERE, name: "Sole meunière", price_cents: 2990, is_active: true, description: "Seezunge in brauner Butter, Kapern, Petersilie", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/sole-meuniere.webp", allergens: "Fisch, Milch" },
  { id: "b92743d3-109c-4e6a-b9af-4ae7d10fd32b", section_id: SL_PLATS, venue_id: LUMIERE, name: "Magret de canard", price_cents: 2990, is_active: true, description: "Entenbrust, Kirsch-Jus, Haricots verts, Kartoffelgratin", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/magret-de-canard.webp", allergens: "Milch, Sulfite" },
  { id: "ce0d241e-9387-4f92-9115-936a08429445", section_id: SL_PLATS, venue_id: LUMIERE, name: "Coq au vin", price_cents: 2490, is_active: true, description: "Hühnchen in Rotwein, Pilze, Perlzwiebeln, Lardons", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/coq-au-vin.webp", allergens: "Sulfite, Sellerie" },
  { id: "15c469d8-ca8c-44f4-859d-19fb4cc03848", section_id: SL_PLATS, venue_id: LUMIERE, name: "Bouillabaisse", price_cents: 3290, is_active: true, description: "Provenzalische Fischsuppe, Rouille, Baguette, Gruyère", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/bouillabaisse.webp", allergens: "Fisch, Gluten, Milch, Ei, Krebstiere" },
  { id: "7606b35c-335b-4e72-8365-0ba703f459c7", section_id: SL_PLATS, venue_id: LUMIERE, name: "Cassoulet de Toulouse", price_cents: 2690, is_active: true, description: "Bohnen, Confit d'oie, Saucisse, Speck", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/cassoulet-de-toulouse.webp", allergens: "Gluten, Sellerie" },
  { id: "a675d774-c96f-48ae-8a48-ead5f16775c0", section_id: SL_PLATS, venue_id: LUMIERE, name: "Tarte flambée Alsacienne", price_cents: 1890, is_active: true, description: "Crème fraîche, Zwiebeln, Räucherspeck, Elsässer Art", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/tarte-flambee-alsacienne.webp", allergens: "Gluten, Milch" },
  { id: "2c98425e-7f47-454a-8752-00670448b847", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Crème Brûlée", price_cents: 890, is_active: true, description: "Klassisch mit Vanille, karamellisierter Zuckerkruste", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/creme-brulee.webp", allergens: "Milch, Ei" },
  { id: "8cb3ffc6-20ec-4212-a18e-b6b64d5628e7", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Tarte Tatin", price_cents: 1290, is_active: true, description: "Äpfel umgekehrt karamellisiert, Karamell, Crème fraîche", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/tarte-tatin.webp", allergens: "Gluten, Milch, Ei" },
  { id: "7c6bccd5-a019-41d3-a613-5f171be48b92", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Mousse au chocolat", price_cents: 1190, is_active: true, description: "Valrhona 70%, Orangenabrieb", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/mousse-au-chocolat.webp", allergens: "Ei, Milch" },
  { id: "f8113e72-0526-49ba-aea0-33a72d719ee7", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Île flottante", price_cents: 1090, is_active: true, description: "Eiweiß-Soufflé, Vanille-Anglaise, Karamell", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/ile-flottante.webp", allergens: "Milch, Ei" },
  { id: "4bd8eb44-e2b6-4bd6-8313-da3a57588a2d", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Fondant au chocolat", price_cents: 1390, is_active: true, description: "Warmer Schokokern-Kuchen, Vanilleeis", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/fondant-au-chocolat.webp", allergens: "Gluten, Milch, Ei" },
  { id: "829d23fb-6f6f-4b0c-920f-7173547375af", section_id: SL_DESSERTS, venue_id: LUMIERE, name: "Paris-Brest", price_cents: 1490, is_active: true, description: "Praliné-Creme, Brandteig-Ring, Haselnüsse", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/brasserie-lumiere/paris-brest.webp", allergens: "Gluten, Milch, Ei, Nüsse" },
];

const SUSHI_ITEMS = [
  { id: "9c8857a5-c9a5-420c-bb11-12ffdb6e42e0", section_id: SS_ROLLS, venue_id: SUSHI, name: "Rainbow Roll", price_cents: 1690, is_active: true, description: "California Roll, Lachs, Thunfisch, Avocado-Topping", image_url: "/sushi_roll.mp4", allergens: "Fisch, Soja, Gluten, Sesam" },
  { id: "7b7a241b-2391-4dcb-b1f8-f7bb78886258", section_id: SS_ROLLS, venue_id: SUSHI, name: "Spicy Salmon Roll", price_cents: 1590, is_active: true, description: "Lachs, Sriracha-Mayo, Avocado, Onion-Crunch", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/spicy-salmon-roll.webp", allergens: "Fisch, Ei, Gluten, Soja, Sesam" },
  { id: "5f7a17a1-b18a-4e73-8678-61ae7246abeb", section_id: SS_ROLLS, venue_id: SUSHI, name: "Dragon Roll", price_cents: 1790, is_active: true, description: "Ebi Tempura, Avocado außen, Eel Sauce", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/dragon-roll.webp", allergens: "Gluten, Krustentiere, Fisch, Ei" },
  { id: "ddee55c9-6e84-4257-8755-8f9a17351efd", section_id: SS_ROLLS, venue_id: SUSHI, name: "Vegetarian Roll", price_cents: 1290, is_active: true, description: "Avocado, Gurke, Paprika, Karotte", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/vegetarian-roll.webp", allergens: "Soja, Sesam" },
  { id: "22c8259e-9bbd-4348-bb15-a3ba78c3c366", section_id: SS_ROLLS, venue_id: SUSHI, name: "Philly Roll", price_cents: 1490, is_active: true, description: "Räucherlachs, Frischkäse, Gurke", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/philly-roll.webp", allergens: "Fisch, Milch, Gluten, Soja" },
  { id: "eb7eb158-819f-4bfb-81ba-3b32bbd0c852", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Lachs Nigiri", price_cents: 1200, is_active: true, description: "Norwegischer Lachs, Wasabi, Ingwer", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/lachs-nigiri.webp", allergens: "Fisch, Gluten, Soja" },
  { id: "34618e0f-2cf0-4294-a853-46b74b6ef036", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Hamachi Nigiri", price_cents: 1400, is_active: true, description: "Gelbschwanzmakrele aus Japan", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/hamachi-nigiri.webp", allergens: "Fisch, Gluten, Soja" },
  { id: "17b07420-b92f-436d-99c6-cc515e1ffae9", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Thunfisch Akami", price_cents: 1400, is_active: true, description: "Atlantik-Thunfisch, intensiv, klar", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/thunfisch-akami-nigiri.webp", allergens: "Fisch" },
  { id: "fd878eac-5cc2-4225-851c-e1e177502e0b", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Otoro Thunfisch", price_cents: 2800, is_active: true, description: "Blauflossen-Thunfisch, fettestes Stück, Umami", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/otoro-nigiri.webp", allergens: "Fisch" },
  { id: "a1f4335f-c9de-472b-8694-c253312a5957", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Eel Unagi", price_cents: 1600, is_active: true, description: "Gegrillter Süßwasser-Aal, Tare-Glasur", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/unagi-nigiri.webp", allergens: "Fisch, Soja, Gluten" },
  { id: "7e96cae7-990c-49b9-9f9a-06e3687644d7", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Ikura", price_cents: 1800, is_active: true, description: "Lachs-Kaviar in Nori-Manschette", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/ikura-nigiri.webp", allergens: "Fisch" },
  { id: "641b4bb2-997a-46a7-84ed-9bbaac094a5d", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Wagyu Beef", price_cents: 3200, is_active: true, description: "Hauchdünnes Wagyu, schwarzes Trüffelöl, Fleur de Sel", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/wagyu-beef-nigiri.webp", allergens: null },
  { id: "06b8ce41-25ce-4bba-a6b4-85979b683b9e", section_id: SS_NIGIRI, venue_id: SUSHI, name: "Omakase Nigiri", price_cents: 4800, is_active: true, description: "Neun Stück — Köcheauswahl des Tages", image_url: null, allergens: "Fisch, Soja, Gluten, Sesam" },
  { id: "137ea088-53a1-45b9-ae93-3e326d162d2d", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Miso Soup", price_cents: 490, is_active: true, description: "Weißes Miso, Tofu, Wakame, Frühlingszwiebeln", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/miso-soup.webp", allergens: "Soja, Gluten" },
  { id: "316342e6-5ebe-41de-9942-9e8d07eb14a2", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Gyoza", price_cents: 890, is_active: true, description: "Schweinehack, Kohl, knusprige Unterkruste — 6 Stück", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/gyoza.webp", allergens: "Gluten, Soja" },
  { id: "c23c83ce-84c1-4abe-9eae-602512ed8588", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Chicken Katsu Curry", price_cents: 1890, is_active: true, description: "Paniertes Hühnchen, japanisches Curry, Jasminreis", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/chicken-katsu-curry.webp", allergens: "Gluten, Ei, Sellerie" },
  { id: "17526e2f-5a74-4202-b50f-cce1a0bc655f", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Yakitori", price_cents: 1190, is_active: true, description: "Hähnchen-Spieße, Tare-Glasur, Negi — 3 Stück", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/yakitori.webp", allergens: "Soja, Gluten" },
  { id: "c81e279f-4a94-44e9-94db-7941f99f450e", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Chawanmushi", price_cents: 1290, is_active: true, description: "Gedämpfter Eierstich, Ebi, Shiitake, Hühnerbrühe", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/chawanmushi.webp", allergens: "Ei, Krustentiere, Soja, Gluten" },
  { id: "390ecdbe-8794-477a-bf9c-d9a2cc501a07", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Teriyaki Lachs", price_cents: 2190, is_active: true, description: "Lachsfilet, Teriyaki-Glasur, Soba-Nudeln", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/teriyaki-lachs.webp", allergens: "Fisch, Gluten, Soja" },
  { id: "e9eafc35-4534-490f-8014-f914530d3422", section_id: SS_KITCHEN, venue_id: SUSHI, name: "Edamame", price_cents: 490, is_active: true, description: "Gedämpfte Sojabohnen, Meersalz", image_url: "https://btydsogglgrtldfiezfu.supabase.co/storage/v1/object/public/item-images/sushi-schonbrunn/edamame.webp", allergens: "Soja" },
];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  const supabase = serviceClient();
  const errors: string[] = [];
  const ts = new Date().toISOString();

  // 1. Reset items for all 4 venues
  const allItems = [...BELVEDERE_ITEMS, ...TOSCA_ITEMS, ...LUMIERE_ITEMS, ...SUSHI_ITEMS];
  const { error: itemsError } = await supabase
    .from("items")
    .upsert(allItems.map((r) => ({ ...r, updated_at: ts })), { onConflict: "id" });
  if (itemsError) errors.push(`items: ${itemsError.message}`);

  // 2. Reset venue cover/gallery/style for 3 demo venues
  for (const v of VENUE_RESET) {
    const { error } = await supabase
      .from("venues")
      .update({ cover_url: v.cover_url, gallery: v.gallery, color_bg: v.color_bg, color_primary: v.color_primary, menu_theme: v.menu_theme })
      .eq("id", v.id);
    if (error) errors.push(`venue ${v.id}: ${error.message}`);
  }

  // 3. Reset events — delete extras, upsert originals
  const demoVenueIds = [TOSCA, LUMIERE, SUSHI];
  const { error: delEvError } = await supabase
    .from("venue_events")
    .delete()
    .in("venue_id", demoVenueIds)
    .not("id", "in", `(${EVENTS_RESET.map((e) => `'${e.id}'`).join(",")})`);
  if (delEvError) errors.push(`delete events: ${delEvError.message}`);

  const { error: evError } = await supabase
    .from("venue_events")
    .upsert(EVENTS_RESET, { onConflict: "id" });
  if (evError) errors.push(`events: ${evError.message}`);

  // 4. Delete any menus created by visitors for demo venues
  const { error: menuError } = await supabase
    .from("menus")
    .delete()
    .in("venue_id", demoVenueIds);
  if (menuError) errors.push(`menus: ${menuError.message}`);

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reset_items: allItems.length,
    reset_venues: VENUE_RESET.length,
    reset_events: EVENTS_RESET.length,
  });
}

// Allow GET so the Vercel dashboard "trigger" button works
export const GET = POST;
