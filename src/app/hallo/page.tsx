import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact-info";
import { PERSON, personName, phoneHref } from "@/lib/person";
import { PRICE_MONTH, PRICE_YEAR, TRIAL_DAYS } from "@/lib/offer";
import { venueUrl } from "@/lib/venue-host";

// The page behind the QR code on the business card. A restaurant owner who was not in when we
// called opens it later: who was here, what it is about in three sentences, and how to reach a
// person. No form and nothing automatic — the next step is a call or a WhatsApp message.

export const metadata: Metadata = {
  title: `${personName} — ORIZ, digitale Speisekarten aus Wien`,
  description: "Ich war bei Ihnen im Lokal. Hier steht kurz, worum es geht und wie Sie mich erreichen.",
  robots: { index: false, follow: false }, // for people holding the card, not for search
};

const DEMO = venueUrl("belvedere");
const WA_TEXT = "Guten Tag Herr Nuridinov, Sie waren bei uns im Lokal. Ich möchte mehr über ORIZ erfahren.";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-onyx";
const action = `flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left text-xl font-semibold transition ${focus}`;
const plain = `${action} bg-white ring-1 ring-onyx/15 hover:bg-onyx/5`;
const sub = "block text-base font-normal text-onyx/70";

const POINTS: [string, string][] = [
  ["Ihre Speisekarte am Handy Ihrer Gäste.", "QR-Code am Tisch scannen, fertig. Ohne App, ohne Anmeldung."],
  ["Preise und Gerichte ändern Sie selbst.", "In Sekunden, vom Handy. Kein Neudruck, keine Agentur."],
  ["Wir übersetzen Ihre Karte für Sie.", "Mit unserem eigenen Küchen-Wörterbuch für 20 Sprachen. Allergene nach österreichischer Vorschrift."],
];

const ICON = {
  chat: "M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  save: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6",
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function HalloPage() {
  return (
    <div className="min-h-screen bg-parchment text-onyx">
      <main className="mx-auto w-full max-w-xl px-5 pb-16 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/oriz-horizontal.svg" alt="ORIZ" className="h-8 w-auto" />

        <header className="mt-10 flex items-center gap-5">
          {PERSON.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={PERSON.photo} alt={personName} className="h-24 w-24 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-onyx p-4" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/oriz-mark-dark.svg" alt="" className="h-full w-full" />
            </span>
          )}
          <div>
            <h1 className="font-display text-4xl font-medium leading-tight">{personName}</h1>
            <p className="mt-1 text-lg text-onyx/80">{PERSON.role}</p>
          </div>
        </header>

        <p className="mt-8 text-2xl leading-snug">
          Grüß Gott! Ich war bei Ihnen im Lokal und habe meine Karte dagelassen. Hier steht kurz, worum es geht.
        </p>

        <ol className="mt-8 space-y-6">
          {POINTS.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="w-7 shrink-0 font-display text-4xl leading-none text-[#7A5C14]" aria-hidden>
                {i + 1}
              </span>
              <p className="text-xl leading-snug">
                <strong className="block font-semibold">{title}</strong>
                <span className="text-onyx/80">{text}</span>
              </p>
            </li>
          ))}
        </ol>

        <a href={DEMO} className={`mt-8 inline-flex min-h-14 w-full items-center justify-center border-2 border-onyx px-6 text-xl font-semibold transition hover:bg-onyx hover:text-parchment ${focus}`}>
          Beispiel-Karte ansehen
        </a>
        <p className="mt-2 text-center text-base text-onyx/70">Eine echte Karte, so wie Ihre Gäste sie sehen.</p>

        <section className="mt-10 bg-onyx px-6 py-7 text-parchment">
          <p className="text-base uppercase tracking-[0.14em] text-gold">Was es kostet</p>
          <p className="mt-2 font-display text-4xl leading-tight">
            {PRICE_MONTH} im Monat
            <span className="block text-2xl text-parchment/80">oder {PRICE_YEAR} im Jahr</span>
          </p>
          <p className="mt-3 text-lg text-parchment/85">{TRIAL_DAYS} Tage kostenlos testen. Monatlich kündbar.</p>
        </section>

        <h2 className="mt-12 font-display text-3xl font-medium">So erreichen Sie mich</h2>
        <p className="mt-2 text-xl text-onyx/80">Ich komme gerne noch einmal vorbei und zeige es Ihnen in zehn Minuten.</p>

        <div className="mt-6 space-y-3">
          <a href={whatsappUrl(WA_TEXT)} className={`${action} bg-gold text-onyx hover:brightness-95`}>
            <Icon d={ICON.chat} /> WhatsApp schreiben
          </a>
          <a href={phoneHref} className={plain}>
            <Icon d={ICON.phone} />
            <span>
              Anrufen <span className={sub}>{PERSON.phone}</span>
            </span>
          </a>
          <a href={`mailto:${PERSON.email}`} className={plain}>
            <Icon d={ICON.mail} />
            <span>
              E-Mail <span className={sub}>{PERSON.email}</span>
            </span>
          </a>
          <a href="/hallo/kontakt.vcf" className={plain}>
            <Icon d={ICON.save} />
            <span>
              Kontakt speichern <span className={sub}>Meine Nummer in Ihr Telefonbuch</span>
            </span>
          </a>
        </div>

        <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-onyx/15 pt-6 text-base text-onyx/70">
          <Link href="/" className="underline underline-offset-4">
            www.oriz.at
          </Link>
          <Link href="/impressum" className="underline underline-offset-4">
            Impressum
          </Link>
          <Link href="/datenschutz" className="underline underline-offset-4">
            Datenschutz
          </Link>
        </footer>
      </main>
    </div>
  );
}
