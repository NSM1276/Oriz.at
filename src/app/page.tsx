import type { Metadata } from "next";
import Link from "next/link";
import { LegalLinks } from "@/components/landing/LegalLinks";

// Main page: Carta only, large type, claims that match the product.
// The earlier three-product page is kept in src/legacy/home-umbrella-page.tsx
// (and at the git tag homepage-umbrella-2026-10-22) in case it has to come back.

export const metadata: Metadata = {
  title: "Digitale Speisekarte per QR-Code für Wien | ORIZ Carta",
  description:
    "Digitale Speisekarte für Restaurants & Cafés in Wien: QR-Code am Tisch, Allergene, Fotos, mehrere Sprachen. Preise in Sekunden ändern. 14 Tage kostenlos testen.",
  alternates: { canonical: "https://oriz.at" },
  openGraph: {
    title: "Digitale Speisekarte per QR-Code — ORIZ Carta, Wien",
    description:
      "Ihre Karte auf jedem Handy: Fotos, 14 EU-Allergene, vier Sprachen. Preis geändert? Gericht aus? Ein Tap, kein Neudruck.",
    siteName: "ORIZ",
    locale: "de_AT",
    type: "website",
    url: "https://oriz.at",
  },
};

/* ── Content ─────────────────────────────────────────────────────────────
   Prices are deliberately NOT on this page (owner decision: no public pricing
   here). SETUP_PRICE is null until the service price is confirmed; set it to
   e.g. "ab € 149" and the service band shows it. */
const SETUP_PRICE: string | null = null;

const FACTS = [
  { big: "14", label: "EU-Allergene", body: "pro Gericht, mit den Codes A–R" },
  { big: "4", label: "Sprachen", body: "Deutsch, Englisch, Italienisch, Ukrainisch" },
  { big: "0", label: "Apps für Ihre Gäste", body: "Kamera auf den QR-Code, fertig" },
  { big: "Sek.", label: "statt Neudruck", body: "Preis ändern, Gericht ausverkauft melden" },
];

const PAINS = [
  { title: "Neudruck bei jeder Preisänderung", body: "Jede Korrektur kostet Geld, und bis die neue Karte da ist, stimmt sie nicht." },
  { title: "Allergene: veraltet oder vergessen", body: "Falsche Angaben sind ein Risiko für Ihre Gäste — und für Sie." },
  { title: "Touristen verstehen die Karte nicht", body: "Wer die Gerichte nicht kennt, bestellt vorsichtig — oder das Günstigste." },
  { title: "Das PDF auf der Website", body: "Winzig am Handy, langsam beim Laden, vom Vorjahr." },
];

const FEATURES = [
  { title: "Fotos und drei Erscheinungsbilder", body: "Klassisch wie Papier, mit großen Fotos oder modern in Karten. In Ihren Farben, mit Ihrem Logo." },
  { title: "Allergene nach EU-Recht", body: "Alle 14 Allergengruppen pro Gericht. Gäste filtern nach dem, was sie nicht vertragen." },
  { title: "Größen und mehrere Preise", body: "0,3 l und 0,5 l, Glas und Flasche, klein und groß — sauber dargestellt, ohne Tricks." },
  { title: "Ausverkauft in einem Tap", body: "Das Schnitzel ist aus? Ein Tap am Handy — und kein Gast bestellt es mehr." },
  { title: "Vier Sprachen", body: "Gäste wählen Deutsch, Englisch, Italienisch oder Ukrainisch. Auch die Allergene übersetzen sich mit." },
  { title: "Service per Tap", body: "Gäste rufen die Bedienung mit Tischnummer. Ihr Team sieht jeden Ruf sofort auf Handy oder Tablet." },
];

const STEPS = [
  { n: "1", title: "Konto anlegen", body: "In zwei Minuten. Name Ihres Lokals, E-Mail, Passwort." },
  { n: "2", title: "Karte eintragen", body: "Text Ihrer Karte einfügen — Bereiche, Preise, Größen und Allergene werden erkannt. Oder wir tippen sie für Sie ein." },
  { n: "3", title: "QR-Code aufstellen", body: "Tischaufsteller drucken und hinstellen. Ab jetzt ändern Sie alles am Handy." },
];

const VENUES = ["Restaurants", "Cafés", "Bars", "Heurige", "Hotel-Restaurants", "Imbisse & Bistros"];

const FAQ = [
  {
    q: "Brauchen meine Gäste eine App?",
    a: "Nein. Gäste scannen den QR-Code mit der normalen Handykamera, die Karte öffnet sich im Browser. Kein Download, keine Anmeldung.",
  },
  {
    q: "Was kostet ORIZ Carta?",
    a: "Die ersten 14 Tage testen Sie alle Funktionen kostenlos. Danach ist ORIZ monatlich kündbar, ohne Einrichtungsgebühr. Die aktuellen Pakete sehen Sie auf der Seite Carta.",
  },
  {
    q: "Wie lange dauert die Einrichtung?",
    a: "Wenn Sie den Text Ihrer Karte zur Hand haben, unter einer Stunde. Sie haben keine Zeit? Dann tragen wir Ihre Karte für Sie ein — schicken Sie uns Fotos, PDF oder einen Link.",
  },
  {
    q: "Kann ich die Karte selbst ändern?",
    a: "Ja, jederzeit und am Handy: Preise, Beschreibungen, Fotos, Allergene, neue Gerichte. Ein Gericht als „ausverkauft“ markieren dauert einen Tap.",
  },
  {
    q: "Wie funktionieren die Allergene?",
    a: "Pro Gericht hinterlegen Sie die Allergengruppen nach der EU-Verordnung 1169/2011 mit den in Österreich üblichen Codes A bis R. Gäste sehen sie bei jedem Gericht und können danach filtern. Für die Richtigkeit der Angaben bleibt Ihr Lokal verantwortlich — wir helfen beim Eintragen.",
  },
  {
    q: "Brauche ich die Papierkarte danach nicht mehr?",
    a: "Das entscheiden Sie. Viele Lokale lassen eine Papierkarte liegen und stellen zusätzlich den QR-Code auf — so sind beide Gäste glücklich.",
  },
  {
    q: "Wo liegen unsere Daten?",
    a: "Datenbank und Fotos liegen bei einem EU-Anbieter in Frankfurt. ORIZ ist ein Wiener Unternehmen; Impressum und Datenschutzerklärung finden Sie ganz unten.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja, monatlich. Ohne Mindestlaufzeit.",
  },
];

/* ── Structured data ── */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://oriz.at/#org",
      name: "ORIZ",
      url: "https://oriz.at",
      email: "office@oriz.at",
      telephone: "+43 677 64292055",
      address: { "@type": "PostalAddress", streetAddress: "Tscherttegasse 39", postalCode: "1120", addressLocality: "Wien", addressCountry: "AT" },
    },
    {
      "@type": "SoftwareApplication",
      name: "ORIZ Carta",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: ["de", "en", "it", "uk"],
      description: "Digitale Speisekarte per QR-Code für Restaurants, Cafés und Bars: Fotos, EU-Allergene, mehrere Sprachen, Preise in Sekunden ändern.",
      publisher: { "@id": "https://oriz.at/#org" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

/* ── Shared bits ── */
const container = "mx-auto w-full max-w-6xl px-5 md:px-8";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-onyx";
const btnPrimary = `inline-flex min-h-14 items-center justify-center bg-gold px-8 text-lg font-semibold text-onyx transition hover:brightness-95 ${focus}`;
const btnGhost = `inline-flex min-h-14 items-center justify-center border-2 border-onyx/80 px-8 text-lg font-semibold text-onyx transition hover:bg-onyx hover:text-parchment ${focus}`;
const eyebrow = "text-sm font-semibold uppercase tracking-[0.16em] text-[#7A5C14]";
const h2 = "font-display text-4xl font-medium leading-[1.1] md:text-5xl";

function Phone() {
  return (
    <div className="mx-auto w-[310px] shrink-0 bg-onyx p-[10px] shadow-[0_30px_80px_-20px_rgba(10,10,10,0.45)]">
      <div className="relative h-[600px] w-[290px] overflow-hidden bg-white">
        <iframe
          title="Live-Demo: Speisekarte der Trattoria Belvedere"
          src="/belvedere"
          loading="lazy"
          className="absolute left-0 top-0 h-[807px] w-[390px] origin-top-left border-0"
          style={{ transform: "scale(0.7436)" }}
        />
      </div>
    </div>
  );
}

export default function NewLanding() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      <a href="#inhalt" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-onyx focus:px-5 focus:py-3 focus:text-parchment ${focus}`}>
        Zum Inhalt springen
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-onyx/10 bg-parchment/95 backdrop-blur">
        <div className={`${container} flex h-[72px] items-center justify-between gap-4`}>
          <Link href="/" className={`inline-flex min-h-11 items-center ${focus}`} aria-label="ORIZ — Startseite">
            {/* 500×150 SVG: mark left, name right */}
            <img src="/brand/oriz-horizontal.svg" alt="ORIZ" width={167} height={50} className="h-10 w-auto sm:h-[50px]" />
          </Link>
          <nav aria-label="Hauptnavigation" className="hidden items-center gap-8 text-base font-medium md:flex">
            <a href="#funktionen" className={`hover:underline ${focus}`}>Funktionen</a>
            <a href="#ablauf" className={`hover:underline ${focus}`}>So geht’s</a>
            <a href="#faq" className={`hover:underline ${focus}`}>Fragen</a>
            <Link href="/admin/login" className={`hover:underline ${focus}`}>Login</Link>
          </nav>
          <Link href="/registrieren" className={`inline-flex min-h-11 items-center bg-onyx px-5 text-base font-semibold text-parchment ${focus}`}>
            Kostenlos testen
          </Link>
        </div>
      </header>

      <main id="inhalt" className="text-onyx">
        {/* ══ Hero ══ */}
        <section className="overflow-hidden pb-16 pt-12 md:pb-24 md:pt-20">
          <div className={`${container} grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]`}>
            <div>
              <p className={eyebrow}>Digitale Speisekarte · aus Wien</p>
              <h1 className="mt-5 font-display text-[2.9rem] font-medium leading-[1.04] sm:text-6xl lg:text-7xl">
                Ihre Speisekarte.
                <br />
                Auf jedem Handy.
                <br />
                <span className="text-[#7A5C14]">In Sekunden aktuell.</span>
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-relaxed text-onyx/80">
                Gäste scannen den QR-Code am Tisch und sehen Ihre Karte — mit Fotos, Allergenen und in vier Sprachen. Preis geändert? Gericht aus? Ein Tap, kein Neudruck.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link href="/registrieren" className={btnPrimary}>14 Tage kostenlos testen</Link>
                <a href="#demo" className={btnGhost}>Live-Demo ansehen</a>
              </div>
              <p className="mt-6 text-base text-onyx/70">
                Keine App für Ihre Gäste · Monatlich kündbar · Daten in der EU
              </p>
            </div>

            <div id="demo" className="scroll-mt-28">
              <Phone />
              <p className="mt-5 text-center text-base text-onyx/70">
                Das ist die echte Karte der Trattoria Belvedere — scrollen Sie durch.{" "}
                <Link href="/belvedere" target="_blank" className={`font-semibold underline underline-offset-4 ${focus}`}>Im Vollbild öffnen</Link>
              </p>
            </div>
          </div>
        </section>

        {/* ══ Facts ══ */}
        <section aria-label="Auf einen Blick" className="border-y border-onyx/10 bg-white/60">
          <dl className={`${container} grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-4`}>
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-display text-6xl font-medium leading-none text-[#7A5C14]">{f.big}</span>
                  <span className="mt-2 block text-lg font-semibold">{f.label}</span>
                  <span className="mt-1 block text-base leading-snug text-onyx/70">{f.body}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ══ Problem ══ */}
        <section className="bg-onyx py-20 text-parchment md:py-28">
          <div className={container}>
            <h2 className={`${h2} max-w-3xl`}>Die Papierkarte kostet Sie Geld und Nerven.</h2>
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {PAINS.map((p) => (
                <li key={p.title} className="border border-parchment/15 p-7">
                  <h3 className="text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-parchment/75">{p.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 font-display text-3xl italic text-gold md:text-4xl">ORIZ Carta ersetzt das alles — mit einer Karte, die immer stimmt.</p>
          </div>
        </section>

        {/* ══ Features ══ */}
        <section id="funktionen" className="scroll-mt-20 py-20 md:py-28">
          <div className={container}>
            <p className={eyebrow}>Funktionen</p>
            <h2 className={`${h2} mt-4 max-w-3xl`}>Alles, was eine gute Speisekarte braucht.</h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.title} className="border-t-2 border-onyx bg-white p-7 shadow-sm ring-1 ring-onyx/10">
                  <h3 className="font-display text-2xl font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-onyx/75">{f.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg text-onyx/70">Auch als Bildschirm für den Fernseher an der Wand: Ihre Karte läuft dort automatisch mit.</p>
          </div>
        </section>

        {/* ══ Steps ══ */}
        <section id="ablauf" className="scroll-mt-20 bg-white/60 py-20 md:py-28">
          <div className={container}>
            <p className={eyebrow}>So geht’s</p>
            <h2 className={`${h2} mt-4 max-w-3xl`}>In drei Schritten online.</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t-2 border-onyx pt-6">
                  <span className="font-display text-5xl font-medium text-[#7A5C14]" aria-hidden>{s.n}</span>
                  <h3 className="mt-3 text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-onyx/75">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12"><Link href="/registrieren" className={btnPrimary}>Jetzt kostenlos starten</Link></div>
          </div>
        </section>

        {/* ══ Done-for-you ══ */}
        <section className="py-20 md:py-28">
          <div className={container}>
            <div className="bg-onyx p-8 text-parchment md:p-14">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Keine Zeit?</p>
              <h2 className={`${h2} mt-4 max-w-3xl`}>Wir machen Ihre Karte für Sie.</h2>
              <p className="mt-6 max-w-2xl text-xl leading-relaxed text-parchment/80">
                Schicken Sie uns Fotos Ihrer Karte, ein PDF oder einen Link. Wir tragen jedes Gericht von Hand ein — mit Preisen, Größen und Allergenen, auf Wunsch mit Übersetzungen. Dazu bearbeiten wir Ihre Gerichtsfotos, damit sie ruhig und einheitlich aussehen.
              </p>
              <p className="mt-4 text-lg text-parchment/70">
                {SETUP_PRICE ? `${SETUP_PRICE} · ` : ""}Einmalig, ohne Abo. Menschen statt Automatik: Sie bekommen, was auf Ihrer Karte steht.
              </p>
              <div className="mt-8"><Link href="/registrieren" className={btnPrimary}>Konto anlegen und bestellen</Link></div>
            </div>
          </div>
        </section>

        {/* ══ Who ══ */}
        <section className="pb-20 md:pb-28">
          <div className={container}>
            <h2 className={`${h2} max-w-3xl`}>Für Gastronomie in Wien und ganz Österreich.</h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {VENUES.map((v) => (
                <li key={v} className="border-2 border-onyx/15 bg-white px-6 py-3 text-lg font-medium">{v}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="scroll-mt-20 bg-white/60 py-20 md:py-28">
          <div className={`${container} max-w-3xl`}>
            <p className={eyebrow}>Häufige Fragen</p>
            <h2 className={`${h2} mt-4`}>Gut zu wissen.</h2>
            <div className="mt-10 divide-y divide-onyx/15 border-y border-onyx/15">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-2">
                  <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold ${focus}`}>
                    {f.q}
                    <span aria-hidden className="shrink-0 text-3xl font-light leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-5 pr-8 text-lg leading-relaxed text-onyx/80">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Final CTA ══ */}
        <section className="py-20 text-center md:py-28">
          <div className={`${container} max-w-3xl`}>
            <h2 className={h2}>Bereit für eine Karte, die immer stimmt?</h2>
            <p className="mt-6 text-xl text-onyx/75">14 Tage alle Funktionen kostenlos testen. Das Konto ist in zwei Minuten angelegt.</p>
            <div className="mt-9"><Link href="/registrieren" className={btnPrimary}>14 Tage kostenlos testen</Link></div>
            <p className="mt-8 text-lg text-onyx/75">
              Fragen? <a className={`font-semibold underline underline-offset-4 ${focus}`} href="mailto:office@oriz.at">office@oriz.at</a> oder{" "}
              <a className={`font-semibold underline underline-offset-4 ${focus}`} href="tel:+4367764292055">+43 677 64292055</a>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-onyx py-12 text-parchment">
        <div className={`${container} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
          <div>
            <img src="/brand/oriz-horizontal-dark.svg" alt="ORIZ" width={200} height={60} className="h-[60px] w-auto" />
            <p className="mt-3 text-base text-parchment/70">Wien · Daten in der EU</p>
          </div>
          <nav aria-label="Fußzeile" className="flex flex-wrap items-center gap-x-8 gap-y-1 text-base">
            <Link href="/carta" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>Preise & Pakete</Link>
            <Link href="/admin/login" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>Restaurant-Login</Link>
            <div className="[&_button]:min-h-11 [&_button]:!text-base [&_button]:!normal-case [&_button]:!tracking-normal [&_button]:!text-parchment [&_button:hover]:underline">
              <LegalLinks />
            </div>
          </nav>
        </div>
      </footer>
    </>
  );
}
