import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Original values for the PRIME Argentinian Steakhouse demo venue.
// Update this list if the demo menu changes.
const RESET_DATA = [
  { id: "18fa22de-0b39-4f38-be13-d7faaba6c485", price_cents: 650,  is_active: true, description: "Hausgemachte Gemüsesuppe der Saison" },
  { id: "5c1b181a-2c70-4506-9e88-9b59f503595b", price_cents: 750,  is_active: true, description: "Kräftige Rindssuppe mit Einlage" },
  { id: "27e28f87-828c-4ac1-8678-69dc6a1dcc8f", price_cents: 1300, is_active: true, description: "Handgeschnittenes Rindersteak Tartar mit Toast" },
  { id: "4b281e9a-d2ea-4d83-bb0c-4be7bb243ef6", price_cents: 1100, is_active: true, description: "Hausgemachte Würstel vom Rind" },
  { id: "5578397c-58f8-4184-898a-6f07b269222a", price_cents: 1300, is_active: true, description: "Tomate, Gurke, Zwiebel, Oliven, Feta" },
  { id: "b237eb8e-059b-464d-bc88-b55e5f91be77", price_cents: 900,  is_active: true, description: "Zitronendressing, Brot" },
  { id: "5253af2b-4abc-40cf-a553-5895de7cd935", price_cents: 1200, is_active: true, description: "Avocado, Tomate, Rucola, Limettendressing" },
  { id: "b2c750c2-d734-4572-9f6d-beebb06a4d53", price_cents: 1200, is_active: true, description: "Römersalat, Croutons, Parmesan, Caesar Dressing" },
  { id: "412271e3-16aa-474c-99d9-7fda53afc4cb", price_cents: 1600, is_active: true, description: "Caesar Salat mit gegrilltem Hühnerbrust" },
  { id: "b6afe6c1-cf1c-4f80-818d-193ce92e6e0d", price_cents: 1600, is_active: true, description: "Caesar Salat mit gegrillten Garnelen" },
  { id: "174fe347-54a0-4eb8-828d-7bacf45180a1", price_cents: 900,  is_active: true, description: "Spaghetti mit frischer Tomatensoße und Basilikum" },
  { id: "e4da6c9f-4cf0-442f-9b01-eff9cbcb77f0", price_cents: 1200, is_active: true, description: "Spaghetti mit hausgemachtem Rinderhackfleisch-Ragout" },
  { id: "c9bbb7e5-6539-4c58-86e5-8bd1b303931c", price_cents: 1100, is_active: true, description: "Penne mit scharfer Tomatensoße, Knoblauch, Chili" },
  { id: "7b9d68a6-3146-4da7-a11a-c82c126de000", price_cents: 2800, is_active: true, description: "Zartes Roastbeef, trocken gereift, aus Argentinien" },
  { id: "a9337aab-b443-4789-abe5-d2dcebc16516", price_cents: 3200, is_active: true, description: "Zartes Roastbeef, trocken gereift, aus Argentinien" },
  { id: "175a955e-1c73-4e60-905b-47c780506f5e", price_cents: 2900, is_active: true, description: "Marmoriertes Rib-Eye, intensiver Geschmack" },
  { id: "f3446b67-1f22-4200-9105-bc744c97961d", price_cents: 3300, is_active: true, description: "Marmoriertes Rib-Eye, intensiver Geschmack" },
  { id: "6588b800-6b59-4035-bba2-4e2417e49578", price_cents: 3400, is_active: true, description: "Das zarteste Stück vom Rind, butterweich" },
  { id: "acb2195e-cc54-4e1c-bdc0-b17140132196", price_cents: 3800, is_active: true, description: "Klassiker — Filet und Roastbeef vereint" },
  { id: "fd8a34f0-9a64-446f-9a90-61f20fd9e9d7", price_cents: 6800, is_active: true, description: "Spektakuläres Rib-Eye am langen Knochen, für zwei" },
  { id: "a0ecf39a-1cca-4034-a39b-a559a50da00d", price_cents: 3400, is_active: true, description: "Filet Steak 200g mit gegrillten Garnelen" },
  { id: "b4a50b15-527d-48cd-a2fd-3c414cd77a79", price_cents: 300,  is_active: true, description: "Argentinische Kräutersoße" },
  { id: "df98c957-500a-4d52-ab79-536f6aa602c4", price_cents: 300,  is_active: true, description: "Cremige Pfeffersauce" },
  { id: "5966723a-d8f9-4159-aff4-ee58f1e15126", price_cents: 300,  is_active: true, description: "Soße mit Scotch Whisky und Rahm" },
  { id: "017bac96-7c20-4baf-83ac-8dc13c274199", price_cents: 200,  is_active: true, description: "Hausgemachte rauchige BBQ-Sauce" },
  { id: "51a6e2ef-ca9a-4bb2-b1a5-ef4b4e800adc", price_cents: 200,  is_active: true, description: "Chili-Soße nach Hausrezept" },
  { id: "61c49551-42f0-44ab-b430-b1a5fd7747be", price_cents: 1200, is_active: true, description: "Hausgemachtes Rindfleisch-Patty, Salat, Tomate, Zwiebel" },
  { id: "c660b81a-9855-4f7d-90bf-8d93764d12c7", price_cents: 1300, is_active: true, description: "Dünn geschnittenes Rindfleisch, Paprika, Zwiebel, Cheddar" },
  { id: "95e550aa-2ce4-4cdf-a618-175440ad49a1", price_cents: 1800, is_active: true, description: "Doppeltes Rindfleisch-Patty mit Cheddar" },
  { id: "8ef09c52-f5ee-4aca-a63f-2a62113a3eb7", price_cents: 2300, is_active: true, description: "Signature-Burger mit Dry-Aged Beef, Trüffelmajonäse" },
  { id: "f00b1f45-fcae-498e-8cbf-917c30c72a33", price_cents: 400,  is_active: true, description: "Knusprig frittierte Kartoffeln" },
  { id: "b29d81f4-78af-4cda-82f4-f2d4921496b3", price_cents: 400,  is_active: true, description: "Cremiges Kartoffelpüree mit Butter" },
  { id: "1960df11-8654-4827-9828-896c1a0d0e64", price_cents: 450,  is_active: true, description: "Kartoffelpüree verfeinert mit Knoblauchbutter" },
  { id: "d647f124-2832-4ebe-ba7d-2cbeb9a215c8", price_cents: 400,  is_active: true, description: "Saisonales Gemüse vom Grill" },
  { id: "cd391399-bb40-461f-bd35-2315014b3c2e", price_cents: 400,  is_active: true, description: "Mit Hausdressing" },
  { id: "2e699de9-f827-43e2-93a6-df4be5a33d43", price_cents: 400,  is_active: true, description: "Mit Butter und Kräutern" },
  { id: "6c4ff09e-50e9-4f5f-a2b2-326247851484", price_cents: 1700, is_active: true, description: "Geschmortes Rinderfilet in Rotweinjus" },
  { id: "5e44c488-877a-4ccd-9377-45d4eba4c860", price_cents: 2400, is_active: true, description: "Gegrillte Lammkoteletten mit Kräuterbutter" },
  { id: "f1ae1893-29e2-480a-9653-f147c7083cce", price_cents: 1400, is_active: true, description: "Langsam gegartes Rippchen mit rauchiger BBQ-Sauce" },
  { id: "13449549-ee02-46a2-af4e-577c60c6734e", price_cents: 900,  is_active: true, description: "Scharfe Chicken Wings mit Dip (4 Stück)" },
  { id: "05cb59f2-a619-4021-baa3-9a32d141923e", price_cents: 1490, is_active: true, description: "Klassisches paniertes Kalbsschnitzel mit Petersilienkartoffeln" },
  { id: "0c1be7de-28ea-4aae-a8ba-4e9105d7c998", price_cents: 1800, is_active: true, description: "Atlantischer Lachs vom Grill mit Zitronenbutter" },
  { id: "0dbd4814-363a-4d9d-bfe3-150c4b4f6844", price_cents: 2400, is_active: true, description: "Gegrilltes Thunfischsteak mit Avocadocreme" },
  { id: "de729f55-c3f3-4bee-ae8a-ded4738e1966", price_cents: 700,  is_active: true, description: "Hausgemachter New York Cheesecake" },
  { id: "48de6b0a-6315-4823-8603-444a86b269ac", price_cents: 800,  is_active: true, description: "Warmer Schokoladenkuchen mit Vanilleeis" },
  { id: "0bf00f48-37a9-44e3-88ae-d8f2fdc6b052", price_cents: 700,  is_active: true, description: "Klassische französische Crème brûlée" },
];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  const supabase = serviceClient();

  // Batch upsert — Supabase handles up to a few hundred rows fine
  const { error } = await supabase.from("items").upsert(
    RESET_DATA.map((row) => ({ ...row, updated_at: new Date().toISOString() })),
    { onConflict: "id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reset: RESET_DATA.length });
}

// Allow GET so the Vercel dashboard "trigger" button works
export const GET = POST;
