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

const TAGLINE = "Digitale Speisekarten\naus Wien";
// Plain business cards: logo, one line, contact, one QR with a short caption. No sales copy.
const CARDS = [
  { file: "karte-a-starten", caption: "Kostenlos testen", url: "https://www.oriz.at/registrieren?ref=markt-start" },
  { file: "karte-b-ansehen", caption: "Demo ansehen", url: "https://www.oriz.at/belvedere" },
  {
    file: "karte-c-whatsapp",
    caption: "WhatsApp schreiben",
    url: "https://wa.me/4367764292055?text=" + encodeURIComponent("Hallo, ich interessiere mich für ORIZ."),
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
      absolutePosition: { x: left, y: oy + 42 },
      columns: [{ width: textW, stack: [
        { text: TAGLINE, font: "Cormorant", bold: true, fontSize: 13, lineHeight: 1.0, color: ONYX },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 22, y2: 0, lineWidth: 1.2, lineColor: GOLD }], margin: [0, 6, 0, 0] },
      ] }],
    },
    { svg: c.qr, width: QR, absolutePosition: { x: ox + W - M - QR, y: oy + M } },
    { absolutePosition: { x: ox + W - M - QR - 6, y: oy + M + QR + 6 }, columns: [{ width: QR + 12, text: c.caption, bold: true, fontSize: 7, alignment: "center", color: ONYX }] },
    {
      absolutePosition: { x: left, y: oy + H - M - 35 },
      columns: [{ width: textW + 8, stack: [
        { text: "Nasim Nuridinov", bold: true, fontSize: 8, color: ONYX },
        { text: "+43 677 64292055", fontSize: 7.2, color: ONYX, margin: [0, 2, 0, 0] },
        { text: "office@oriz.at", fontSize: 7.2, color: ONYX },
        { text: "www.oriz.at", fontSize: 7.2, color: ONYX },
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
