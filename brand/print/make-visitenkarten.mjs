// Business cards 85 x 55 mm, one side, white. Run from the project root:
//   node brand/print/make-visitenkarten.mjs
// Writes brand/print/visitenkarten/: one PDF per card (for a print shop) and one A4 sheet file with
// 10 cards per variant (for printing at home or in a copy shop; cut marks in the margins).
import fs from "node:fs";
import path from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";

const ONYX = "#0A0A0A", GOLD = "#C69B3C", GREY = "#57534e";
const fontDir = path.join(process.cwd(), "src/lib/print/fonts");
const f = (n) => path.join(fontDir, n);
pdfmake.setFonts({
  Inter: { normal: f("Inter-Regular.ttf"), bold: f("Inter-SemiBold.ttf"), italics: f("Inter-Regular.ttf"), bolditalics: f("Inter-SemiBold.ttf") },
  Cormorant: { normal: f("CormorantGaramond-Medium.ttf"), bold: f("CormorantGaramond-SemiBold.ttf"), italics: f("CormorantGaramond-Medium.ttf"), bolditalics: f("CormorantGaramond-SemiBold.ttf") },
});
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((p) => path.resolve(p).startsWith(fontDir));

const MM = 72 / 25.4;
const W = 85 * MM, H = 55 * MM, M = 14, QR = 74;
const logo = fs.readFileSync(path.join(process.cwd(), "brand/svg/oriz-horizontal.svg"), "utf8");

const CARDS = [
  {
    file: "karte-a-starten",
    headline: "Ihre Speisekarte auf jedem Handy.",
    sub: "Gäste scannen den QR-Code am Tisch: Fotos, Allergene, vier Sprachen. 14 Tage kostenlos testen.",
    caption: "Jetzt kostenlos starten",
    url: "https://www.oriz.at/registrieren?ref=markt-start",
  },
  {
    file: "karte-b-ansehen",
    headline: "So sehen Gäste Ihre Karte.",
    sub: "Scannen und die Demo-Karte ansehen: so sehen Ihre Gäste die Karte, mit Fotos, Allergenen und vier Sprachen.",
    caption: "Demo-Karte ansehen",
    url: "https://www.oriz.at/belvedere",
  },
  {
    file: "karte-c-wir-machen-es",
    headline: "Keine Zeit für die Karte?",
    sub: "Foto Ihrer Karte schicken, wir tragen alles ein. Ab € 149 bis 80 Gerichte, fertig in 2 Werktagen.",
    caption: "Foto per WhatsApp senden",
    url: "https://wa.me/4367764292055?text=" + encodeURIComponent("Hallo, bitte tragen Sie meine Speisekarte bei ORIZ ein."),
  },
];

const qrSvg = (text) => QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: ONYX, light: "#FFFFFF" } });
for (const c of CARDS) c.qr = await qrSvg(c.url);

/** Everything of one card as absolutely positioned nodes; (ox, oy) is the card's top-left corner. */
function card(c, ox, oy) {
  const left = ox + M, textW = W - 3 * M - QR;
  return [
    { svg: logo, width: 62, absolutePosition: { x: left, y: oy + M } },
    {
      absolutePosition: { x: left, y: oy + 38 },
      columns: [{ width: textW, stack: [
        { text: c.headline, font: "Cormorant", bold: true, fontSize: 14, lineHeight: 0.98, color: ONYX },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 22, y2: 0, lineWidth: 1.2, lineColor: GOLD }], margin: [0, 4, 0, 3] },
        { text: c.sub, fontSize: 6.3, lineHeight: 1.22, color: ONYX },
      ] }],
    },
    { svg: c.qr, width: QR, absolutePosition: { x: ox + W - M - QR, y: oy + M } },
    { absolutePosition: { x: ox + W - M - QR - 6, y: oy + M + QR + 6 }, columns: [{ width: QR + 12, text: c.caption, bold: true, fontSize: 7, alignment: "center", color: ONYX }] },
    {
      absolutePosition: { x: left, y: oy + H - M - 16 },
      columns: [{ width: textW + 8, stack: [
        { text: "Nasim Nuridinov", bold: true, fontSize: 7, color: ONYX },
        { text: "+43 677 64292055 · office@oriz.at", fontSize: 6.4, color: GREY, margin: [0, 1, 0, 0] },
        { text: "www.oriz.at", fontSize: 6.4, color: GREY },
      ] }],
    },
  ];
}

const base = { defaultStyle: { font: "Inter" }, info: { author: "ORIZ" } };
const outDir = path.join(process.cwd(), "brand/print/visitenkarten");
fs.mkdirSync(outDir, { recursive: true });

// One card per file.
for (const c of CARDS) {
  const doc = { ...base, pageSize: { width: W, height: H }, pageMargins: 0, info: { title: `ORIZ Visitenkarte ${c.file}`, author: "ORIZ" }, content: card(c, 0, 0) };
  fs.writeFileSync(path.join(outDir, `${c.file}.pdf`), await pdfmake.createPdf(doc).getBuffer());
}

// A4 sheets: 2 columns x 5 rows = 10 cards per sheet, one sheet per variant.
const PW = 210 * MM, PH = 297 * MM;
const gx = (PW - 2 * W) / 2, gy = (PH - 5 * H) / 2;
const marks = [];
const tick = (x1, y1, x2, y2) => ({ type: "line", x1, y1, x2, y2, lineWidth: 0.4, lineColor: "#000000" });
const L = 8;
for (const x of [gx, gx + W, gx + 2 * W]) { marks.push(tick(x, gy - 3 - L, x, gy - 3)); marks.push(tick(x, gy + 5 * H + 3, x, gy + 5 * H + 3 + L)); }
for (let r = 0; r <= 5; r++) { const y = gy + r * H; marks.push(tick(gx - 3 - L, y, gx - 3, y)); marks.push(tick(gx + 2 * W + 3, y, gx + 2 * W + 3 + L, y)); }
const content = [];
CARDS.forEach((c, i) => {
  if (i > 0) content.push({ text: "", pageBreak: "before" });
  content.push({ canvas: marks, absolutePosition: { x: 0, y: 0 } });
  for (let r = 0; r < 5; r++) for (let k = 0; k < 2; k++) content.push(...card(c, gx + k * W, gy + r * H));
});
const sheet = { ...base, pageSize: "A4", pageMargins: 0, info: { title: "ORIZ Visitenkarten A4 (3 Blätter à 10)", author: "ORIZ" }, content };
fs.writeFileSync(path.join(outDir, "visitenkarten-A4-druckbogen.pdf"), await pdfmake.createPdf(sheet).getBuffer());
console.log("written to", outDir);
