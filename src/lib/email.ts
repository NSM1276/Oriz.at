import "server-only";
import { serviceClient } from "@/lib/auth";
import type { Email } from "@/lib/email-templates";

// Transactional email through Resend's REST API (no SDK, one fetch).
// RESEND_API_KEY and EMAIL_FROM (e.g. "ORIZ <office@oriz.at>", a domain verified
// in Resend) switch it on. Until then nothing is sent and the log says what
// would have gone out — an order never fails because of email.

export type SendResult = { sent: true; id: string } | { sent: false; reason: string };

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(to: string | string[], email: Email, replyTo?: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipients = (Array.isArray(to) ? to : [to]).filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
  if (recipients.length === 0) return { sent: false, reason: "no recipient" };
  if (!key || !from) {
    console.info(`[email] not configured — would send "${email.subject}" to ${recipients.join(", ")}`);
    return { sent: false, reason: "not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: recipients, subject: email.subject, text: email.text, html: email.html, ...(replyTo && { reply_to: replyTo }) }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) {
      console.error("[email] Resend refused", res.status, body.message);
      return { sent: false, reason: body.message ?? `HTTP ${res.status}` };
    }
    return { sent: true, id: body.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, reason: "network" };
  }
}

/** Who hears about new orders: ORDER_NOTIFY_EMAIL, else every platform admin's address. */
export async function adminRecipients(): Promise<string[]> {
  const configured = process.env.ORDER_NOTIFY_EMAIL?.split(",").map((s) => s.trim()).filter(Boolean);
  if (configured?.length) return configured;
  const db = serviceClient();
  const { data } = await db.from("platform_admins").select("user_id").returns<{ user_id: string }[]>();
  const emails = await Promise.all(
    (data ?? []).map(async ({ user_id }) => (await db.auth.admin.getUserById(user_id)).data.user?.email ?? null),
  );
  return emails.filter((e): e is string => !!e);
}
