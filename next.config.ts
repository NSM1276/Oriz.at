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
  // ORIZ is the digital menu only for now. Screen and Casa stay in the code (and their
  // venue pages keep working) but their sales pages lead home until we bring them back.
  // Basic browser protections on every response. Our own pages may frame each other (the sample
  // menu on the main page, the preview in the owner app); other sites may not frame us.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://oriz.at https://*.oriz.at" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/screen", destination: "/", permanent: false },
      { source: "/casa", destination: "/", permanent: false },
      // The old plans page: its content now lives on the main page.
      { source: "/carta", destination: "/#preis", permanent: true },
    ];
  },
};

export default config;
