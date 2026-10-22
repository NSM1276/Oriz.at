// The contact form on /carta: what we accept and how it is stored. No runtime imports — unit-tested.

export const CONTACT_SOURCE = "carta_landing";

export type ContactRequest = {
  plan: string;
  venueType: string;
  tables: string;
  dishes: string;
  languages: string;
  restaurant: string;
  name: string | null;
  email: string;
  phone: string | null;
  website: string | null;
};

export type ContactParse = { ok: true; data: ContactRequest } | { ok: false; error: string; honeypot?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed, one line, capped. Newlines are removed so a field can never smuggle extra lines into a mail. */
function clean(v: unknown, max = 200): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

/** A link they typed: kept only if it is an http(s) address, "www.x.at" gets its https:// added. */
function cleanWebsite(v: unknown): string | null {
  const raw = clean(v, 300);
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

export function parseContact(body: unknown): ContactParse {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request" };
  const b = body as Record<string, unknown>;

  // Honeypot: bots fill every field, people never see this one.
  if (typeof b._gotcha === "string" && b._gotcha.trim() !== "") return { ok: false, error: "spam", honeypot: true };

  const email = clean(b.email, 254);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Valid email required" };
  const restaurant = clean(b.restaurant);
  if (!restaurant) return { ok: false, error: "Restaurant required" };

  return {
    ok: true,
    data: {
      plan: clean(b.plan),
      venueType: clean(b.venueType),
      tables: clean(b.tables),
      dishes: clean(b.dishes),
      languages: clean(b.languages),
      restaurant,
      name: clean(b.name) || null,
      email,
      phone: clean(b.phone, 60) || null,
      website: cleanWebsite(b.website),
    },
  };
}

/** The row for casa.leads (the table the lead inbox in /admin/leads reads). */
export function leadRow(c: ContactRequest) {
  const message = [c.plan && `Paket: ${c.plan}`, c.dishes && `Gerichte: ${c.dishes}`].filter(Boolean).join("\n");
  return {
    property_name: c.restaurant,
    property_type: c.venueType || null,
    units: c.tables || null,
    languages: c.languages || null,
    contact_name: c.name,
    email: c.email,
    phone: c.phone,
    website: c.website,
    message: message || null,
    source: CONTACT_SOURCE,
  };
}

/**
 * Best-effort limiter, per server instance: at most `max` requests per key within `windowMs`.
 * Not a guarantee (several instances each count on their own) — it only stops a script hammering one.
 */
export function makeLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    return true;
  };
}
