import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const garamond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORIZ — Stille Speisekarten für die Spitzengastronomie",
  description:
    "ORIZ ersetzt die Papierkarte und die Restaurant-Website durch eine ruhige, lebendige Oberfläche. Aus Wien. DSGVO-konform.",
  openGraph: {
    title: "ORIZ — Digitale Exzellenz",
    description:
      "Der stille Ersatz für die Papierkarte — und die Restaurant-Website.",
    siteName: "ORIZ",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORIZ — Digitale Exzellenz",
    description: "Der stille Ersatz für die Papierkarte — und die Restaurant-Website.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${inter.variable} ${garamond.variable}`}>
      <body className="font-sans bg-parchment text-onyx">{children}</body>
    </html>
  );
}
