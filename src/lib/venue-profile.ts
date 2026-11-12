// The venue's own page ("Lokal" in the admin, "Info" for guests): checking what the owner types,
// and how complete it is. No runtime imports — unit-tested.

export const ABOUT_MAX = 400;
export const GALLERY_MAX = 8;
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type Hours = Partial<Record<Weekday, [string, string][]>>;
export const PRICE_RANGES = ["€", "€€", "€€€", "€€€€"] as const;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** "oriz.at", "www.x.at/y", "https://x.at" → https URL; empty → null; anything that is not a web address → undefined (invalid). */
export function normalizeUrl(raw: unknown): string | null | undefined {
  const v = clean(raw, 300);
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return undefined;
    return u.toString().replace(/\/$/, u.pathname === "/" && !u.search ? "" : "/");
  } catch {
    return undefined;
  }
}

/** "@trattoria", "trattoria", "instagram.com/trattoria" → https://www.instagram.com/trattoria */
export function normalizeInstagram(raw: unknown): string | null | undefined {
  const v = clean(raw, 300);
  if (!v) return null;
  const handle = v.match(/^@?([A-Za-z0-9._]{1,30})$/)?.[1];
  if (handle) return `https://www.instagram.com/${handle}`;
  const url = normalizeUrl(v);
  if (!url) return url;
  return /instagram\.com/i.test(url) ? url : undefined;
}

/** Phone as typed, only digits, spaces, + / ( ) - kept; at least 6 digits. */
export function normalizePhone(raw: unknown): string | null | undefined {
  const v = clean(raw, 40);
  if (!v) return null;
  if (!/^[+\d\s/()\-.]+$/.test(v) || v.replace(/\D/g, "").length < 6) return undefined;
  return v;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Opening hours from the form: per day up to two ranges "HH:MM"; closing after midnight is allowed. */
export function cleanHours(raw: unknown): Hours | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Hours = {};
  for (const day of WEEKDAYS) {
    const slots = (raw as Record<string, unknown>)[day];
    if (!Array.isArray(slots)) continue;
    const ok = slots
      .filter((s): s is [string, string] => Array.isArray(s) && TIME.test(String(s[0])) && TIME.test(String(s[1])) && s[0] !== s[1])
      .slice(0, 2)
      .map(([a, b]) => [a, b] as [string, string]);
    if (ok.length) out[day] = ok;
  }
  return Object.keys(out).length ? out : null;
}

export function cleanAbout(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw.trim().replace(/\n{3,}/g, "\n\n").slice(0, ABOUT_MAX) : "";
  return v || null;
}

export type ProfileFacts = {
  about: string | null;
  cover_url: string | null;
  gallery: string[] | null;
  phone: string | null;
  address: string | null;
  opening_hours: Hours | null;
  website_url: string | null;
  instagram_url: string | null;
  google_review_url: string | null;
};

export type ProfileCheck = { key: string; label: string; done: boolean; part: "auftritt" | "kontakt" | "zeiten" | "links" };

/** What a guest misses when it is empty — the order is what matters most first. */
export function profileChecklist(p: ProfileFacts): ProfileCheck[] {
  return [
    { key: "about", label: "Kurzer Text über Ihr Lokal", done: !!p.about, part: "auftritt" },
    { key: "cover", label: "Titelbild", done: !!p.cover_url, part: "auftritt" },
    { key: "gallery", label: "Fotos vom Lokal", done: (p.gallery?.length ?? 0) > 0, part: "auftritt" },
    { key: "phone", label: "Telefon", done: !!p.phone, part: "kontakt" },
    { key: "address", label: "Adresse", done: !!p.address, part: "kontakt" },
    { key: "hours", label: "Öffnungszeiten", done: !!p.opening_hours && Object.keys(p.opening_hours).length > 0, part: "zeiten" },
    { key: "website", label: "Website oder Instagram", done: !!(p.website_url || p.instagram_url), part: "links" },
    { key: "review", label: "Link zu Ihren Google-Bewertungen", done: !!p.google_review_url, part: "links" },
  ];
}
