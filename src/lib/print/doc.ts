// The free print layout: A4, black on white, ready for an office printer.
// Pure function from the print model to a pdfmake document definition.
//
// Layout decisions:
//  • Page 1 carries the venue's name; later pages a small running head.
//  • A dish never splits across pages, and a section title is never left alone at the
//    bottom of a page.
//  • Every page ends with the same footer — allergen legend, QR to the live menu, "Stand"
//    date, small ORIZ line — so a page pulled out of a folder is still complete.
//  • Wider margin on the left (20 mm) for hole punches and folder edges.

import type { PrintModel } from "./model.ts";

export type PdfDoc = Record<string, unknown>;

export const INK = "#0A0A0A";
export const GRAY = "#555555";
export const LIGHT = "#8A8A8A";
export const RULE = "#D9D9D9";

export const PAGE = { width: 595.28, height: 841.89 };
export const MARGINS = { left: 57, top: 52, right: 45, bottom: 98 }; // pt: 20 mm left, 16 mm right
export const CONTENT_WIDTH = PAGE.width - MARGINS.left - MARGINS.right;

/** Sizes like "0,3 l" must not break between the number and the unit. */
export function nbsp(s: string): string {
  return s.replace(/ /g, " ");
}

type PrintItem = PrintModel["sections"][number]["items"][number];

// Rough heights in pt, from the sizes used below (A4: 692 pt of text area between header and footer).
const HEADING_HEIGHT = 44;
const KEEP_TOGETHER_MAX = 600;
const CHARS_PER_LINE = 88; // 9 pt description in the name column

export function estimateSectionHeight(section: PrintModel["sections"][number]): number {
  let h = HEADING_HEIGHT;
  for (const it of section.items) {
    const text = it.text ? 1.5 + 10.8 * Math.ceil(it.text.length / CHARS_PER_LINE) : 0;
    const left = 13.2 + text;
    const right = 13.2 * Math.max(1, it.prices.length);
    h += Math.max(left, right) + 11;
  }
  return h;
}

/** How a dish row looks; the free PDF uses the defaults. */
export type ItemStyle = { nameFont?: string; nameSize?: number };

export function itemRow(item: PrintItem, style: ItemStyle = {}) {
  const nameLine: Record<string, unknown>[] = [
    { text: item.name, bold: true, fontSize: style.nameSize ?? 11, ...(style.nameFont ? { font: style.nameFont } : {}) },
  ];
  if (item.allergens) nameLine.push({ text: `  ${item.allergens}`, fontSize: 8, color: LIGHT });
  if (item.diet) nameLine.push({ text: `  ${item.diet}`, fontSize: 8, color: LIGHT, italics: true });

  const left: Record<string, unknown>[] = [{ text: nameLine }];
  if (item.text) left.push({ text: item.text, fontSize: 9, color: GRAY, margin: [0, 1.5, 0, 0] });

  const right = item.prices.map((p) => ({
    alignment: "right",
    noWrap: true,
    text: p.label
      ? [{ text: `${nbsp(p.label)}  `, fontSize: 9, color: GRAY }, { text: p.price, bold: true }]
      : [{ text: p.price, bold: true }],
  }));

  return {
    unbreakable: true,
    margin: [0, 0, 0, 0],
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === node.table.body.length ? 0.4 : 0),
      hLineColor: () => RULE,
      vLineWidth: () => 0,
      paddingTop: () => 5.5,
      paddingBottom: () => 5.5,
      paddingLeft: (i: number) => (i === 0 ? 0 : 14),
      paddingRight: () => 0,
    },
    table: {
      widths: ["*", "auto"],
      body: [[{ stack: left }, { stack: right.length ? right : [{ text: "" }] }]],
    },
  };
}

export function buildPrintDoc(model: PrintModel, qrSvg: string): PdfDoc {
  const content: unknown[] = [];

  // Page 1 head: the venue's name, an optional line about the house, a short rule.
  content.push({
    text: model.venueName,
    font: "Cormorant",
    bold: true,
    fontSize: 30,
    alignment: "center",
    characterSpacing: 1.5,
    margin: [0, 4, 0, 0],
  });
  if (model.about) {
    content.push({
      text: model.about,
      font: "Cormorant",
      fontSize: 12.5,
      alignment: "center",
      color: GRAY,
      margin: [46, 6, 46, 0],
      lineHeight: 1.2,
    });
  }
  content.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 36, y2: 0, lineWidth: 1, lineColor: INK }],
    margin: [(CONTENT_WIDTH - 36) / 2, 12, 0, 6],
  });

  for (const section of model.sections) {
    const heading = {
      text: section.name.toLocaleUpperCase(model.locale),
      font: "Cormorant",
      bold: true,
      fontSize: 15,
      characterSpacing: 2.2,
      alignment: "center",
      margin: [0, 20, 0, 4],
      headlineLevel: 1,
    };
    const rows = section.items.map((it) => itemRow(it));
    // A section that fits on one page stays together: it moves to the next page as a whole,
    // so a page pulled out of a folder never starts in the middle of a section.
    // Longer sections flow over the pages (the heading rule below still applies).
    if (estimateSectionHeight(section) <= KEEP_TOGETHER_MAX) content.push({ unbreakable: true, stack: [heading, ...rows] });
    else content.push(heading, ...rows);
  }

  const legendText = model.legend.length
    ? `${model.ui.allergens}: ${model.legend.map((l) => `${l.code} ${l.name}`).join("  ·  ")}`
    : null;

  const footer = () => ({
    margin: [MARGINS.left, 10, MARGINS.right, 0],
    stack: [
      ...(legendText ? [{ text: legendText, fontSize: 7, color: GRAY, lineHeight: 1.25, margin: [0, 0, 0, 6] }] : []),
      {
        columns: [
          { svg: qrSvg, width: 34 },
          {
            width: "*",
            margin: [9, 4, 0, 0],
            stack: [
              { text: model.ui.online, fontSize: 8, bold: true },
              { text: model.menuUrl.replace(/^https?:\/\//, ""), fontSize: 8, color: GRAY },
            ],
          },
          {
            width: "auto",
            alignment: "right",
            margin: [0, 4, 0, 0],
            stack: [
              { text: `${model.ui.stand}: ${model.standDate}`, fontSize: 8, bold: true },
              { text: "ORIZ · oriz.at", fontSize: 7, color: LIGHT },
            ],
          },
        ],
      },
    ],
  });

  const header = (page: number) =>
    page === 1
      ? null
      : { text: model.venueName, font: "Cormorant", bold: true, fontSize: 11, color: GRAY, alignment: "center", margin: [MARGINS.left, 24, MARGINS.right, 0] };

  return {
    pageSize: "A4",
    pageMargins: [MARGINS.left, MARGINS.top, MARGINS.right, MARGINS.bottom],
    info: { title: `${model.venueName} — ${model.standDate}`, author: model.venueName, creator: "ORIZ" },
    defaultStyle: { font: "Inter", fontSize: 10, lineHeight: 1.2, color: INK },
    header,
    footer,
    content,
    // Never leave a section title alone at the bottom of a page.
    pageBreakBefore: (current: { headlineLevel?: number }, following: unknown[]) => current.headlineLevel === 1 && following.length === 0,
  };
}
