import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // pdfmake reads font files at runtime; keep it out of the bundle and ship the fonts with the route.
  serverExternalPackages: ["pdfmake"],
  outputFileTracingIncludes: {
    "/app/[slug]/speisekarte/pdf": ["./src/lib/print/fonts/**/*"],
  },
};

export default config;
