// One sheet of the printed menu in the venue's own design (Pro). Pure: input → pdfmake definition.
//
// Every sheet is built as its own document and the sheets are put together afterwards (see
// render-design.ts). That keeps a sheet independent: its footer lists only the allergens on that
// sheet, its "Stand" is the date this sheet last changed, and a sheet that is reprinted looks
// exactly like the one before unless its content or the design changed.

import { CONTENT_WIDTH, GRAY, INK, MARGINS, PAGE, RULE, itemRow, type PdfDoc } from "./doc.ts";
import { textAccent, type PrintDesign } from "./design.ts";
import type { PrintSection, PrintUi } from "./model.ts";

export type SheetLogo = { kind: "svg"; svg: string } | { kind: "image"; dataUrl: string } | null;

export type SheetInput = {
  design: PrintDesign;
  /** The accent actually used (see resolveAccent). */
  accent: string;
  locale: string;
  venueName: string;
  about: string | null;
  logo: SheetLogo;
  isFirst: boolean;
  sections: PrintSection[];
  legend: { code: string; name: string }[];
  /** The sheet's "Stand", already formatted. */
  standText: string;
  menuUrl: string;
  ui: PrintUi;
  qrSvg: string | null;
};

const logoNode = (logo: NonNullable<SheetLogo>, fit: [number, number]) =>
  logo.kind === "svg"
    ? { svg: logo.svg, fit, alignment: "center" }
    : { image: "logo", fit, alignment: "center" };

function sectionHeading(section: PrintSection, i: SheetInput) {
  const t = i.design.template;
  const accentText = textAccent(i.accent);
  const name = section.name.toLocaleUpperCase(i.locale);

  if (t === "elegant") {
    const rule = (y: number) => ({ canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.6, lineColor: i.accent }], margin: [0, y, 0, 0] });
    return {
      headlineLevel: 1,
      unbreakable: true,
      margin: [0, 18, 0, 3],
      stack: [
        rule(0),
        { text: name, font: "Cormorant", bold: true, fontSize: 17, characterSpacing: 2.4, alignment: "center", color: accentText, margin: [0, 7, 0, 7] },
        rule(0),
      ],
    };
  }

  if (t === "modern") {
    return {
      headlineLevel: 1,
      unbreakable: true,
      margin: [0, 18, 0, 2],
      stack: [
        {
          columns: [
            { width: 10, canvas: [{ type: "rect", x: 0, y: 0, w: 4, h: 13, color: i.accent }] },
            { width: "*", text: name, bold: true, fontSize: 9.5, characterSpacing: 1.6, color: accentText, margin: [0, 1.5, 0, 0] },
          ],
        },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.5, lineColor: RULE }], margin: [0, 6, 0, 0] },
      ],
    };
  }

  // klassisch
  return {
    headlineLevel: 1,
    unbreakable: true,
    margin: [0, 18, 0, 2],
    stack: [
      { text: name, font: "Cormorant", bold: true, fontSize: 15, characterSpacing: 2.2, alignment: "center", color: INK },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 28, y2: 0, lineWidth: 1.2, lineColor: i.accent }], margin: [(CONTENT_WIDTH - 28) / 2, 6, 0, 2] },
    ],
  };
}

function bigHeader(i: SheetInput): unknown[] {
  const out: unknown[] = [];
  // Logo and name stay centred in every template: "logo at the top, in the middle".
  if (i.logo) out.push({ ...logoNode(i.logo, [230, 72]), margin: [0, 2, 0, 0] });
  else out.push({ text: i.venueName, font: "Cormorant", bold: true, fontSize: 30, alignment: "center", characterSpacing: 1.5, margin: [0, 4, 0, 0] });
  if (i.design.showAbout && i.about) {
    out.push({ text: i.about, font: "Cormorant", fontSize: 12.5, alignment: "center", color: GRAY, margin: [46, 8, 46, 0], lineHeight: 1.2 });
  }
  const accentRule = i.design.template === "klassisch" ? 36 : i.design.template === "elegant" ? 60 : 0;
  if (accentRule) out.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: accentRule, y2: 0, lineWidth: 1.2, lineColor: i.accent }], margin: [(CONTENT_WIDTH - accentRule) / 2, 12, 0, 4] });
  else out.push({ text: "", margin: [0, 8, 0, 0] });
  return out;
}

function smallHeader(i: SheetInput) {
  return i.logo
    ? { ...logoNode(i.logo, [130, 26]), margin: [MARGINS.left, 22, MARGINS.right, 0] }
    : { text: i.venueName, font: "Cormorant", bold: true, fontSize: 11, color: GRAY, alignment: "center", margin: [MARGINS.left, 24, MARGINS.right, 0] };
}

export function buildSheetDoc(i: SheetInput): PdfDoc {
  const nameStyle = i.design.template === "elegant" ? { nameFont: "Cormorant", nameSize: 13 } : {};
  const content: unknown[] = [];
  if (i.isFirst) content.push(...bigHeader(i));
  for (const section of i.sections) {
    content.push(sectionHeading(section, i));
    for (const item of section.items) content.push(itemRow(item, nameStyle));
  }

  const legendText = i.legend.length ? `${i.ui.allergens}: ${i.legend.map((l) => `${l.code} ${l.name}`).join("  ·  ")}` : null;
  const footer = () => ({
    margin: [MARGINS.left, 10, MARGINS.right, 0],
    stack: [
      ...(legendText ? [{ text: legendText, fontSize: 7, color: GRAY, lineHeight: 1.25, margin: [0, 0, 0, 6] }] : []),
      {
        columns: [
          ...(i.design.showQr && i.qrSvg
            ? [
                { svg: i.qrSvg, width: 34 },
                {
                  width: "*",
                  margin: [9, 4, 0, 0],
                  stack: [
                    { text: i.ui.online, fontSize: 8, bold: true },
                    { text: i.menuUrl.replace(/^https?:\/\//, ""), fontSize: 8, color: GRAY },
                  ],
                },
              ]
            : [{ width: "*", text: "" }]),
          { width: "auto", alignment: "right", margin: [0, 4, 0, 0], text: `${i.ui.stand}: ${i.standText}`, fontSize: 8, bold: true },
        ],
      },
    ],
  });

  // First sheet: the big header is part of the content, later physical pages of that sheet get the small one.
  const header = (page: number) => (i.isFirst && page === 1 ? null : smallHeader(i));

  return {
    pageSize: "A4",
    pageMargins: [MARGINS.left, MARGINS.top, MARGINS.right, MARGINS.bottom],
    info: { title: `${i.venueName}`, author: i.venueName, creator: "ORIZ" },
    defaultStyle: { font: "Inter", fontSize: 10, lineHeight: 1.2, color: INK },
    ...(i.logo?.kind === "image" ? { images: { logo: i.logo.dataUrl } } : {}),
    ...(i.design.template === "modern"
      ? { background: () => ({ canvas: [{ type: "rect", x: 0, y: 0, w: PAGE.width, h: 6, color: i.accent }] }) }
      : {}),
    header,
    footer,
    content,
    pageBreakBefore: (current: { headlineLevel?: number }, following: unknown[]) => current.headlineLevel === 1 && following.length === 0,
  };
}
