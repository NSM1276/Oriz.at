// Paid services done by hand: menu setup and photo editing. No runtime
// imports — unit-tested. Prices live here, in one place; the order stores the
// price it was placed at, so changing them never touches existing orders.

export type ServiceKind = "menu_setup" | "photo_edit";
export type OrderStatus = "entwurf" | "neu" | "bezahlt" | "in_arbeit" | "fertig" | "storniert";

/** One-time price for "Wir richten Ihre Karte ein": covers up to MENU_SETUP_INCLUDED_DISHES dishes. */
export const MENU_SETUP_PRICE_CENTS = 149_00;
export const MENU_SETUP_INCLUDED_DISHES = 80;
/** Every dish above that costs this much more. */
export const MENU_SETUP_EXTRA_DISH_CENTS = 1_50;
export const MENU_SETUP_MAX_DISHES = 500;
/** What we promise: done within this many working days after payment and complete material. */
export const TURNAROUND_WORKDAYS = 2;
/** Price per edited photo, and the smallest order. */
export const PHOTO_PRICE_CENTS = 5_00;
export const PHOTO_MIN = 10;
export const PHOTO_MAX = 200;

export const MENU_FILES_MAX = 20;
export const FILE_MAX_BYTES = 25 * 1024 * 1024;
export const OPEN_ORDERS_MAX = 5;
export const NOTES_MAX = 2000;

export const SERVICE_INFO: Record<ServiceKind, { title: string; short: string }> = {
  menu_setup: {
    title: "Wir richten Ihre Karte ein",
    short: "Sie schicken uns Ihre Speisekarte als Foto, PDF, Word oder Link — wir tragen alles ein: Bereiche, Gerichte, Preise, Größen, Allergene und auf Wunsch Übersetzungen.",
  },
  photo_edit: {
    title: "Fotos Ihrer Gerichte bearbeiten",
    short: "Sie schicken uns Fotos Ihrer Gerichte — wir machen Licht, Farben und Hintergrund ruhig und einheitlich, das Gericht selbst bleibt unverändert.",
  },
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  entwurf: "Entwurf",
  neu: "Wartet auf Zahlung",
  bezahlt: "Bezahlt",
  in_arbeit: "In Arbeit",
  fertig: "Fertig",
  storniert: "Storniert",
};

export function isServiceKind(v: unknown): v is ServiceKind {
  return v === "menu_setup" || v === "photo_edit";
}

export type PriceResult = { ok: true; quantity: number; priceCents: number } | { ok: false; error: string };

/**
 * `count` is the number of photos for photo_edit and the (estimated) number of dishes for menu_setup.
 * For menu_setup it is stored as the order's quantity; orders placed before dishes were counted hold 1.
 */
export function orderPrice(kind: ServiceKind, count: number): PriceResult {
  if (kind === "menu_setup") {
    const dishes = Number.isFinite(count) ? Math.floor(count) : 0;
    if (dishes < 1) return { ok: false, error: "Bitte die ungefähre Zahl der Gerichte angeben." };
    if (dishes > MENU_SETUP_MAX_DISHES) return { ok: false, error: `Ab ${MENU_SETUP_MAX_DISHES} Gerichten machen wir Ihnen gern ein persönliches Angebot.` };
    return { ok: true, quantity: dishes, priceCents: MENU_SETUP_PRICE_CENTS + Math.max(0, dishes - MENU_SETUP_INCLUDED_DISHES) * MENU_SETUP_EXTRA_DISH_CENTS };
  }
  const photoCount = count;
  const n = Math.floor(photoCount);
  if (!(n >= PHOTO_MIN)) return { ok: false, error: `Mindestens ${PHOTO_MIN} Fotos pro Auftrag.` };
  if (n > PHOTO_MAX) return { ok: false, error: `Höchstens ${PHOTO_MAX} Fotos pro Auftrag.` };
  return { ok: true, quantity: n, priceCents: n * PHOTO_PRICE_CENTS };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function allowedTypes(kind: ServiceKind): string[] {
  return kind === "photo_edit" ? IMAGE_TYPES : [...IMAGE_TYPES, ...DOC_TYPES];
}

/** Phones send HEIC as "" or octet-stream; the extension decides then. */
export function fileType(name: string, type: string): string {
  if (type && type !== "application/octet-stream") return type;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    heic: "image/heic", heif: "image/heif", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    pdf: "application/pdf", txt: "text/plain", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return byExt[ext] ?? type;
}

export type FileCheck = { ok: true } | { ok: false; error: string };

export function checkFiles(kind: ServiceKind, files: { name: string; size: number; type: string }[], hasLink: boolean): FileCheck {
  const max = kind === "photo_edit" ? PHOTO_MAX : MENU_FILES_MAX;
  if (files.length === 0 && !(kind === "menu_setup" && hasLink)) {
    return { ok: false, error: kind === "photo_edit" ? "Bitte Fotos auswählen." : "Bitte Dateien auswählen oder einen Link angeben." };
  }
  if (files.length > max) return { ok: false, error: `Höchstens ${max} Dateien pro Auftrag.` };
  const types = allowedTypes(kind);
  for (const f of files) {
    if (!types.includes(fileType(f.name, f.type))) {
      return { ok: false, error: `„${f.name}“: dieses Format nehmen wir nicht an.` };
    }
    if (f.size > FILE_MAX_BYTES) return { ok: false, error: `„${f.name}“ ist größer als 25 MB.` };
  }
  return { ok: true };
}

/** Storage path inside the private bucket; the original name only survives as a cleaned suffix. */
export function uploadPath(venueId: string, orderId: string, index: number, name: string): string {
  const clean = name.normalize("NFKD").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(-80);
  return `${venueId}/${orderId}/${String(index + 1).padStart(3, "0")}-${clean}`;
}

/** Which way an order may move; anything else is refused. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  entwurf: ["neu", "storniert"],
  neu: ["bezahlt", "storniert"],
  bezahlt: ["in_arbeit", "fertig", "storniert"],
  in_arbeit: ["fertig", "bezahlt"],
  fertig: ["in_arbeit"],
  storniert: ["neu"],
};

export function canMove(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from]?.includes(to) ?? false;
}

/** Stripe Payment Link with our order id, or null while no link is configured. */
export function paymentUrl(base: string | undefined, orderId: string, email: string | null): string | null {
  if (!base || !/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(base)) return null;
  const url = new URL(base);
  url.searchParams.set("client_reference_id", orderId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}

export const euro = (cents: number) =>
  new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(cents / 100);
