import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = {
  title: "Impressum | ORIZ",
  description: "Impressum und Anbieterkennzeichnung von ORIZ, Nasim Nuridinov e.U., Wien.",
};

// Data below is the owner's existing published Impressum, moved here unchanged.
// "Unternehmensgegenstand" still says web design; the owner has to confirm the wording
// that matches the registered trade (Gewerbe) before software is named here.
export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      sections={[
        {
          heading: "Angaben gemäß § 5 ECG",
          paragraphs: [
            "Nasim Nuridinov e.U.\nTscherttegasse 39\n1120 Wien, Österreich",
            "E-Mail: office@oriz.at\nTelefon: +43 677 64292055",
          ],
        },
        { heading: "Unternehmensgegenstand", paragraphs: ["Webdesign & Webentwicklung"] },
        { heading: "UID-Nummer", paragraphs: ["ATU80802758"] },
        {
          heading: "Aufsichtsbehörde",
          paragraphs: ["Magistrat der Stadt Wien\nMitglied der WKO Wien"],
        },
        {
          heading: "Haftungsausschluss",
          paragraphs: [
            "Alle Inhalte dieser Website wurden sorgfältig erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Informationen wird keine Gewähr übernommen.",
          ],
        },
      ]}
      updated="22. Oktober 2026"
    />
  );
}
