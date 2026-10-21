// Table helpers shared by the /app admin, the print sheet and the /t/<code> entry.
// Pure module: no runtime imports, so node --test can load it directly.

// Same alphabet as gen_table_code() in migration 0016: no 0/O, 1/I/L.
export const TABLE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TABLE_CODE_LENGTH = 8;
export const MAX_TABLES_PER_VENUE = 200;
export const MAX_TABLES_PER_BATCH = 100;
export const MAX_LABEL_LENGTH = 40;

const CODE_RE = new RegExp(`^[${TABLE_CODE_ALPHABET}]{${TABLE_CODE_LENGTH}}$`);

export function isTableCode(value: string): boolean {
  return CODE_RE.test(value.toUpperCase());
}

/** Fresh random code; `random` is injectable for tests. */
export function newTableCode(random: (n: number) => Uint8Array = cryptoBytes): string {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % TABLE_CODE_ALPHABET.length);
  let out = "";
  while (out.length < TABLE_CODE_LENGTH) {
    for (const byte of random(TABLE_CODE_LENGTH * 2)) {
      if (byte >= limit) continue;
      out += TABLE_CODE_ALPHABET[byte % TABLE_CODE_ALPHABET.length];
      if (out.length === TABLE_CODE_LENGTH) break;
    }
  }
  return out;
}

function cryptoBytes(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

/** Trimmed, single-spaced label, or null when empty or too long. */
export function normalizeLabel(raw: string): string | null {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!label || label.length > MAX_LABEL_LENGTH) return null;
  return label;
}

/**
 * `count` new numeric labels that continue after the highest numeric label
 * already in use: ["1","2","Bar"] + 3 → ["3","4","5"].
 */
export function nextNumericLabels(existing: string[], count: number): string[] {
  const taken = new Set(existing.map((l) => l.toLowerCase()));
  let n = existing.reduce((max, l) => (/^\d+$/.test(l) ? Math.max(max, Number(l)) : max), 0);
  const out: string[] = [];
  while (out.length < count) {
    n += 1;
    const label = String(n);
    if (!taken.has(label)) out.push(label);
  }
  return out;
}

type Sortable = { label: string; zone: string | null; position: number };

/** Zone first (no zone last), then label with numbers in natural order. */
export function compareTables(a: Sortable, b: Sortable): number {
  const za = a.zone ?? "￿";
  const zb = b.zone ?? "￿";
  if (za !== zb) return za.localeCompare(zb, "de");
  const byLabel = a.label.localeCompare(b.label, "de", { numeric: true });
  return byLabel !== 0 ? byLabel : a.position - b.position;
}

/** "8" → "Tisch 8", "12a" → "Tisch 12a", "Bar" stays "Bar". */
export function tableDisplayName(label: string): string {
  return /^\d+[a-z]?$/i.test(label) ? `Tisch ${label}` : label;
}

export function tableUrl(code: string, origin = "https://oriz.at"): string {
  return `${origin}/t/${code}`;
}
