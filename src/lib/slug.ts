// The address a restaurant gets at oriz.at/<slug>. No runtime imports — unit-tested.

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

// Top-level routes of the app, plus names we may want later or that would
// let a stranger pass as us. Kept as one list so a new route only needs one line.
const RESERVED = new Set([
  "admin", "api", "app", "auth", "c", "carta", "casa", "demo", "i", "s", "screen", "service", "t",
  "registrieren", "anmelden", "login", "logout", "signup", "register", "neu",
  "preise", "pricing", "hilfe", "help", "support", "kontakt", "contact", "blog",
  "impressum", "datenschutz", "agb", "privacy", "terms", "legal",
  "oriz", "www", "mail", "office", "static", "assets", "public", "images",
  "robots.txt", "sitemap.xml", "favicon.ico", "icon.svg", "opengraph-image",
]);

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

/** "Café Zur Linde" → "cafe-zur-linde". May return "" for names without letters. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (ch) => UMLAUTS[ch])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Null when the slug may be used, otherwise a message for the owner. */
export function slugProblem(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Mindestens ${SLUG_MIN} Zeichen.`;
  if (slug.length > SLUG_MAX) return `Höchstens ${SLUG_MAX} Zeichen.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Nur Kleinbuchstaben, Ziffern und einzelne Bindestriche.";
  }
  if (/^\d+$/.test(slug)) return "Bitte nicht nur Ziffern.";
  if (RESERVED.has(slug)) return "Diese Adresse ist reserviert.";
  return null;
}

export const VENUE_NAME_MAX = 80;

/** Trimmed, single-spaced venue name, or null if empty / too long. */
export function normalizeVenueName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > VENUE_NAME_MAX) return null;
  return name;
}
