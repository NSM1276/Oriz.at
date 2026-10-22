import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { MarketingAnalytics } from "@/components/MarketingAnalytics";
import { SITE_URL } from "@/lib/site";

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
  title: "ORIZ — Digitale Speisekarte & Hospitality Software aus Wien",
  description:
    "ORIZ ersetzt die Papierkarte durch eine ruhige, lebendige Speisekarte per QR-Code. Carta · Casa · Screen — für Restaurants, Hotels & Pensionen. Aus Wien.",
  metadataBase: new URL(SITE_URL),
  // "./" = the address of the page itself. A fixed address here would be inherited by every page
  // that sets none, telling search engines that each of them is a copy of the home page.
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "ORIZ — Digitale Speisekarte für Restaurants & Hotels",
    description:
      "Drei Produkte. Eine Sprache. Carta (Speisekarte), Casa (Begrüßungskarte), Screen (Lobby-Display) — quiet luxury für Gastronomie & Hospitality.",
    siteName: "ORIZ",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORIZ — Digitale Speisekarte aus Wien",
    description: "Carta · Casa · Screen — quiet luxury für Gastronomie & Hospitality.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  keywords: [
    "digitale Speisekarte",
    "QR Code Speisekarte",
    "Restaurant Software Wien",
    "Menükarte digital",
    "Hotel Gästekarte",
    "Hospitality Software",
    "ORIZ",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${inter.variable} ${garamond.variable}`}>
      <body className="font-sans bg-parchment text-onyx">
        {children}
        <MarketingAnalytics />
      </body>
    </html>
  );
}
