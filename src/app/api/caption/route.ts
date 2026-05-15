import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { limitForPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";  // cheapest current Haiku
const MAX_OUTPUT_TOKENS = 120;
const MAX_NAME = 80;
const MAX_DESC = 240;

const SYSTEM_PROMPT =
  "Du bist ein eleganter Texter für Premium-Restaurantmenüs. " +
  "Schreibe genau EINEN Satz auf Deutsch, maximal 18 Wörter, der das Gericht " +
  "appetitlich und mit Charakter beschreibt. Keine Floskeln, keine Anführungszeichen, " +
  "keine Emojis, keine Werbesprache. Nur der Satz, sonst nichts.";

type Body = { itemId?: unknown };

function bad(status: number, msg: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: msg, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  // 1. Auth — owner must be signed in.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad(401, "Nicht angemeldet.");

  // 2. Anthropic key presence check (don't leak details).
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return bad(503, "AI-Dienst nicht konfiguriert.");

  // 3. Parse body.
  let body: Body;
  try { body = (await req.json()) as Body; }
  catch { return bad(400, "Ungültige Anfrage."); }

  const itemId = typeof body.itemId === "string" ? body.itemId : null;
  if (!itemId) return bad(400, "itemId fehlt.");

  // 4. Load item + venue (RLS already restricts to owner's items).
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("id, name, description, venue_id, venues!inner(id, plan, owner_id)")
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr || !item) return bad(404, "Gericht nicht gefunden.");

  const venue = (item as unknown as {
    venues: { id: string; plan: string | null; owner_id: string | null };
  }).venues;

  // 5. Belt-and-suspenders ownership check (RLS would already block, but be explicit).
  if (venue.owner_id !== user.id) return bad(403, "Kein Zugriff.");

  // 6. Sanitize input strings sent to the model.
  const name = String(item.name ?? "").slice(0, MAX_NAME).trim();
  const description = String(item.description ?? "").slice(0, MAX_DESC).trim();
  if (!name) return bad(400, "Gericht hat keinen Namen.");

  // 7. Atomic credit increment via SECURITY DEFINER RPC.
  //    Returns empty when limit reached → we surface a 429.
  const limit = limitForPlan(venue.plan);
  const { data: creditRow, error: rpcErr } = await supabase
    .rpc("increment_ai_credits", { p_venue_id: venue.id, p_limit: limit })
    .maybeSingle<{ used: number; reset_date: string }>();

  if (rpcErr) return bad(500, "Kreditprüfung fehlgeschlagen.");

  if (!creditRow) {
    return bad(429, `Monatslimit erreicht (${limit} Generierungen).`, { limit, used: limit });
  }

  // Refund the credit we just consumed if anything below this point fails —
  // the user shouldn't lose credits to our infrastructure problems.
  async function refundCredit() {
    await supabase
      .from("venues")
      .update({ ai_credits_used: Math.max(0, creditRow!.used - 1) })
      .eq("id", venue.id);
  }

  // 8. Call Anthropic.
  const userMessage = description
    ? `Gericht: ${name}\nKurzbeschreibung: ${description}`
    : `Gericht: ${name}`;

  let captionText: string;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic error", res.status, await res.text().catch(() => ""));
      await refundCredit();
      return bad(502, "AI-Dienst antwortete mit Fehler.");
    }

    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    captionText = (json.content ?? [])
      .filter(c => c.type === "text")
      .map(c => c.text ?? "")
      .join(" ")
      .trim();
  } catch (e) {
    console.error("Anthropic fetch failed", e);
    await refundCredit();
    return bad(502, "AI-Dienst nicht erreichbar.");
  }

  if (!captionText) {
    await refundCredit();
    return bad(502, "Leere AI-Antwort.");
  }

  // 9. Hard-trim and strip surrounding quotes the model sometimes adds.
  captionText = captionText.replace(/^["„»«']+|["„»«']+$/g, "").trim();
  if (captionText.length > 280) captionText = captionText.slice(0, 280).trim();

  // 10. Persist to the item (RLS enforces owner-only update).
  const { error: updErr } = await supabase
    .from("items")
    .update({ ai_caption: captionText })
    .eq("id", itemId);

  if (updErr) return bad(500, "Speichern fehlgeschlagen.");

  return NextResponse.json({
    caption: captionText,
    used: creditRow.used,
    limit,
    resetDate: creditRow.reset_date,
  });
}
