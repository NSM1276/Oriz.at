import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | ORIZ",
  description: "Welche Daten ORIZ Carta verarbeitet, wofür und welche Rechte Sie haben.",
  alternates: { canonical: "https://oriz.at/datenschutz" },
};

// Draft written from what the code actually does on 2026-10-22. It is not legal advice:
// the owner should have it checked (WKO Wien / lawyer) before relying on it, and it must be
// updated when e-mail sending (Resend), payments (Stripe) or visitor statistics go live.
export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro="Hier steht, welche personenbezogenen Daten wir bei ORIZ verarbeiten, wofür und welche Rechte Sie haben. Wir halten uns dabei kurz und konkret."
      sections={[
        {
          heading: "Verantwortlicher",
          paragraphs: [
            "Nasim Nuridinov e.U.\nTscherttegasse 39, 1120 Wien, Österreich\nE-Mail: office@oriz.at\nTelefon: +43 677 64292055",
          ],
        },
        {
          heading: "Besuch dieser Website",
          paragraphs: [
            "Beim Aufruf unserer Seiten verarbeitet unser Hosting-Anbieter technisch notwendige Verbindungsdaten (zum Beispiel IP-Adresse, Zeitpunkt und aufgerufene Seite), um die Seite auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse am sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).",
            "Hosting: Vercel Inc., USA. Unsere Funktionen laufen in der Region Frankfurt (EU). Bei der Übermittlung in die USA stützt sich Vercel auf Standardvertragsklauseln beziehungsweise das EU-US Data Privacy Framework.",
            "Die Schriftarten werden beim Erstellen der Seite abgelegt und von unserem eigenen Server geladen. Dabei werden keine Daten an Schriftarten-Anbieter übertragen.",
          ],
        },
        {
          heading: "Besucherstatistik",
          paragraphs: [
            "Auf unseren Informationsseiten (Startseite, Carta, Registrierung, Impressum, Datenschutz) messen wir mit Vercel Web Analytics, welche Seiten aufgerufen werden und woher Besucher kommen (zum Beispiel Instagram, Google). Der Dienst setzt keine Cookies und legt keine Profile einzelner Personen an. Erfasst werden die aufgerufene Seite, die Herkunftsseite, Land, Browser und Gerätetyp. Auch das Abschließen einer Registrierung wird als Zahl gezählt, ohne E-Mail-Adresse oder andere Angaben.",
            "Rechtsgrundlage ist unser berechtigtes Interesse, unser Angebot zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Anbieter ist Vercel Inc., USA. Speisekarten für Gäste, der Bereich für Betriebe und die Service-Ansicht werden nicht gemessen.",
          ],
        },
        {
          heading: "Speisekarte für Gäste",
          paragraphs: [
            "Wenn Gäste eine Speisekarte über einen QR-Code öffnen, legen wir keine Nutzerprofile an und fragen keine persönlichen Daten ab. Die gewählte Sprache wird im Browser des Geräts gespeichert (localStorage), damit sie beim nächsten Besuch erhalten bleibt. Diese Speicherung ist technisch erforderlich und braucht keine Einwilligung.",
            "Nutzt ein Gast die Funktion „Service rufen“, wird kurzzeitig im Browser gespeichert, an welchem Tisch der Gast sitzt und ob ein Ruf aktiv ist (Cookie bzw. sessionStorage). Es werden keine Namen oder Kontaktdaten erfasst.",
          ],
        },
        {
          heading: "Konto für Gastronomiebetriebe",
          paragraphs: [
            "Wer ein Konto anlegt, gibt E-Mail-Adresse, Passwort und Angaben zum Betrieb (zum Beispiel Name, Adresse, Speisekarte, Fotos) an. Wir verarbeiten diese Daten, um den Dienst bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO). Passwörter werden nicht im Klartext gespeichert.",
            "Für die Anmeldung setzen wir Cookies, die für den eingeloggten Zustand technisch notwendig sind. Sie werden nur gesetzt, wenn Sie sich anmelden.",
            "Datenbank, Anmeldung und Dateispeicher betreibt Supabase in einem Rechenzentrum in Frankfurt (EU). Mit Supabase besteht ein Auftragsverarbeitungsverhältnis.",
            "Wir speichern Ihre Daten, solange das Konto besteht. Nach Kündigung löschen wir sie auf Anfrage, soweit keine gesetzliche Aufbewahrungspflicht besteht.",
          ],
        },
        {
          heading: "Kontakt und Anfragen",
          paragraphs: [
            "Wenn Sie uns per E-Mail, Telefon oder über ein Kontaktformular schreiben, verwenden wir Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b oder f DSGVO). Wir geben sie nicht zu Werbezwecken weiter.",
            "Formulare auf unserer Website leiten die Nachricht über den Dienst formsubmit.co an unser E-Mail-Postfach weiter. Dieser Dienst verarbeitet den Inhalt der Nachricht dafür vorübergehend.",
          ],
        },
        {
          heading: "Ihre Rechte",
          paragraphs: [
            "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Schreiben Sie dazu an office@oriz.at.",
            "Wenn Sie glauben, dass wir Ihre Daten nicht rechtmäßig verarbeiten, können Sie sich bei der Österreichischen Datenschutzbehörde beschweren (dsb.gv.at).",
          ],
        },
      ]}
      updated="22. Oktober 2026"
    />
  );
}
