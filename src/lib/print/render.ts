import "server-only";
import path from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";
import { buildPrintDoc } from "./doc.ts";
import type { PrintModel } from "./model.ts";

// Fonts live in the repo (SIL Open Font License): Inter for text, Cormorant Garamond
// for the venue name and section titles — the same pair as the website. Latin + Cyrillic.
const FONT_DIR = path.join(process.cwd(), "src/lib/print/fonts");
const f = (name: string) => path.join(FONT_DIR, name);

let configured = false;
function configure() {
  if (configured) return;
  pdfmake.setFonts({
    Inter: { normal: f("Inter-Regular.ttf"), bold: f("Inter-SemiBold.ttf"), italics: f("Inter-Regular.ttf"), bolditalics: f("Inter-SemiBold.ttf") },
    Cormorant: {
      normal: f("CormorantGaramond-Medium.ttf"),
      bold: f("CormorantGaramond-SemiBold.ttf"),
      italics: f("CormorantGaramond-Medium.ttf"),
      bolditalics: f("CormorantGaramond-SemiBold.ttf"),
    },
  });
  // Venue text goes into the document: it may never make the renderer read a file or fetch a URL.
  pdfmake.setLocalAccessPolicy((p) => path.resolve(p).startsWith(FONT_DIR));
  pdfmake.setUrlAccessPolicy(() => false);
  configured = true;
}

/** pdfmake with fonts and access limits set up (shared by the free PDF and the print design). */
export function getPdfmake() {
  configure();
  return pdfmake;
}

/** The finished PDF for one venue's menu. */
export async function renderMenuPdf(model: PrintModel): Promise<Buffer> {
  configure();
  const qrSvg = await QRCode.toString(model.menuUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });
  return pdfmake.createPdf(buildPrintDoc(model, qrSvg)).getBuffer();
}
