// Pages of the printed menu: which sections sit on which sheet, and what changed since the
// last print. Pure — unit-tested.
//
// The idea: a sheet stays what it is. Adding a dish to "Desserts" changes the Desserts sheet
// and nothing else, so only that one has to be printed again. That needs pages the owner
// can rely on, hence explicit pages instead of automatic flowing text.

import { createHash, randomBytes } from "node:crypto";
import type { PrintDesign } from "./design.ts";
import type { PrintSection } from "./model.ts";

export type PagePlan = { id: string; sections: string[] };

/** Bump when the layout changes in a way that makes old sheets look different. */
export const RENDER_VERSION = 1;

export const UNASSIGNED_ID = "p_neu";

export function newPageId(): string {
  return `p_${randomBytes(4).toString("hex")}`;
}

/** Usable text height of an A4 sheet in pt, minus a safety margin; the first sheet carries the big header. */
export const FIRST_PAGE_CAPACITY = 520;
export const NEXT_PAGE_CAPACITY = 610;

/** Greedy first suggestion: sections in menu order, as many per sheet as fit. */
export function suggestPages(sections: { id: string; height: number }[]): PagePlan[] {
  const pages: PagePlan[] = [];
  let used = 0;
  let cap = FIRST_PAGE_CAPACITY;
  for (const s of sections) {
    const current = pages[pages.length - 1];
    if (current && used + s.height <= cap) {
      current.sections.push(s.id);
      used += s.height;
    } else {
      pages.push({ id: newPageId(), sections: [s.id] });
      used = s.height;
      // the first sheet carries the big header and holds less than the following ones
      cap = pages.length === 1 ? FIRST_PAGE_CAPACITY : NEXT_PAGE_CAPACITY;
    }
  }
  return pages;
}

/**
 * Brings stored pages in line with the sections that exist today: removed sections vanish,
 * sheets left empty go away, a section listed twice stays on its first sheet. Sections that
 * are on no sheet are returned in menu order — a new section must never silently miss the print.
 */
export function reconcilePages(pages: PagePlan[], sectionIds: string[]): { pages: PagePlan[]; unassigned: string[] } {
  const exists = new Set(sectionIds);
  const seen = new Set<string>();
  const out: PagePlan[] = [];
  for (const p of pages) {
    const kept = p.sections.filter((id) => exists.has(id) && !seen.has(id));
    kept.forEach((id) => seen.add(id));
    if (kept.length > 0) out.push({ id: p.id, sections: kept });
  }
  return { pages: out, unassigned: sectionIds.filter((id) => !seen.has(id)) };
}

/** The stored pages plus, when something is unassigned, one extra sheet at the end so nothing is lost. */
export function effectivePages(pages: PagePlan[], unassigned: string[]): PagePlan[] {
  return unassigned.length > 0 ? [...pages, { id: UNASSIGNED_ID, sections: unassigned }] : pages;
}

/** Moves a section onto a sheet ("new" makes one). Sections stay in menu order inside a sheet. */
export function assignSection(pages: PagePlan[], sectionId: string, target: string, menuOrder: string[]): PagePlan[] {
  const without = pages.map((p) => ({ id: p.id, sections: p.sections.filter((id) => id !== sectionId) }));
  let next: PagePlan[];
  if (target === "new" || target === UNASSIGNED_ID) next = [...without, { id: newPageId(), sections: [sectionId] }];
  else if (without.some((p) => p.id === target)) next = without.map((p) => (p.id === target ? { id: p.id, sections: [...p.sections, sectionId] } : p));
  else return pages;
  const rank = new Map(menuOrder.map((id, i) => [id, i]));
  return next
    .map((p) => ({ id: p.id, sections: p.sections.slice().sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0)) }))
    .filter((p) => p.sections.length > 0);
}

export function movePage(pages: PagePlan[], pageId: string, direction: -1 | 1): PagePlan[] {
  const i = pages.findIndex((p) => p.id === pageId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= pages.length) return pages;
  const next = pages.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ── What changed since the last print ──────────────────────────────────────

export type PageState = {
  hash: string;
  changedAt: string;
  printedHash?: string;
  printedAt?: string;
  /** The "Stand" that was on the printed sheet, so a change that is undone brings the same date back. */
  printedStand?: string;
};
export type PageStates = Record<string, PageState>;

export const stateKey = (pageId: string, locale: string) => `${pageId}|${locale}`;

/** Short, stable fingerprint of everything that shows on a sheet. */
export function fingerprint(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
}

export type SheetContext = {
  design: PrintDesign;
  /** The accent actually used (the venue's colour when the design has none). */
  accent: string;
  locale: string;
  venueName: string;
  about: string | null;
  /** Identifies the logo (hash of the SVG or the image URL); null = name as text. */
  logoKey: string | null;
  isFirst: boolean;
  menuUrl: string;
};

/**
 * Fingerprint of one sheet: its sections and dishes plus everything in the design that shows on it.
 * Editing a dish on another sheet leaves this one unchanged; changing the colour or template changes all.
 */
export function sheetFingerprint(sections: PrintSection[], ctx: SheetContext): string {
  return fingerprint({
    v: RENDER_VERSION,
    sections: sections.map((s) => ({ name: s.name, items: s.items })),
    design: { template: ctx.design.template, accent: ctx.accent, qr: ctx.design.showQr ? ctx.menuUrl : null },
    locale: ctx.locale,
    venue: ctx.venueName,
    logo: ctx.logoKey,
    first: ctx.isFirst ? { about: ctx.design.showAbout ? ctx.about : null } : null,
  });
}

/**
 * Compares the current fingerprints with the stored ones. A sheet whose fingerprint differs gets
 * today as its "changed" day — that day is the "Stand" printed on the sheet, so an unchanged
 * sheet keeps its date however often it is printed again. Sheets that no longer exist are dropped.
 */
export function syncStates(prev: PageStates, current: Record<string, string>, today: string): PageStates {
  const out: PageStates = {};
  for (const [key, hash] of Object.entries(current)) {
    const old = prev[key];
    if (!old) out[key] = { hash, changedAt: today };
    else if (old.hash === hash) out[key] = old;
    // back to exactly what was printed: the sheet in the folder is right again, with its own date
    else if (old.printedHash === hash && old.printedStand) out[key] = { ...old, hash, changedAt: old.printedStand };
    else out[key] = { ...old, hash, changedAt: today };
  }
  return out;
}

export type PageStatus = "neu" | "geaendert" | "aktuell";

/** neu = never printed, geaendert = differs from what was printed, aktuell = the printed sheet is still right. */
export function pageStatus(state: PageState | undefined): PageStatus {
  if (!state?.printedHash) return "neu";
  return state.printedHash === state.hash ? "aktuell" : "geaendert";
}

/** Records the given sheets as printed in their current state. */
export function markPrinted(states: PageStates, keys: string[], today: string): PageStates {
  const out: PageStates = { ...states };
  for (const key of keys) if (out[key]) out[key] = { ...out[key], printedHash: out[key].hash, printedAt: today, printedStand: out[key].changedAt };
  return out;
}

// ── Dates (Vienna) ─────────────────────────────────────────────────────────

/** Today's calendar day in Vienna, "YYYY-MM-DD". */
export function viennaDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** "2026-10-22" → "22.10.2026" (or the venue language's usual form). */
export function formatDay(day: string, localeTag: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(localeTag, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
