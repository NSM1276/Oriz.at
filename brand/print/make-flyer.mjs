// Print-ready A6 card (front and back) with two QR codes. Run from the project root:
//   node brand/print/make-flyer.mjs [source-tag]        e.g. markt  ->  brand/print/oriz-karte-markt.pdf
// The registration QR carries ?ref=<tag>, so sign-ups from this card can be told apart.
import fs from "node:fs";
import path from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";

const tag = (process.argv[2] ?? "markt").toLowerCase();
if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(tag)) throw new Error("source tag: letters, digits, - and _ only");

const ONYX = "#0A0A0A", GOLD = "#C69B3C", PARCHMENT = "#F5F0EC", GREY = "#57534e";
const fontDir = path.join(process.cwd(), "src/lib/print/fonts");
const f = (n) => path.join(fontDir, n);
pdfmake.setFonts({
  Inter: { normal: f("Inter-Regular.ttf"), bold: f("Inter-SemiBold.ttf"), italics: f("Inter-Regular.ttf"), bolditalics: f("Inter-SemiBold.ttf") },
  Cormorant: { normal: f("CormorantGaramond-Medium.ttf"), bold: f("CormorantGaramond-SemiBold.ttf"), italics: f("CormorantGaramond-Medium.ttf"), bolditalics: f("CormorantGaramond-SemiBold.ttf") },
});
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((p) => path.resolve(p).startsWith(fontDir));

const W = 297.64, H = 419.53, M = 24;
const URL_SIGNUP = `https://www.oriz.at/registrieren?ref=${tag}`;
const URL_DEMO = "https://www.oriz.at/belvedere";
const URL_WHATSAPP = "https://wa.me/4367764292055?text=" + encodeURIComponent("Hallo, ich interessiere mich für ORIZ Carta.");

const qr = (text, dark, light) => QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light } });
const logo = (name) => fs.readFileSync(path.join(process.cwd(), "brand/svg", name), "utf8");
const rect = (x, y, w, h, color) => ({ canvas: [{ type: "rect", x: 0, y: 0, w, h, color }], absolutePosition: { x, y } });

const [qrSignup, qrDemo, qrWa] = await Promise.all([
  qr(URL_SIGNUP, ONYX, "#FFFFFF"),
  qr(URL_DEMO, ONYX, "#FFFFFF"),
  qr(URL_WHATSAPP, ONYX, "#FFFFFF"),
]);

const BIG = 116, SMALL = 78;
const doc = {
  pageSize: { width: W, height: H },
  pageMargins: 0,
  defaultStyle: { font: "Inter", fontSize: 9, lineHeight: 1.3 },
  info: { title: "ORIZ Carta — Karte", author: "ORIZ" },
  background: (page) => ({ canvas: [{ type: "rect", x: 0, y: 0, w: W, h: H, color: page === 1 ? ONYX : PARCHMENT }] }),
  content: [
    // ── Front ──
    { svg: logo("oriz-horizontal-dark.svg"), width: 130, absolutePosition: { x: M, y: M } },
    {
      absolutePosition: { x: M, y: 92 },
      stack: [
        { text: "Ihre Speisekarte.\nAuf jedem Handy.", font: "Cormorant", bold: true, fontSize: 28, lineHeight: 1.05, color: PARCHMENT },
        { text: "In Sekunden aktuell.", font: "Cormorant", bold: true, fontSize: 28, lineHeight: 1.05, color: GOLD },
        { text: "Gäste scannen den QR-Code am Tisch und sehen Ihre Karte — mit Fotos, Allergenen und in vier Sprachen.", color: PARCHMENT, margin: [0, 12, 0, 0], width: W - 2 * M },
      ],
    },
    rect((W - BIG - 16) / 2, 254, BIG + 16, BIG + 16, "#FFFFFF"),
    { svg: qrSignup, width: BIG, absolutePosition: { x: (W - BIG) / 2, y: 262 } },
    { text: "Scannen und 14 Tage kostenlos testen", alignment: "center", bold: true, color: GOLD, absolutePosition: { x: 0, y: 392 }, width: W },
    { pageBreak: "after", text: "" },
    // ── Back ──
    { svg: logo("oriz-horizontal.svg"), width: 100, absolutePosition: { x: M, y: M } },
    {
      absolutePosition: { x: M, y: 70 },
      width: W - 2 * M,
      stack: [
        { text: "Keine Zeit?", font: "Cormorant", bold: true, fontSize: 24, color: ONYX },
        { text: "Wir tragen Ihre Karte für Sie ein — mit Preisen, Größen und Allergenen. Einmalig, ab € 149 für bis zu 80 Gerichte. Fertig innerhalb von 2 Werktagen.", margin: [0, 6, 0, 0], color: ONYX },
      ],
    },
    rect(M, 168, SMALL + 12, SMALL + 12, "#FFFFFF"),
    { svg: qrDemo, width: SMALL, absolutePosition: { x: M + 6, y: 174 } },
    { text: "So sieht die Karte für Ihre Gäste aus", bold: true, absolutePosition: { x: M, y: 262 }, width: SMALL + 12, fontSize: 8.5, color: ONYX },
    rect(W - M - SMALL - 12, 168, SMALL + 12, SMALL + 12, "#FFFFFF"),
    { svg: qrWa, width: SMALL, absolutePosition: { x: W - M - SMALL - 6, y: 174 } },
    { text: "Fragen? Direkt auf WhatsApp", bold: true, absolutePosition: { x: W - M - SMALL - 12, y: 262 }, width: SMALL + 12, fontSize: 8.5, color: ONYX },
    {
      absolutePosition: { x: M, y: 330 },
      width: W - 2 * M,
      stack: [
        { text: "+43 677 64292055 · office@oriz.at", bold: true, color: ONYX },
        { text: "www.oriz.at", color: GREY, margin: [0, 2, 0, 0] },
      ],
    },
    { text: "ORIZ · Digitale Speisekarten aus Wien", color: GREY, fontSize: 7.5, absolutePosition: { x: M, y: H - 28 } },
  ],
};

const out = path.join(process.cwd(), `brand/print/oriz-karte-${tag}.pdf`);
fs.writeFileSync(out, await pdfmake.createPdf(doc).getBuffer());
console.log("written", out);
