"use client";

import { usePathname } from "next/navigation";

// One title per admin page, in the same place on every page (pages no longer draw their own).
const TITLES: { path: string; title: string; text?: string }[] = [
  { path: "speisekarte/gericht", title: "Gericht" },
  { path: "speisekarte", title: "Speisekarte", text: "Gerichte, Preise, Allergene und Sprachen. Änderungen sind sofort online." },
  { path: "statistik", title: "Statistik", text: "Wie oft Ihre Karte geöffnet wird, was Gäste ansehen und wie schnell Ihr Team reagiert." },
  { path: "tische", title: "Tische", text: "Jeder Tisch hat einen eigenen QR-Code. So wissen Sie, von welchem Tisch gerufen wird." },
  { path: "service", title: "Service-Ruf", text: "Gäste rufen vom Tisch aus. Ihr Team sieht es auf Handy, Tablet oder Uhr." },
  { path: "druck", title: "Druck-Design", text: "Ihre Karte auf Papier — Blatt für Blatt, nur das Geänderte neu drucken." },
  { path: "aussehen", title: "Aussehen", text: "Darstellung, Farben und Logo. Die Vorschau zeigt Ihre echte Karte." },
  { path: "lokal", title: "Ihr Lokal", text: "Fotos, Text, Kontakt, Öffnungszeiten und Links — das sehen Gäste oben in der Karte und unter „Info“." },
  { path: "leistungen", title: "Leistungen", text: "Keine Zeit? Wir erledigen das für Sie — von Hand, innerhalb von 2 Werktagen nach Zahlung." },
  { path: "konto", title: "Konto & Abo" },
];

export function PageTitle({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  if (pathname === base || pathname.startsWith(`${base}/start`)) return null; // the start page greets on its own
  const rest = pathname.slice(base.length + 1);
  const hit = TITLES.find((t) => rest === t.path || rest.startsWith(`${t.path}/`));
  if (!hit) return null;
  // The dish editor has its own back link and heading.
  if (hit.path === "speisekarte/gericht") return null;
  return (
    <div className="mb-5 print:hidden">
      <h1 className="font-display text-4xl font-medium leading-tight text-onyx">{hit.title}</h1>
    </div>
  );
}
