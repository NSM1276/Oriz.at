import Link from "next/link";

const DEMO_VENUES = [
  { slug: "café-central-wien", name: "Café Central" },
  { slug: "palais-coburg", name: "Palais Coburg" },
  { slug: "meixner-gastwirtschaft", name: "Meixner" },
];

const FEATURES = [
  { stat: "< 1 s", label: "Update-Zeit", body: "Preis ändern, ausverkauft markieren — Gäste sehen es sofort. Keine App, kein Reload." },
  { stat: "20+", label: "Sprachen", body: "ORIZ erkennt die Gerätesprache des Gastes automatisch. Das Menü erscheint auf Deutsch, Englisch, Russisch, Arabisch und mehr." },
  { stat: "30 s", label: "QR-Setup", body: "Link generieren, QR-Code drucken, auf den Tisch stellen. Fertig. Kein Techniker, keine Agentur." },
  { stat: "0", label: "Apps nötig", body: "Gäste scannen, lesen, bestellen — ohne Download, ohne Konto, ohne Cookie-Banner." },
];

const STEPS = [
  { n: "01", title: "Konto erhalten", body: "Sie geben uns Ihren Restaurantnamen. Wir richten Ihr Konto ein und schicken die Zugangsdaten." },
  { n: "02", title: "Menü befüllen", body: "In Ihrem Admin-Panel Gerichte, Preise und Kategorien eintragen — in wenigen Minuten." },
  { n: "03", title: "QR drucken & loslegen", body: "QR-Code herunterladen, auf den Tisch oder ins Fenster. Ab sofort live — und jeden Tag aktuell." },
];

const PLANS = [
  {
    name: "Trial",
    price: "Kostenlos",
    sub: "zum Kennenlernen",
    features: ["1 Menü", "Bis zu 30 Gerichte", "Live-Updates", "QR-Code"],
    cta: "Jetzt starten",
    accent: false,
  },
  {
    name: "Starter",
    price: "€ 29",
    sub: "pro Monat",
    features: ["1 Menü", "Unbegrenzte Gerichte", "Live-Updates", "QR-Code", "Instagram & Maps Link", "Eigene Farben & Branding"],
    cta: "Starter wählen",
    accent: true,
  },
  {
    name: "Pro",
    price: "€ 59",
    sub: "pro Monat",
    features: ["Bis zu 3 Menüs", "Unbegrenzte Gerichte", "Live-Updates", "QR-Code", "KI-Fotogenerierung (bald)", "Telegram Social-Bot (bald)", "Priority Support"],
    cta: "Pro wählen",
    accent: false,
  },
];

export default function Landing() {
  return (
    <main className="bg-parchment text-onyx">

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,155,60,0.04)_0%,transparent_70%)] pointer-events-none" />
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold mb-8">
          Digitale Speisekarten · Wien
        </span>
        <h1 className="font-display text-8xl md:text-[10rem] font-light tracking-widest text-onyx leading-none">
          ORIZ
        </h1>
        <div className="w-16 h-px bg-gold/50 my-10" />
        <p className="font-display text-2xl md:text-3xl text-onyx/70 italic max-w-2xl leading-relaxed">
          Der stille Ersatz für die Papierkarte — und die Restaurant-Website.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
          <a
            href="#demo"
            className="font-sans text-[11px] tracking-regal uppercase bg-onyx text-parchment px-8 py-4 hover:bg-onyx/80 transition"
          >
            Live-Demo ansehen
          </a>
          <a
            href="#kontakt"
            className="font-sans text-[11px] tracking-regal uppercase border border-onyx/20 text-onyx/60 px-8 py-4 hover:border-gold hover:text-gold transition"
          >
            Anfrage stellen
          </a>
        </div>
        <a
          href="#warum"
          className="absolute bottom-12 font-sans text-[10px] tracking-regal uppercase text-onyx/30 hover:text-gold transition"
        >
          ↓
        </a>
      </section>

      {/* ── Warum ORIZ ── */}
      <section id="warum" className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Warum ORIZ</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">Vier Zahlen, die alles erklären</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {FEATURES.map(({ stat, label, body }) => (
              <div key={label} className="border-t border-gold/25 pt-6">
                <div className="font-display text-5xl md:text-6xl font-light text-gold mb-2">{stat}</div>
                <div className="font-sans text-[10px] tracking-regal uppercase text-parchment/50 mb-4">{label}</div>
                <p className="font-display text-sm text-parchment/60 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Live-Demo</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">Echte Menüs, echte Erfahrung</h2>
            <p className="font-sans text-sm text-onyx/50 mt-4">Klicken Sie sich durch — so sehen Ihre Gäste das Menü.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DEMO_VENUES.map(({ slug, name }) => (
              <a
                key={slug}
                href={`/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="group border border-onyx/10 hover:border-gold/40 p-8 text-center transition-colors"
              >
                <div className="font-display text-xl mb-2 group-hover:text-gold transition-colors">{name}</div>
                <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/30 group-hover:text-gold/60 transition-colors">
                  Menü öffnen ↗
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophie ── */}
      <section className="py-24 px-6 border-t border-onyx/8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Philosophie</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light">Stille Eleganz, überall</h2>
          <div className="w-16 h-px bg-gold/50 mx-auto mb-10" />
          <p className="font-display text-xl md:text-2xl text-onyx/65 italic leading-relaxed">
            Spitzengastronomie verdient eine Oberfläche, die so verfeinert ist wie
            das Erlebnis selbst. ORIZ passt sich der Sprache des Gastes an —
            automatisch, still, ohne Aufwand.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {[
              { label: "EU-gehostet", body: "Server in Frankfurt. DSGVO-konform. Kein Cookie-Banner nötig." },
              { label: "Eigene Marke", body: "Ihre Farben, Ihr Logo, Ihr Stil. Kein ORIZ-Branding für den Gast." },
              { label: "Immer aktuell", body: "Preiserhöhung? Saisonkarte? Ein Klick — sofort live." },
            ].map(({ label, body }) => (
              <div key={label} className="border-l-2 border-gold/30 pl-5">
                <div className="font-sans text-[10px] tracking-regal uppercase text-gold mb-2">{label}</div>
                <p className="font-display text-base text-onyx/60 italic">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ── */}
      <section className="py-28 px-6 bg-onyx/[0.03]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">In 3 Schritten</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">So einfach startet ORIZ</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="relative">
                <div className="font-display text-7xl font-light text-gold/15 leading-none mb-4">{n}</div>
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-onyx mb-3">{title}</h3>
                <p className="font-display text-base text-onyx/60 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bald: KI & Bot ── */}
      <section className="py-24 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Coming Soon</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-6 font-light">Die nächste Ebene</h2>
          <p className="font-display text-xl text-parchment/60 italic max-w-2xl mx-auto mb-14">
            ORIZ wird zur KI-gestützten Plattform — Fotos aus dem Telegram-Chat,
            automatische Social-Media-Posts, Tagesmenüs per Bot.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            {[
              { icon: "✦", title: "KI-Fotogenerierung", body: "Foto per Telegram schicken → professionelles Produktbild in Sekunden." },
              { icon: "✦", title: "Social-Media-Bot", body: "Tagesmenü automatisch auf Instagram & Co. posten — ohne Aufwand." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="border border-parchment/10 p-6">
                <div className="text-gold mb-3">{icon}</div>
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-parchment mb-2">{title}</h3>
                <p className="font-display text-sm text-parchment/50 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarife / Preise ── */}
      <section id="preise" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Preise</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">Transparent. Ohne Überraschungen.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, sub, features, cta, accent }) => (
              <div
                key={name}
                className={`border p-8 flex flex-col ${accent ? "border-gold bg-onyx text-parchment" : "border-onyx/12"}`}
              >
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-6 ${accent ? "text-gold" : "text-onyx/40"}`}>
                  {name}
                </div>
                <div className={`font-display text-5xl font-light mb-1 ${accent ? "text-parchment" : "text-onyx"}`}>
                  {price}
                </div>
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-8 ${accent ? "text-parchment/40" : "text-onyx/30"}`}>
                  {sub}
                </div>
                <ul className="flex-1 space-y-3 mb-10">
                  {features.map(f => (
                    <li key={f} className={`font-sans text-xs flex items-start gap-2 ${accent ? "text-parchment/70" : "text-onyx/60"}`}>
                      <span className="text-gold mt-0.5">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#kontakt"
                  className={`font-sans text-[11px] tracking-regal uppercase py-3 text-center transition ${accent ? "bg-gold text-onyx hover:bg-gold/80" : "border border-onyx/20 text-onyx/60 hover:border-gold hover:text-gold"}`}
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] text-onyx/30 mt-8 tracking-wide uppercase">
            Alle Preise exkl. MwSt. · Monatlich kündbar · Keine Einrichtungsgebühr
          </p>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="kontakt" className="py-32 px-6 border-t border-onyx/8">
        <div className="max-w-xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">Kontakt</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-4 font-light">
            ORIZ an Ihren Tisch bringen
          </h2>
          <div className="w-16 h-px bg-gold/50 mx-auto mb-12" />
          <form
            action="mailto:contact@oriz.at"
            method="get"
            encType="text/plain"
            className="flex flex-col gap-6 text-left"
          >
            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">Ihre E-Mail</label>
              <input
                type="email"
                name="email"
                required
                placeholder="chef@restaurant.at"
                className="border-b border-onyx/20 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/25 focus:outline-none focus:border-gold transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">Restaurant & Anfrage</label>
              <textarea
                name="body"
                rows={4}
                placeholder="Erzählen Sie uns von Ihrem Lokal."
                className="border-b border-onyx/20 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/25 focus:outline-none focus:border-gold transition resize-none"
              />
            </div>
            <button
              type="submit"
              className="mt-2 font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx px-10 py-4 hover:bg-onyx/80 transition self-center"
            >
              Anfrage senden
            </button>
          </form>
          <Link
            href="/admin"
            className="mt-16 inline-block font-sans text-[10px] tracking-regal uppercase text-onyx/25 border-b border-onyx/15 pb-1 hover:text-gold hover:border-gold transition"
          >
            Restaurant-Login →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-onyx/8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/25">
            © {new Date().getFullYear()} ORIZ · Wien · DSGVO-konform · EU-gehostet
          </p>
          <div className="flex gap-6">
            {["#warum", "#demo", "#preise", "#kontakt"].map(h => (
              <a key={h} href={h} className="font-sans text-[10px] tracking-regal uppercase text-onyx/25 hover:text-gold transition">
                {h.replace("#", "")}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}
