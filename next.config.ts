import type { NextConfig } from "next";

const FONTS = ["./src/lib/print/fonts/**/*"];

const config: NextConfig = {
  reactStrictMode: true,
  // pdfmake reads font files at runtime; keep it out of the bundle and ship the fonts with every
  // route that lays out a PDF (the page counts sheets to warn about full ones).
  serverExternalPackages: ["pdfmake"],
  outputFileTracingIncludes: {
    "/app/[slug]/speisekarte/pdf": FONTS,
    "/app/[slug]/druck": FONTS,
    "/app/[slug]/druck/pdf": FONTS,
  },
};

export default config;
