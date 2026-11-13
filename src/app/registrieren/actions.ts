"use server";

import { serviceClient } from "@/lib/auth";
import { isInviteToken } from "@/lib/invite";

export type SignupResult = { ok: true } | { ok: false; error: string };

const PASSWORD_MIN = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Opens an account for the holder of a personal invitation link. The link is spent in the same
 * step, so it cannot be used twice even when two people submit at once. The e-mail address is
 * taken as confirmed: we gave the link to this person ourselves.
 */
export async function signUpWithInvite(input: { token: string; company: string; email: string; password: string; business: boolean }): Promise<SignupResult> {
  const token = input.token;
  const company = String(input.company ?? "").trim().slice(0, 200);
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");

  if (!isInviteToken(token)) return { ok: false, error: "Dieser Link ist nicht gültig." };
  if (!company || input.business !== true) return { ok: false, error: "Bitte Firmenname angeben und bestätigen, dass Sie als Unternehmer handeln." };
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, error: "Bitte die E-Mail-Adresse prüfen." };
  if (password.length < PASSWORD_MIN || password.length > 200) return { ok: false, error: `Das Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.` };

  const svc = serviceClient();
  const now = new Date().toISOString();

  // Spend the link first. Only one request can turn used_at from empty to a time.
  const { data: claimed, error: claimError } = await svc
    .from("signup_invites")
    .update({ used_at: now })
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("venue_name, lead_id")
    .maybeSingle();
  if (claimError) return { ok: false, error: "Die Registrierung ist gerade nicht möglich. Bitte später erneut versuchen." };
  if (!claimed) return { ok: false, error: "Dieser Link wurde schon verwendet oder ist abgelaufen. Bitte schreiben Sie uns." };

  const { data: created, error: createError } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: company,
      business_confirmed_at: now, // ORIZ sells to businesses only
      invited_venue: claimed.venue_name,
      signup_ref: "einladung",
    },
  });

  if (createError || !created.user) {
    // Give the link back: the owner may try again with another address or password.
    await svc.from("signup_invites").update({ used_at: null }).eq("token", token);
    const message = createError?.message ?? "";
    if (/already|registered|exists/i.test(message)) return { ok: false, error: "Mit dieser E-Mail gibt es schon ein Konto. Bitte melden Sie sich an." };
    if (/password/i.test(message)) return { ok: false, error: "Dieses Passwort ist zu schwach. Bitte ein längeres wählen." };
    return { ok: false, error: "Registrierung fehlgeschlagen. Bitte die E-Mail-Adresse prüfen." };
  }

  await svc.from("signup_invites").update({ used_by: created.user.id }).eq("token", token);
  if (claimed.lead_id) {
    await svc.schema("casa").from("leads").update({ status: "testet", updated_at: now }).eq("id", claimed.lead_id).in("status", ["neu", "kontaktiert"]);
  }
  return { ok: true };
}
