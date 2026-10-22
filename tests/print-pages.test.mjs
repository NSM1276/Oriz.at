// tests/print-pages.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  UNASSIGNED_ID, assignSection, effectivePages, formatDay, markPrinted, movePage, pageStatus,
  reconcilePages, sheetFingerprint, stateKey, suggestPages, syncStates, viennaDay,
} from "../src/lib/print/pages.ts";
import { DEFAULT_DESIGN, accentChoices, cleanDesign, contrastOnWhite, resolveAccent, textAccent } from "../src/lib/print/design.ts";

const ids = (pages) => pages.map((p) => p.sections);

test("suggestion: sections stay whole and fill a sheet before the next one starts", () => {
  const pages = suggestPages([{ id: "a", height: 200 }, { id: "b", height: 200 }, { id: "c", height: 200 }, { id: "d", height: 300 }]);
  assert.deepEqual(ids(pages), [["a", "b"], ["c", "d"]]);
  assert.ok(pages.every((p) => /^p_[0-9a-f]{8}$/.test(p.id)));
});

test("suggestion: a section larger than a sheet gets a sheet of its own", () => {
  const pages = suggestPages([{ id: "a", height: 100 }, { id: "big", height: 900 }, { id: "b", height: 100 }]);
  assert.deepEqual(ids(pages), [["a"], ["big"], ["b"]]);
});

test("reconcile: removed sections vanish, empty sheets go, duplicates stay on the first sheet", () => {
  const pages = [{ id: "p1", sections: ["a", "gone"] }, { id: "p2", sections: ["gone2"] }, { id: "p3", sections: ["a", "b"] }];
  const r = reconcilePages(pages, ["a", "b", "c", "d"]);
  assert.deepEqual(r.pages, [{ id: "p1", sections: ["a"] }, { id: "p3", sections: ["b"] }]);
  assert.deepEqual(r.unassigned, ["c", "d"]); // new sections are never lost
});

test("effective pages: unassigned sections become one extra sheet at the end", () => {
  const eff = effectivePages([{ id: "p1", sections: ["a"] }], ["c"]);
  assert.equal(eff.length, 2);
  assert.equal(eff[1].id, UNASSIGNED_ID);
  assert.equal(effectivePages([{ id: "p1", sections: ["a"] }], []).length, 1);
});

test("assign: to an existing sheet, to a new one, in menu order, empties removed, unknown target ignored", () => {
  const order = ["a", "b", "c"];
  const base = [{ id: "p1", sections: ["a", "c"] }, { id: "p2", sections: ["b"] }];
  assert.deepEqual(ids(assignSection(base, "b", "p1", order)), [["a", "b", "c"]]); // p2 became empty
  const withNew = assignSection(base, "c", "new", order);
  assert.deepEqual(ids(withNew), [["a"], ["b"], ["c"]]);
  assert.equal(assignSection(base, "c", "p_nope", order), base);
});

test("move a sheet up or down; the ends stay put", () => {
  const pages = [{ id: "1", sections: ["a"] }, { id: "2", sections: ["b"] }, { id: "3", sections: ["c"] }];
  assert.deepEqual(movePage(pages, "2", -1).map((p) => p.id), ["2", "1", "3"]);
  assert.deepEqual(movePage(pages, "1", -1).map((p) => p.id), ["1", "2", "3"]);
  assert.deepEqual(movePage(pages, "3", 1).map((p) => p.id), ["1", "2", "3"]);
});

// ── fingerprints and "what changed since the last print" ───────────────────

const item = (name, price = "10,00 €") => ({ name, text: null, allergens: null, diet: null, prices: [{ label: null, price }] });
const ctx = (over = {}) => ({ design: DEFAULT_DESIGN, accent: "#C69B3C", locale: "de", venueName: "Haus", about: "Seit 1987", logoKey: "logo1", isFirst: false, menuUrl: "https://oriz.at/haus", ...over });
const mains = [{ id: "s1", name: "Hauptspeisen", items: [item("Schnitzel"), item("Gulasch")] }];
const sweets = [{ id: "s2", name: "Desserts", items: [item("Kaiserschmarrn")] }];

test("a sheet's fingerprint is stable and changes only with what shows on it", () => {
  const f = sheetFingerprint(mains, ctx());
  assert.equal(f, sheetFingerprint(mains, ctx()));
  // a price on THIS sheet changes it …
  assert.notEqual(f, sheetFingerprint([{ ...mains[0], items: [item("Schnitzel", "19,00 €"), item("Gulasch")] }], ctx()));
  // … the other sheet is untouched by that edit
  assert.equal(sheetFingerprint(sweets, ctx()), sheetFingerprint(sweets, ctx()));
});

test("design changes reprint every sheet; the big first-sheet header only counts on the first sheet", () => {
  const f = sheetFingerprint(mains, ctx());
  assert.notEqual(f, sheetFingerprint(mains, ctx({ accent: "#0A0A0A" })));
  assert.notEqual(f, sheetFingerprint(mains, ctx({ design: { ...DEFAULT_DESIGN, template: "elegant" } })));
  assert.notEqual(f, sheetFingerprint(mains, ctx({ logoKey: "logo2" })));
  assert.notEqual(f, sheetFingerprint(mains, ctx({ locale: "en" })));
  // the about line shows on the first sheet only
  assert.equal(f, sheetFingerprint(mains, ctx({ about: "Anderer Text" })));
  assert.notEqual(sheetFingerprint(mains, ctx({ isFirst: true })), sheetFingerprint(mains, ctx({ isFirst: true, about: "Anderer Text" })));
  // QR on/off changes the sheet
  assert.notEqual(f, sheetFingerprint(mains, ctx({ design: { ...DEFAULT_DESIGN, showQr: false } })));
});

test("states: new sheets, unchanged sheets keep their Stand, changed sheets get today", () => {
  const k1 = stateKey("p1", "de");
  const k2 = stateKey("p2", "de");
  let s = syncStates({}, { [k1]: "h1", [k2]: "h2" }, "2026-10-01");
  assert.deepEqual(s[k1], { hash: "h1", changedAt: "2026-10-01" });
  s = syncStates(s, { [k1]: "h1", [k2]: "h2b" }, "2026-10-22");
  assert.equal(s[k1].changedAt, "2026-10-01"); // unchanged: the old date stays
  assert.equal(s[k2].changedAt, "2026-10-22");
  s = syncStates(s, { [k1]: "h1" }, "2026-10-23");
  assert.deepEqual(Object.keys(s), [k1]); // a removed sheet is forgotten
});

test("status: never printed → printed → changed → printed again", () => {
  const k = stateKey("p1", "de");
  let s = syncStates({}, { [k]: "h1" }, "2026-10-01");
  assert.equal(pageStatus(s[k]), "neu");
  s = markPrinted(s, [k], "2026-10-02");
  assert.equal(pageStatus(s[k]), "aktuell");
  assert.equal(s[k].printedAt, "2026-10-02");
  s = syncStates(s, { [k]: "h2" }, "2026-10-10");
  assert.equal(pageStatus(s[k]), "geaendert");
  s = markPrinted(s, [k], "2026-10-11");
  assert.equal(pageStatus(s[k]), "aktuell");
  assert.equal(pageStatus(undefined), "neu");
});

test("marking a sheet that has no state does nothing", () => {
  assert.deepEqual(markPrinted({}, ["x|de"], "2026-10-02"), {});
});

test("dates: the Vienna day, not the UTC day", () => {
  assert.equal(viennaDay(new Date("2026-10-22T22:30:00Z")), "2026-10-23");
  assert.equal(viennaDay(new Date("2026-10-22T10:00:00Z")), "2026-10-22");
  assert.equal(formatDay("2026-10-05", "de-AT"), "05.10.2026");
});

// ── design ────────────────────────────────────────────────────────────────

test("design input is validated", () => {
  assert.deepEqual(cleanDesign({ template: "modern", accent: "#c69b3c", showQr: true, showAbout: false }), { template: "modern", accent: "#C69B3C", showQr: true, showAbout: false });
  assert.deepEqual(cleanDesign({ template: "elegant", accent: null, showQr: true, showAbout: true }).accent, null);
  assert.equal(cleanDesign({ template: "fancy", accent: null, showQr: true, showAbout: true }), null);
  assert.equal(cleanDesign({ template: "modern", accent: "red", showQr: true, showAbout: true }), null);
  assert.equal(cleanDesign({ template: "modern", accent: "#12345", showQr: true, showAbout: true }), null);
  assert.equal(cleanDesign({ template: "modern", accent: null, showQr: "yes", showAbout: true }), null);
  assert.equal(cleanDesign(null), null);
});

test("accent as text is darkened until it can be read on white", () => {
  assert.ok(contrastOnWhite("#C69B3C") < 4.5); // pale gold is too light for text as it is
  assert.ok(contrastOnWhite(textAccent("#C69B3C")) >= 4.5);
  assert.equal(textAccent("#0A0A0A"), "#0A0A0A"); // already dark: unchanged
  assert.equal(textAccent("nonsense"), "#0A0A0A");
});

test("accent fallback chain and the swatches offered", () => {
  assert.equal(resolveAccent({ ...DEFAULT_DESIGN, accent: "#112233" }, "#C69B3C"), "#112233");
  assert.equal(resolveAccent(DEFAULT_DESIGN, "#c69b3c"), "#C69B3C");
  assert.equal(resolveAccent(DEFAULT_DESIGN, null), "#0A0A0A");
  assert.deepEqual(accentChoices("#C69B3C", ["#C69B3C", "#B87333", "#bad"]), ["#0A0A0A", "#C69B3C", "#B87333"]);
});

// ── logo for the PDF ──────────────────────────────────────────────────────
import { prepareLogoSvg } from "../src/lib/print/logo-svg.ts";

test("logo svg: currentColor becomes the chosen colour, size comes from the viewBox", () => {
  const stored = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" style="height:48px;width:auto;display:block"><path fill="currentColor" d="M0 0h10v10z"/></svg>';
  const out = prepareLogoSvg(stored, "#0A0A0A");
  assert.match(out, /width="200" height="50"/);
  assert.ok(!/currentColor/.test(out));
  assert.match(out, /fill="#0A0A0A"/);
  assert.ok(!/style=/.test(out), "the on-screen height style is dropped");
});

test("logo svg: existing width and height are kept; unusable input gives null", () => {
  assert.match(prepareLogoSvg('<svg width="120" height="40" viewBox="0 0 300 100"><g fill="currentColor"/></svg>', "#112233"), /width="120" height="40"/);
  assert.equal(prepareLogoSvg("<svg><g/></svg>", "#112233"), null); // nothing to size it by
  assert.equal(prepareLogoSvg("not an svg", "#112233"), null);
  assert.equal(prepareLogoSvg('<svg viewBox="0 0 10 10"/>', "red"), null);
});

test("states: a change that is undone brings the printed sheet's own Stand back", () => {
  const k = stateKey("p1", "de");
  let s = syncStates({}, { [k]: "h1" }, "2026-10-01");
  s = markPrinted(s, [k], "2026-10-02"); // printed with Stand 01.10.
  s = syncStates(s, { [k]: "h2" }, "2026-10-10"); // a price changes
  assert.equal(s[k].changedAt, "2026-10-10");
  assert.equal(pageStatus(s[k]), "geaendert");
  s = syncStates(s, { [k]: "h1" }, "2026-10-12"); // ... and is changed back
  assert.equal(pageStatus(s[k]), "aktuell"); // nothing to reprint
  assert.equal(s[k].changedAt, "2026-10-01"); // the date on the sheet in the folder
});
