import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

// Onboarding endpoint — super-admin-only.
//
// Creates (or finds) a Supabase Auth user for the client's email,
// sends them a password-set invite email (via Supabase Auth),
// then creates a venue (Carta) or casa.property (Casa) with that
// user as owner.
//
// Body:
// {
//   product: "carta" | "casa",
//   email:   "kontakt@belvedere.at",
//   slug:    "trattoria-belvedere",
//   name:    "Trattoria Belvedere",
//   city?:   "Wien"     // casa only
// }

type Payload = {
  product?: "carta" | "casa";
  email?: string;
  slug?: string;
  name?: string;
  city?: string;
};

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  // Auth: must be logged in as super admin
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product, email, slug, name, city } = body;
  if (product !== "carta" && product !== "casa") {
    return NextResponse.json(
      { error: "product must be carta or casa" },
      { status: 400 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase alphanumeric/dashes" },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const admin = adminClient();
  const origin = req.headers.get("origin") || "https://oriz.at";

  // 1. Send invite (creates user + sends magic-link email).
  // If user already exists, Supabase returns an error — we then look them
  // up via listUsers and reuse their id (no duplicate, no email sent twice).
  let ownerId: string | null = null;
  const { data: invited, error: invErr } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/admin/reset-password`,
    });
  if (invErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!found) {
      return NextResponse.json(
        { error: `invite failed: ${invErr.message}` },
        { status: 500 },
      );
    }
    ownerId = found.id;
  } else {
    ownerId = invited.user?.id ?? null;
  }
  if (!ownerId) {
    return NextResponse.json(
      { error: "could not resolve owner id" },
      { status: 500 },
    );
  }

  // 2. Create the venue or property
  if (product === "carta") {
    const { error: insErr } = await admin
      .from("venues")
      .insert({
        name,
        slug,
        owner_id: ownerId,
        color_bg: "#0A0A0A",
        color_primary: "#C69B3C",
        plan: "trial",
      });
    if (insErr) {
      return NextResponse.json(
        { error: `venue insert failed: ${insErr.message}` },
        { status: 500 },
      );
    }
  } else {
    const { error: insErr } = await admin
      .schema("casa")
      .from("properties")
      .insert({
        name,
        slug,
        city: city ?? null,
        owner_id: ownerId,
        color_bg: "#0A0A0A",
        color_primary: "#C69B3C",
      });
    if (insErr) {
      return NextResponse.json(
        { error: `property insert failed: ${insErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, ownerId, slug, product });
}
