import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Casa contact form → DB.
// Uses service_role (server-side only) so we bypass anon RLS friction
// and can later add rate-limit / honeypot / spam checks here.

type Payload = {
  property_name?: string;
  property_type?: string;
  units?: string;
  languages?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  message?: string;
  source?: string;
  // Honeypot field — bots fill, humans never touch.
  // Must remain empty for the submission to be accepted.
  _gotcha?: string;
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, 2000);
}

export async function POST(req: NextRequest) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — silently accept (200) so bots don't learn the form is protected.
  if (body._gotcha && body._gotcha.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = clean(body.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const property_name = clean(body.property_name);
  if (!property_name) {
    return NextResponse.json(
      { error: "property_name required" },
      { status: 400 },
    );
  }

  const supabase = serviceClient();
  const { error } = await supabase
    .schema("casa")
    .from("leads")
    .insert({
      property_name,
      property_type: clean(body.property_type),
      units: clean(body.units),
      languages: clean(body.languages),
      contact_name: clean(body.contact_name),
      email,
      phone: clean(body.phone),
      website: clean(body.website),
      message: clean(body.message),
      source: clean(body.source) ?? "casa_landing",
    });

  if (error) {
    console.error("[/api/casa/leads] insert failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
