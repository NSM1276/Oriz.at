import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/auth";
import { adminRecipients, sendEmail } from "@/lib/email";
import { contactRequestForAdmin } from "@/lib/email-templates";
import { leadRow, makeLimiter, parseContact } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

// Contact form on /carta. The request is saved first (casa.leads, shown in /admin/leads), then we
// are told by email. Either one is enough to answer "ok": a lead is never lost because Resend is
// not set up yet, and the mail still reaches us if the database hiccups.

export const dynamic = "force-dynamic";

const allow = makeLimiter(5, 10 * 60 * 1000);

/** Who gets the notification: CONTACT_NOTIFY_EMAIL, else the same people as for service orders. */
async function recipients(): Promise<string[]> {
  const configured = process.env.CONTACT_NOTIFY_EMAIL?.split(",").map((s) => s.trim()).filter(Boolean);
  return configured?.length ? configured : adminRecipients();
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseContact(body);
  if (!parsed.ok) {
    // Bots get a plain "ok" so they do not learn what tripped them.
    if (parsed.honeypot) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const c = parsed.data;

  const saved = await (async () => {
    try {
      const { error } = await serviceClient().schema("casa").from("leads").insert(leadRow(c));
      if (error) console.error("[/api/contact] saving the lead failed:", error);
      return !error;
    } catch (err) {
      console.error("[/api/contact] saving the lead failed:", err);
      return false;
    }
  })();

  const mailed = await (async () => {
    try {
      const to = await recipients();
      const res = await sendEmail(to, contactRequestForAdmin(c, `${SITE_URL}/admin/leads`), c.email);
      return res.sent;
    } catch (err) {
      console.error("[/api/contact] notification failed:", err);
      return false;
    }
  })();

  if (!saved && !mailed) return NextResponse.json({ error: "Could not send" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
