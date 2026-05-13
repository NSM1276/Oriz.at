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
  title: "ORIZ — Quiet menus for fine restaurants",
  description:
    "ORIZ replaces the paper menu and the restaurant website with one calm, live surface. Frankfurt-hosted. GDPR-clean.",
  openGraph: {
    title: "ORIZ — Digital Excellence",
    description:
      "The quiet replacement for the paper menu — and the restaurant website.",
    siteName: "ORIZ",
    locale: "en_EU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORIZ — Digital Excellence",
    description: "The quiet replacement for the paper menu — and the restaurant website.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable}`}>
      <body className="font-sans bg-parchment text-onyx">{children}</body>
    </html>
  );
}
