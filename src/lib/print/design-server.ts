import "server-only";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { serviceClient } from "@/lib/auth";
import { loadMenuPayload } from "@/lib/menu-loader";
import { estimateSectionHeight } from "./doc.ts";
import { buildSheetDoc, type SheetLogo } from "./doc-design.ts";
import { DEFAULT_DESIGN, resolveAccent, type PrintDesign } from "./design.ts";
import { loadLogo } from "./logo.ts";
import { buildPrintModel, dateTagFor, legendFor, type PrintModel, type PrintSection } from "./model.ts";
import {
  effectivePages, fingerprint, formatDay, markPrinted, pageStatus, reconcilePages, sheetFingerprint,
  newPageId, stateKey, suggestPages, syncStates, viennaDay, type PagePlan, type PageState, type PageStates, type PageStatus,
} from "./pages.ts";
import { getPdfmake } from "./render";

type Row = {
  template: PrintDesign["template"];
  accent: string | null;
  show_qr: boolean;
  show_about: boolean;
  pages: PagePlan[] | null;
  states: PageStates | null;
};

export type Sheet = {
  id: string;
  /** 1-based position, for the screen only: it is not printed on the sheet. */
  index: number;
  sections: PrintSection[];
  fingerprint: string;
  state: PageState;
  status: PageStatus;
  /** True for the extra sheet made of sections nobody has placed yet. */
  virtual: boolean;
};

export type DesignContext = {
  venue: { id: string; slug: string; name: string };
  locale: string;
  model: PrintModel;
  design: PrintDesign;
  accent: string;
  logo: SheetLogo;
  logoKey: string | null;
  /** Section ids in menu order (sections without dishes are not printable). */
  sectionOrder: string[];
  sheets: Sheet[];
  today: string;
};

const SELECT = "template, accent, show_qr, show_about, pages, states";

/**
 * Everything the print design needs for one venue and language: the design, the sheets, and what
 * changed since each was last printed. Writes back what it had to work out (first suggestion of
 * the sheets, removed sections, new fingerprints) so the next visit starts from the same state.
 */
export async function loadDesignContext(
  slug: string,
  requestedLocale: string | null,
  opts: { forceSuggest?: boolean } = {},
): Promise<DesignContext | null> {
  const payload = await loadMenuPayload(slug);
  if (!payload) return null;
  const now = new Date();
  const today = viennaDay(now);
  const model = buildPrintModel({ venue: payload.venue, sections: payload.sections as never }, requestedLocale, now);
  const venueId = payload.venue.id;

  const db = serviceClient();
  const { data: row } = await db.from("print_designs").select(SELECT).eq("venue_id", venueId).maybeSingle<Row>();
  const design: PrintDesign = row ? { template: row.template, accent: row.accent, showQr: row.show_qr, showAbout: row.show_about } : DEFAULT_DESIGN;

  const accent = resolveAccent(design, payload.venue.color_primary);
  const { logo, key: logoKey } = await loadLogo(payload.venue, "#0A0A0A");

  const sectionOrder = model.sections.map((s) => s.id);
  // First visit (or "split again"): suggest sheets, then check them with the real layout.
  const stored =
    row?.pages && row.pages.length > 0 && !opts.forceSuggest
      ? row.pages
      : await fitSuggestion(
          { design, accent, logo, model },
          suggestPages(model.sections.map((s) => ({ id: s.id, height: estimateSectionHeight(s) }))),
          today,
        );
  const { pages, unassigned } = reconcilePages(stored, sectionOrder);
  const eff = effectivePages(pages, unassigned);

  const byId = new Map(model.sections.map((s) => [s.id, s]));
  const sheetsRaw = eff.map((p, i) => {
    const sections = p.sections.map((id) => byId.get(id)!).filter(Boolean);
    const fp = sheetFingerprint(sections, {
      design, accent, locale: model.locale, venueName: model.venueName, about: model.about, logoKey, isFirst: i === 0, menuUrl: model.menuUrl,
    });
    return { id: p.id, sections, fp };
  });

  const current = Object.fromEntries(sheetsRaw.map((s) => [stateKey(s.id, model.locale), s.fp]));
  const states = syncStates(row?.states ?? {}, current, today);

  // Persist whatever changed on the way (only the "stored" pages, never the virtual sheet).
  const storedChanged = JSON.stringify(pages) !== JSON.stringify(row?.pages ?? null);
  const statesChanged = JSON.stringify(states) !== JSON.stringify(row?.states ?? {});
  if (storedChanged || statesChanged) {
    await db.from("print_designs").upsert({ venue_id: venueId, pages, states, updated_at: new Date().toISOString() }, { onConflict: "venue_id" });
  }

  const sheets: Sheet[] = sheetsRaw.map((s, i) => {
    const state = states[stateKey(s.id, model.locale)];
    return { id: s.id, index: i + 1, sections: s.sections, fingerprint: s.fp, state, status: pageStatus(state), virtual: i >= pages.length };
  });

  return { venue: { id: venueId, slug: payload.venue.slug, name: payload.venue.name }, locale: model.locale, model, design, accent, logo, logoKey, sectionOrder, sheets, today };
}

/** The stored sheets and the menu order, without the heavy parts (logo, layout) — for the actions that edit the plan. */
export async function loadPlan(slug: string): Promise<{ venueId: string; pages: PagePlan[]; sectionOrder: string[]; model: PrintModel } | null> {
  const payload = await loadMenuPayload(slug);
  if (!payload) return null;
  const model = buildPrintModel({ venue: payload.venue, sections: payload.sections as never }, null, new Date());
  const sectionOrder = model.sections.map((s) => s.id);
  const { data: row } = await serviceClient().from("print_designs").select("pages").eq("venue_id", payload.venue.id).maybeSingle<{ pages: PagePlan[] | null }>();
  const stored = row?.pages && row.pages.length > 0 ? row.pages : suggestPages(model.sections.map((s) => ({ id: s.id, height: estimateSectionHeight(s) })));
  return { venueId: payload.venue.id, pages: reconcilePages(stored, sectionOrder).pages, sectionOrder, model };
}

/** Stores a new page plan (the sheets and what is on them). */
export async function savePages(venueId: string, pages: PagePlan[]): Promise<void> {
  await serviceClient().from("print_designs").upsert({ venue_id: venueId, pages, updated_at: new Date().toISOString() }, { onConflict: "venue_id" });
}

/** Records the given sheets as printed in their current state. */
export async function recordPrinted(ctx: DesignContext, sheetIds: string[]): Promise<void> {
  const db = serviceClient();
  const { data: row } = await db.from("print_designs").select("states").eq("venue_id", ctx.venue.id).maybeSingle<{ states: PageStates | null }>();
  const keys = sheetIds.map((id) => stateKey(id, ctx.locale));
  const next = markPrinted(row?.states ?? Object.fromEntries(ctx.sheets.map((s) => [stateKey(s.id, ctx.locale), s.state])), keys, ctx.today);
  await db.from("print_designs").upsert({ venue_id: ctx.venue.id, states: next, updated_at: new Date().toISOString() }, { onConflict: "venue_id" });
}

// ── The PDF ────────────────────────────────────────────────────────────────

type Layout = { design: PrintDesign; accent: string; logo: SheetLogo; model: PrintModel };

/** Lays out one sheet (these sections, first or not) and returns the PDF of it. */
async function layoutSheet(base: Layout, sections: PrintSection[], isFirst: boolean, standDay: string, qrSvg: string | null): Promise<Buffer> {
  const doc = buildSheetDoc({
    design: base.design,
    accent: base.accent,
    locale: base.model.locale,
    venueName: base.model.venueName,
    about: base.model.about,
    logo: base.logo,
    isFirst,
    sections,
    legend: legendFor(sections, base.model.locale),
    standText: formatDay(standDay, dateTagFor(base.model.locale)),
    menuUrl: base.model.menuUrl,
    ui: base.model.ui,
    qrSvg,
  });
  return getPdfmake().createPdf(doc).getBuffer();
}

function sheetBuffer(ctx: DesignContext, sheet: Sheet, qrSvg: string | null): Promise<Buffer> {
  return layoutSheet(ctx, sheet.sections, sheet.index === 1, sheet.state.changedAt, qrSvg);
}

async function qrFor(ctx: { design: PrintDesign; model: PrintModel }): Promise<string | null> {
  if (!ctx.design.showQr) return null;
  return QRCode.toString(ctx.model.menuUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0A0A0A", light: "#FFFFFF" } });
}

/**
 * Takes the rough first split of the sections and makes it real: a sheet that does not fit on one
 * page (checked with the actual layout, headers and fonts included) hands its last section to the
 * next sheet, until it fits. A single section that is too long stays alone and is flagged on screen.
 */
async function fitSuggestion(base: Layout, suggested: PagePlan[], today: string): Promise<PagePlan[]> {
  const byId = new Map(base.model.sections.map((s) => [s.id, s]));
  const qr = await qrFor(base);
  const pages = suggested.map((p) => ({ id: p.id, sections: [...p.sections] }));
  let guard = 0;
  for (let i = 0; i < pages.length; i++) {
    while (pages[i].sections.length > 1 && guard++ < 80) {
      const sections = pages[i].sections.map((id) => byId.get(id)!).filter(Boolean);
      const count = (await PDFDocument.load(await layoutSheet(base, sections, i === 0, today, qr))).getPageCount();
      if (count <= 1) break;
      const moved = pages[i].sections.pop()!;
      if (pages[i + 1]) pages[i + 1].sections.unshift(moved);
      else pages.push({ id: newPageId(), sections: [moved] });
    }
  }
  return pages;
}

/** The chosen sheets as one PDF (each sheet starts on a new page). Also tells how many pages each sheet needed. */
export async function renderSheets(ctx: DesignContext, sheetIds: string[]): Promise<{ pdf: Buffer; pagesPerSheet: Record<string, number> }> {
  const qr = await qrFor(ctx);
  const out = await PDFDocument.create();
  const pagesPerSheet: Record<string, number> = {};
  for (const sheet of ctx.sheets.filter((s) => sheetIds.includes(s.id))) {
    const src = await PDFDocument.load(await sheetBuffer(ctx, sheet, qr));
    pagesPerSheet[sheet.id] = src.getPageCount();
    for (const p of await out.copyPages(src, src.getPageIndices())) out.addPage(p);
  }
  out.setTitle(ctx.model.venueName);
  out.setCreator("ORIZ");
  return { pdf: Buffer.from(await out.save()), pagesPerSheet };
}

// A sheet that needs more than one page is "full": it would spill onto a second page.
// Counting means laying it out, so the answer is kept per fingerprint.
const countCache = new Map<string, number>();

export async function sheetPageCounts(ctx: DesignContext): Promise<Record<string, number>> {
  const qr = await qrFor(ctx);
  const out: Record<string, number> = {};
  for (const sheet of ctx.sheets) {
    const key = fingerprint([sheet.fingerprint, ctx.design.showQr]);
    let n = countCache.get(key);
    if (n === undefined) {
      n = (await PDFDocument.load(await sheetBuffer(ctx, sheet, qr))).getPageCount();
      if (countCache.size > 500) countCache.clear();
      countCache.set(key, n);
    }
    out[sheet.id] = n;
  }
  return out;
}
