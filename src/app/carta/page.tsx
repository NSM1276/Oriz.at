import type { Metadata } from "next";
import { PLAN_PRICE_EUR } from "@/lib/entitlements";
import CartaLanding from "./CartaLanding";

// The product page of the digital menu: what it does and what it costs. The home page sells the
// idea, this one answers "what exactly do I get" — so its title leads with features and prices.
export const metadata: Metadata = {
  title: `Digitale Speisekarte: Funktionen & Preise ab ${PLAN_PRICE_EUR.starter} € | ORIZ Carta`,
  description: `Was ORIZ Carta kann und was es kostet: Starter ${PLAN_PRICE_EUR.starter} €, Pro ${PLAN_PRICE_EUR.pro} € pro Monat. QR-Karte mit Allergenen, vier Sprachen, Druck-PDF. 14 Tage kostenlos testen.`,
  openGraph: {
    title: `ORIZ Carta — Digitale Speisekarte ab ${PLAN_PRICE_EUR.starter} € im Monat`,
    description: "QR-Karte mit Allergenen, Fotos und vier Sprachen. Preise in Sekunden ändern. Aus Wien.",
    siteName: "ORIZ",
    locale: "de_AT",
    type: "website",
  },
};

export default function CartaPage() {
  return <CartaLanding />;
}
