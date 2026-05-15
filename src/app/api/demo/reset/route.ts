import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VENUE_ID = "9019d1cf-f1af-482f-9673-2a78846fa405";

// Section IDs for Trattoria Belvedere
const S_ANTIPASTI   = "7db0d81e-e139-4586-8e57-599dd85bb948";
const S_ZUPPE       = "3e118b21-eddd-4ee2-8575-9a5ced5e60ea";
const S_PASTA       = "2db00df6-15f7-4a61-9b51-c2584439a70b";
const S_SECONDI     = "784b8549-e6ff-40ec-915b-157ed82d8a93";
const S_CONTORNI    = "7c521dce-3756-46c5-9ade-2dc9b3b58e5f";
const S_DOLCI       = "972fe15e-66ea-4809-b298-6490e1f0c498";

const RESET_DATA = [
  // Antipasti
  { id: "29fa4a29-9996-40f8-b08d-30a5dd427a00", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 750,  is_active: true, description: "Geröstetes Hausbrot mit frischen Tomaten, Basilikum und extra-nativem Olivenöl",             ai_caption: null, allergens: null },
  { id: "633869c8-83a5-4a10-8852-ce36d0dcc2b5", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 1400, is_active: true, description: "Dünn aufgeschnittenes Kalbfleisch mit Thunfischcreme, Kapern und Sardellenfilets",           ai_caption: null, allergens: null },
  { id: "235ab49f-503c-4e39-a958-18ee5940a18b", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 1350, is_active: true, description: "Cremige Burrata mit wildem Rucola, Kirschtomaten und nativem Olivenöl aus Apulien",         ai_caption: null, allergens: null },
  { id: "2bec388f-69c0-44bc-8daf-91a4f92a916d", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 1500, is_active: true, description: "Hauchdünnes Rinderfilet, Rucola, Parmesanspäne, Zitronen-Olivenöl",                        ai_caption: null, allergens: null },
  { id: "ea1e81cb-e75a-4617-a606-93a2a31284f6", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 1600, is_active: true, description: "24 Monate gereifter Parmaschinken mit frischen Feigen und Grissini",                       ai_caption: null, allergens: null },
  { id: "5bb11b7b-cf1f-456a-be29-e60219488c61", section_id: S_ANTIPASTI,  venue_id: VENUE_ID, price_cents: 1800, is_active: true, description: "Gemischte frittierte Meeresfrüchte — Calamari, Garnelen, Jacobsmuscheln — mit Aioli",      ai_caption: null, allergens: null },
  // Zuppe & Insalate
  { id: "0345c071-71b4-44f7-8847-555044330d55", section_id: S_ZUPPE,      venue_id: VENUE_ID, price_cents: 850,  is_active: true, description: "Hausgemachte Gemüsesuppe nach Großmutters Rezept, mit Parmesanrinde geköchelt",            ai_caption: null, allergens: null },
  { id: "3d1a67df-fae8-49db-b8af-3d471856a81d", section_id: S_ZUPPE,      venue_id: VENUE_ID, price_cents: 1400, is_active: true, description: "Kräftige Fischsuppe mit Meeresfrüchten, Tomaten und geröstetem Knoblauchbrot",             ai_caption: null, allergens: null },
  { id: "caf05952-3a25-4b48-beb0-3f385d034b1f", section_id: S_ZUPPE,      venue_id: VENUE_ID, price_cents: 1100, is_active: true, description: "Büffelmozzarella, Heirloom-Tomaten, frisches Basilikum, weißer Balsamico",                 ai_caption: null, allergens: null },
  { id: "14bdbaf4-8da3-4678-90af-003e9d7ec2c4", section_id: S_ZUPPE,      venue_id: VENUE_ID, price_cents: 750,  is_active: true, description: "Gemischter Blattsalat mit Hausdressing, Kirschtomaten und Knoblauchcroutons",              ai_caption: null, allergens: null },
  { id: "275cdb4f-bb71-467d-a6b9-5e9bc6a5a7bd", section_id: S_ZUPPE,      venue_id: VENUE_ID, price_cents: 1050, is_active: true, description: "Toskanischer Brotsalat mit Tomaten, Gurken, Schalotten, Basilikum und Rotweinessig",       ai_caption: null, allergens: null },
  // Pasta & Risotto
  { id: "c7dfb93a-75d9-4dfb-a213-48af624b239c", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1600, is_active: true, description: "Klassische Carbonara mit Guanciale, Pecorino Romano und frischem Ei — kein Rahm",          ai_caption: null, allergens: null },
  { id: "93417698-ac68-4fe7-8ac5-a2e1cfb8a80e", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1750, is_active: true, description: "Hausgemachte Tagliatelle mit 6-Stunden-Rindfleischragout nach original Bolognese-Rezept",  ai_caption: null, allergens: null },
  { id: "5a07de18-cb71-452f-b63a-73597cb21219", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1900, is_active: true, description: "Breite Pasta mit langsam geschmortem Wildschweinragout, Rosmarin und Rotwein",             ai_caption: null, allergens: null },
  { id: "70d77e49-4093-49d1-8a58-35f2c88c339f", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1850, is_active: true, description: "Cremiges Carnaroli-Risotto mit frischen und getrockneten Steinpilzen, Parmesan",           ai_caption: null, allergens: null },
  { id: "3d707c31-4634-4c58-ac18-527df8547911", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1650, is_active: true, description: "Hausgemachte Kartoffelgnocchi mit Gorgonzolacreme, Walnüssen und Birne",                  ai_caption: null, allergens: null },
  { id: "bad60920-bf11-480a-8799-d7646ba9b0e4", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 1500, is_active: true, description: "Tonnarelli mit Pecorino Romano und frisch gemahlenem schwarzem Pfeffer — römischer Klassiker", ai_caption: null, allergens: null },
  { id: "c28be8e0-dab3-4c57-a7b4-1f13100255e2", section_id: S_PASTA,      venue_id: VENUE_ID, price_cents: 2200, is_active: true, description: "Linguine mit frischen Venusmuscheln, Weißwein, Knoblauch und Petersilie",                  ai_caption: null, allergens: null },
  // Secondi Piatti
  { id: "2b21412b-6eff-46e1-b438-39d45ccdf674", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 2600, is_active: true, description: "Kalbsmedaillons mit Parmaschinken und Salbei, in Weißwein und Butter geschwenkt",         ai_caption: null, allergens: null },
  { id: "235edeff-57bc-4431-a293-d449fd73d6d1", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 2800, is_active: true, description: "Ganzer ofengebackener Wolfsbarsch mit Kapern, Oliven, Kirschtomaten und Kräutern",        ai_caption: null, allergens: null },
  { id: "555f32f0-4aff-473c-bf50-01712a93b79f", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 4800, is_active: true, description: "T-Bone vom Chianina-Rind, 600 g, trocken gereift — am Tisch portioniert, für zwei",       ai_caption: null, allergens: null },
  { id: "9e64e866-fafd-4135-8f5a-75beb66045be", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 3000, is_active: true, description: "Gegrillte Lammkoteletts aus der Toskana, Kräutermarinade, Minz-Jus",                     ai_caption: null, allergens: null },
  { id: "80d4e800-154e-4eab-a39a-f58821704263", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 2400, is_active: true, description: "Geschmortes Hähnchen mit Tomaten, schwarzen Oliven, Kapern und Weißwein",                ai_caption: null, allergens: null },
  { id: "292a5fbf-99e6-4782-8d25-43eec9ca36da", section_id: S_SECONDI,    venue_id: VENUE_ID, price_cents: 3200, is_active: true, description: "Geschmorte Kalbshaxe nach Mailänder Art, Gremolata, serviert mit Safranrisotto",         ai_caption: null, allergens: null },
  // Contorni
  { id: "c8acf1bf-2896-42c7-9c1c-dec81fd0a44d", section_id: S_CONTORNI,   venue_id: VENUE_ID, price_cents: 550,  is_active: true, description: "Ofenkartoffeln mit frischem Rosmarin, Knoblauch und Olivenöl",                           ai_caption: null, allergens: null },
  { id: "d45000b1-600c-4e3c-8960-14782628fc0b", section_id: S_CONTORNI,   venue_id: VENUE_ID, price_cents: 500,  is_active: true, description: "Sautierter Blattspinat mit Knoblauch, Chili und nativem Olivenöl",                       ai_caption: null, allergens: null },
  { id: "54e895e0-878f-4a51-9dac-fec9c006cc03", section_id: S_CONTORNI,   venue_id: VENUE_ID, price_cents: 600,  is_active: true, description: "Gegrilltes Saisongemüse — Zucchini, Aubergine, Paprika — mit Kräuteröl",                 ai_caption: null, allergens: null },
  { id: "ecbee82e-f4af-42f1-8543-83778216d7d7", section_id: S_CONTORNI,   venue_id: VENUE_ID, price_cents: 550,  is_active: true, description: "Cremige Polenta mit Parmesan, Butter und frischem Salbei",                               ai_caption: null, allergens: null },
  { id: "fe492cd8-74bb-48a3-bb87-87df0af01108", section_id: S_CONTORNI,   venue_id: VENUE_ID, price_cents: 500,  is_active: true, description: "Grüne Bohnen in Nussbutter mit gerösteten Mandelblättchen und Zitrone",                  ai_caption: null, allergens: null },
  // Dolci
  { id: "0163bb1e-637c-4499-b727-d95a1bb597d8", section_id: S_DOLCI,      venue_id: VENUE_ID, price_cents: 850,  is_active: true, description: "Hausgemachtes Tiramisù mit Savoiardi, Mascarpone, Espresso und Marsala",                 ai_caption: null, allergens: null },
  { id: "2f8753ae-031b-4e83-9ff5-823dde6c905d", section_id: S_DOLCI,      venue_id: VENUE_ID, price_cents: 750,  is_active: true, description: "Zarte Vanille-Panna-Cotta mit frischer Himbeersauce und essbaren Blüten",                ai_caption: null, allergens: null },
  { id: "d9db9a01-be5d-4256-8226-2a028068bcda", section_id: S_DOLCI,      venue_id: VENUE_ID, price_cents: 700,  is_active: true, description: "Knuspriger Cannolo aus Sizilien mit Ricottacreme, kandierter Orange und Pistazien",      ai_caption: null, allergens: null },
  { id: "fb464d0b-3234-4523-a403-87e5ae52a2ca", section_id: S_DOLCI,      venue_id: VENUE_ID, price_cents: 650,  is_active: true, description: "Drei Kugeln hausgemachtes Eis — Pistazie, Fior di Latte, Cioccolato Fondente",           ai_caption: null, allergens: null },
  { id: "694fd999-fa3d-476b-ac1c-2e2f3ec62cdd", section_id: S_DOLCI,      venue_id: VENUE_ID, price_cents: 850,  is_active: true, description: "Warmer Schokoladenkuchen mit flüssigem Kern, Vanilleeis und Karamellsauce",              ai_caption: null, allergens: null },
];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  const supabase = serviceClient();

  const { error } = await supabase.from("items").upsert(
    RESET_DATA.map((row) => ({ ...row, updated_at: new Date().toISOString() })),
    { onConflict: "id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reset: RESET_DATA.length });
}

// Allow GET so the Vercel dashboard "trigger" button works
export const GET = POST;
