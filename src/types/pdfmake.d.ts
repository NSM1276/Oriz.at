// pdfmake 0.3 ships no types; this covers the few calls we make.
declare module "pdfmake" {
  type Fonts = Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>;
  interface PdfDocument {
    getBuffer(): Promise<Buffer>;
  }
  interface Pdfmake {
    setFonts(fonts: Fonts): void;
    setUrlAccessPolicy(policy: (url: string) => boolean): void;
    setLocalAccessPolicy(policy: (path: string) => boolean): void;
    createPdf(definition: Record<string, unknown>): PdfDocument;
  }
  const pdfmake: Pdfmake;
  export default pdfmake;
}
