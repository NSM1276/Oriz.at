import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/landing/ContactForm";
import { HeroAtmosphere } from "@/components/landing/HeroAtmosphere";

const STATS = [
  {
    stat: "< 1 s",
    label: "Sofort live",
    body: "Preis ändern, Gericht ausverkauft markieren — Ihre Gäste sehen es in Echtzeit. Kein Drucker, kein Laminator.",
  },
  {
    stat: "20+",
    label: "Sprachen",
    body: "Deutsch, Englisch, Russisch, Arabisch, Türkisch und mehr. Das Menü erkennt die Sprache des Gastes automatisch.",
  },
  {
    stat: "0",
    label: "Apps nötig",
    body: "Gäste öffnen das Menü direkt im Browser — ohne Download, ohne Anmeldung, ohne Wartezeit.",
  },
  {
    stat: "100%",
    label: "Ihre Marke",
    body: "Ihre Farben, Ihr Logo, Ihre Schrift. Kein fremdes Branding auf Ihrer Karte — nur Ihr Restaurant.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Zugang erhalten",
    body: "Schreiben Sie uns — wir richten Ihr persönliches Restaurant-Konto ein und senden Ihnen die Zugangsdaten.",
  },
  {
    n: "02",
    title: "Menü befüllen",
    body: "Gerichte, Preise, Kategorien — alles in wenigen Minuten direkt im Browser. Kein Techniker, keine Agentur.",
  },
  {
    n: "03",
    title: "Link teilen & fertig",
    body: "Ihren persönlichen Menü-Link auf den Tisch, ins Fenster oder in die Instagram-Bio — ab sofort immer aktuell.",
  },
];

const PLANS = [
  {
    name: "Trial",
    price: "14 Tage",
    sub: "kostenlos — alle Funktionen",
    badge: null,
    features: [
      "Alle Starter-Funktionen inklusive",
      "Keine Kreditkarte nötig",
      "Kein Vertrag, jederzeit kündbar",
      "Persönlicher Onboarding-Support",
    ],
    cta: "Kostenlos testen",
    plan: "trial",
    accent: false,
  },
  {
    name: "Starter",
    price: "€ 29",
    sub: "pro Monat",
    badge: "Empfohlen",
    features: [
      "1 Menü · unbegrenzte Gerichte",
      "Echtzeit-Updates",
      "Persönlicher Menü-Link",
      "Instagram & Maps Verlinkung",
      "Eigene Farben & Logo",
      "20+ Sprachen automatisch",
    ],
    cta: "Starter wählen",
    plan: "starter",
    accent: true,
  },
  {
    name: "Pro",
    price: "€ 59",
    sub: "pro Monat",
    badge: null,
    features: [
      "Mehrere Standorte oder Karten",
      "Unbegrenzte Gerichte",
      "Echtzeit-Updates",
      "20+ Sprachen automatisch",
      "Erweiterte Seiten (bald)",
      "Post-Assistent (bald)",
      "Priority Support",
    ],
    cta: "Pro wählen",
    plan: "pro",
    accent: false,
  },
];

const DEMO_VENUES = [
  {
    slug:   "prime-steakhouse",
    name:   "PRIME Argentinian Steakhouse",
    type:   "Gästeansicht · So sehen Ihre Gäste das Menü",
    items:  "46 Gerichte",
    bg:     "#0F0000",
    accent: "#CC0000",
    cta:    "Menü öffnen",
    isAdmin: false,
  },
  {
    slug:   "demo",
    name:   "Admin-Panel",
    type:   "Ihre Ansicht · Preise, Verfügbarkeit, Texte",
    items:  "Live · Änderungen sofort sichtbar",
    bg:     "#0A0A0A",
    accent: "#C69B3C",
    cta:    "Ausprobieren",
    isAdmin: true,
  },
];

const TESTIMONIALS = [
  {
    quote: "Endlich kein Drucker mehr. Preis geändert, und zwei Sekunden später war es auf dem Tisch.",
    name: "M. H.",
    role: "Gastronom, Wien",
  },
  {
    quote: "Unsere russischen Gäste haben das Menü sofort auf Russisch gelesen — ohne dass wir etwas tun mussten.",
    name: "A. K.",
    role: "Restaurant-Inhaberin, Wien",
  },
  {
    quote: "Das sieht hochwertiger aus als jede gedruckte Karte, die wir je hatten.",
    name: "T. B.",
    role: "Café-Betreiber, Wien",
  },
];

export default function Landing() {
  return (
    <main className="bg-parchment text-onyx overflow-x-hidden">

      {/* ── Hero ── */}
      <HeroAtmosphere />

      {/* ── Problem ── */}
      <section id="problem" className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Die Realität</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light leading-tight">
              Papier altert.<br />Websites schimmeln.<br />Gäste warten.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: "✕",
                title: "Gedruckte Karte",
                body: "Preise ändern sich, die Karte bleibt alt. Jede Aktualisierung kostet Zeit, Geld und einen Weg zur Druckerei.",
              },
              {
                icon: "✕",
                title: "PDF auf der Website",
                body: "Schwer lesbar auf dem Handy. Nicht aktuell. Gäste finden es kaum — und sehen dann die falschen Preise.",
              },
              {
                icon: "✕",
                title: "Fremde Plattformen",
                body: "Ihr Restaurant in einem System mit hundert anderen — fremdes Design, fremdes Branding, Ihr Name irgendwo dazwischen.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="border border-parchment/8 p-8">
                <div className="font-display text-3xl text-parchment/15 mb-4">{icon}</div>
                <h3 className="font-sans text-[10px] tracking-regal uppercase text-parchment/40 mb-3">{title}</h3>
                <p className="font-display text-sm text-parchment/50 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <div className="w-12 h-px bg-gold/40 mx-auto mb-6" />
            <p className="font-display text-2xl md:text-3xl text-parchment/70 italic">
              Es gibt einen anderen Weg.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats / Vier Zahlen ── */}
      <section id="warum" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Warum ORIZ</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Was Ihre Gäste verdienen
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ stat, label, body }) => (
              <div key={label} className="border-t border-gold/25 pt-6">
                <div className="font-display text-5xl md:text-6xl font-light text-gold mb-2">{stat}</div>
                <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 mb-4">{label}</div>
                <p className="font-display text-sm text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-32 px-6 bg-onyx/[0.025] border-t border-onyx/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Live-Demo</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Zwei Perspektiven. Ein System.
            </h2>
            <p className="font-sans text-sm text-onyx/40 mt-4 max-w-md mx-auto leading-relaxed">
              Links: was Ihr Gast sieht. Rechts: was Sie als Inhaber steuern.
              Beides live — klicken Sie rein.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {DEMO_VENUES.map(({ slug, name, type, items, bg, accent, cta, isAdmin }) => (
              <a
                key={slug}
                href={isAdmin ? "/demo" : `/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden flex flex-col justify-between p-8 transition-transform duration-500 hover:-translate-y-1"
                style={{ backgroundColor: bg, aspectRatio: "4/5" }}
              >
                {/* radial glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}22 0%, transparent 70%)` }}
                />
                {/* bottom edge accent line — brightens on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 opacity-20 group-hover:opacity-70"
                  style={{ backgroundColor: accent }}
                />

                {/* top: type label */}
                <div className="relative z-10">
                  <span
                    className="font-sans text-[9px] tracking-regal uppercase"
                    style={{ color: `${accent}99` }}
                  >
                    {type}
                  </span>
                </div>

                {/* center: name + subtitle */}
                <div className="relative z-10">
                  <h3
                    className="font-display font-light leading-snug text-parchment mb-3 transition-colors duration-300 group-hover:text-white"
                    style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)" }}
                  >
                    {name}
                  </h3>
                  <span className="font-sans text-[9px] tracking-regal uppercase text-parchment/20">
                    {items}
                  </span>
                </div>

                {/* bottom: hairline + CTA */}
                <div className="relative z-10">
                  <div
                    className="w-10 h-px mb-5 transition-all duration-500 opacity-30 group-hover:opacity-80 group-hover:w-full"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[9px] tracking-regal uppercase text-parchment/35 group-hover:text-parchment/65 transition-colors duration-300">
                      {cta}
                    </span>
                    <span
                      className="font-sans text-[11px] transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: accent }}
                    >
                      ↗
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] text-onyx/25 mt-8 tracking-wide uppercase">
            Demo-Daten · frei erfunden · Änderungen täglich zurückgesetzt
          </p>
        </div>
      </section>

      {/* ── 20+ Sprachen ── */}
      <section className="py-28 px-6 bg-onyx text-parchment overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Mehrsprachigkeit</span>
              <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light leading-tight">
                Jeder Gast liest in seiner Sprache
              </h2>
              <div className="w-10 h-px bg-gold/40 mb-8" />
              <p className="font-display text-lg text-parchment/60 italic leading-relaxed mb-6">
                Wien ist international. Ihre Gäste kommen aus aller Welt —
                aus Russland, aus der Türkei, aus dem arabischen Raum, aus Japan.
              </p>
              <p className="font-display text-lg text-parchment/60 italic leading-relaxed">
                ORIZ erkennt automatisch die Sprache des Geräts und zeigt das Menü
                entsprechend an. Kein Aufwand für Sie. Kein Rätselraten für den Gast.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { lang: "DE", name: "Deutsch" },
                { lang: "EN", name: "English" },
                { lang: "RU", name: "Русский" },
                { lang: "AR", name: "العربية" },
                { lang: "TR", name: "Türkçe" },
                { lang: "FR", name: "Français" },
                { lang: "IT", name: "Italiano" },
                { lang: "ES", name: "Español" },
                { lang: "JA", name: "日本語" },
                { lang: "ZH", name: "中文" },
                { lang: "PL", name: "Polski" },
                { lang: "UK", name: "Українська" },
              ].map(({ lang, name }) => (
                <div key={lang} className="border border-parchment/8 p-3 text-center">
                  <div className="font-sans text-[10px] tracking-regal uppercase text-gold mb-1">{lang}</div>
                  <div className="font-display text-xs text-parchment/40">{name}</div>
                </div>
              ))}
              <div className="col-span-3 border border-parchment/8 p-3 text-center">
                <div className="font-sans text-[10px] tracking-regal uppercase text-parchment/25">
                  + weitere Sprachen auf Anfrage
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 border-t border-onyx/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Stimmen</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">Was Gastronomen sagen</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="border-t border-gold/20 pt-6">
                <p className="font-display text-base text-onyx/65 italic leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/50">{name}</div>
                  <div className="font-sans text-[10px] text-onyx/30 mt-0.5">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophie ── */}
      <section className="py-24 px-6 bg-onyx/[0.025] border-t border-onyx/6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Philosophie</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light">
            So elegant wie Ihr Restaurant
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mb-10" />
          <p className="font-display text-xl md:text-2xl text-onyx/60 italic leading-relaxed mb-14">
            Spitzengastronomie verdient eine Oberfläche, die so verfeinert ist
            wie das Erlebnis selbst. ORIZ ist unauffällig — damit Ihr Restaurant
            im Mittelpunkt steht.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {[
              {
                label: "EU-gehostet",
                body: "Server in Frankfurt. DSGVO-konform von Anfang an. Kein Cookie-Banner nötig.",
              },
              {
                label: "Eigene Marke",
                body: "Ihre Farben, Ihr Logo, Ihr Stil. Kein fremdes Branding für den Gast — nur Ihr Restaurant.",
              },
              {
                label: "Immer aktuell",
                body: "Saisonkarte? Preiserhöhung? Ein Klick im Admin-Panel — sofort live für alle Gäste.",
              },
            ].map(({ label, body }) => (
              <div key={label} className="border-l-2 border-gold/30 pl-5">
                <div className="font-sans text-[10px] tracking-regal uppercase text-gold mb-2">{label}</div>
                <p className="font-display text-sm text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">In 3 Schritten</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Heute bestellt — morgen live
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map(({ n, title, body }) => (
              <div key={n}>
                <div className="font-display text-7xl font-light text-gold/12 leading-none mb-4">{n}</div>
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-onyx mb-3">{title}</h3>
                <p className="font-display text-base text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bald: Fotos & Social ── */}
      <section className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Bald verfügbar</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 mb-6 font-light">
              Mehr als eine Speisekarte
            </h2>
            <p className="font-display text-xl text-parchment/55 italic max-w-2xl mx-auto">
              ORIZ wächst mit Ihrem Restaurant — kleine, nützliche Erweiterungen,
              die echten Aufwand sparen.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                title: "Post-Assistent",
                body: "Foto ins System laden — ORIZ formuliert einen fertigen Instagram-Text auf Basis Ihres Tagesgerichts. Sie posten, wann Sie möchten.",
              },
              {
                title: "Erweiterte Seiten",
                body: "Neben dem Menü: eine Seite über Ihr Restaurant, Öffnungszeiten, Team, saisonale Angebote. Ein kleiner Auftritt, der für Sie arbeitet.",
              },
              {
                title: "Foto-Aufwertung",
                body: "Handyfoto eines Gerichts hochladen — ORIZ liefert eine aufgewertete Version für Ihre digitale Karte. Kein Fotograf nötig.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="border border-parchment/10 p-7">
                <div className="w-4 h-px bg-gold/50 mb-5" />
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-parchment mb-3">{title}</h3>
                <p className="font-display text-sm text-parchment/45 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preise ── */}
      <section id="preise" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Preise</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Transparent. Ohne Überraschungen.
            </h2>
            <p className="font-sans text-sm text-onyx/40 mt-4">Monatlich kündbar. Keine Einrichtungsgebühr.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, sub, badge, features, cta, plan, accent }) => (
              <div
                key={name}
                className={`border p-8 flex flex-col ${
                  accent ? "border-gold bg-onyx text-parchment" : "border-onyx/10"
                }`}
              >
                {badge && (
                  <div className={`font-sans text-[9px] tracking-regal uppercase border px-2 py-1 self-start mb-4 ${accent ? "text-gold border-gold/40" : "text-onyx/40 border-onyx/20"}`}>
                    {badge}
                  </div>
                )}
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-5 ${accent ? "text-gold" : "text-onyx/35"}`}>
                  {name}
                </div>
                <div className={`font-display text-5xl font-light mb-1 ${accent ? "text-parchment" : "text-onyx"}`}>
                  {price}
                </div>
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-8 ${accent ? "text-parchment/35" : "text-onyx/28"}`}>
                  {sub}
                </div>
                <ul className="flex-1 space-y-3 mb-10">
                  {features.map((f) => (
                    <li key={f} className={`font-sans text-xs flex items-start gap-2 ${accent ? "text-parchment/65" : "text-onyx/55"}`}>
                      <span className="text-gold mt-0.5 shrink-0">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/?plan=${plan}#kontakt`}
                  className={`font-sans text-[11px] tracking-regal uppercase py-3 text-center transition-colors duration-300 ${
                    accent
                      ? "bg-gold text-onyx hover:bg-gold/80"
                      : "border border-onyx/15 text-onyx/50 hover:border-gold hover:text-gold"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] text-onyx/25 mt-8 tracking-wide uppercase">
            Alle Preise exkl. MwSt. · Monatlich kündbar · Keine Einrichtungsgebühr
          </p>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="kontakt" className="py-32 px-6 bg-onyx text-parchment">
        <div className="max-w-xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Kontakt</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-4 font-light">
            ORIZ an Ihren Tisch bringen
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mb-4" />
          <p className="font-display text-lg text-parchment/50 italic mb-12">
            Schreiben Sie uns — wir melden uns innerhalb von 24 Stunden.
          </p>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
          <Link
            href="/admin"
            className="mt-16 inline-block font-sans text-[10px] tracking-regal uppercase text-parchment/20 border-b border-parchment/10 pb-1 hover:text-gold hover:border-gold transition-colors"
          >
            Restaurant-Login →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-parchment/8 bg-onyx">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] tracking-regal uppercase text-parchment/20">
            © {new Date().getFullYear()} ORIZ · Wien · DSGVO-konform · EU-gehostet
          </p>
          <div className="flex gap-6">
            {[
              { href: "#warum", label: "Warum" },
              { href: "#demo", label: "Demo" },
              { href: "#preise", label: "Preise" },
              { href: "#kontakt", label: "Kontakt" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="font-sans text-[10px] tracking-regal uppercase text-parchment/20 hover:text-gold transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}
