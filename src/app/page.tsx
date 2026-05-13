export default function Landing() {
  return (
    <main className="bg-parchment text-onyx">

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold mb-8">
          Still · Digital · Exzellenz
        </span>
        <h1 className="font-display text-7xl md:text-9xl font-light tracking-wide text-onyx">
          ORIZ
        </h1>
        <div className="hairline w-24 my-10" />
        <p className="font-display text-2xl md:text-3xl text-onyx/80 italic max-w-2xl leading-relaxed">
          Der stille Ersatz für die Papierkarte — und die Restaurant-Website.
        </p>
        <a
          href="#philosophie"
          className="mt-16 font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-gold transition"
        >
          Entdecken ↓
        </a>
      </section>

      {/* ── Philosophie ── */}
      <section id="philosophie" className="py-32 px-6 max-w-3xl mx-auto text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
          Philosophie
        </span>
        <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light">
          Eine neue Art der Präsenz
        </h2>
        <div className="hairline w-16 mx-auto mb-10" />
        <p className="font-display text-xl md:text-2xl text-onyx/70 italic leading-relaxed">
          Spitzengastronomie verdient eine Oberfläche, die so verfeinert ist wie
          das Erlebnis selbst. ORIZ ersetzt die laminierte Karte und die
          unübersichtliche Website durch eine ruhige, lebendige Ansicht —
          immer aktuell, immer still.
        </p>
        <p className="font-sans text-sm text-onyx/50 mt-8 leading-relaxed max-w-xl mx-auto">
          Aus Wien. EU-gehostet. DSGVO-konform. Kein Cookie-Banner.
          Kein Tracking. Ein einziger Link — nichts zu installieren,
          kein Konto erforderlich.
        </p>
      </section>

      {/* ── Vorteile ── */}
      <section className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
              Warum ORIZ
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Digitale Exzellenz, still geliefert
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                label: "Live-Updates",
                body: "Preis ändern oder ein Gericht als ausverkauft markieren. Gäste sehen es in unter einer Sekunde — kein Neuladen, keine App, keine Reibung.",
              },
              {
                label: "Gasterlebnis",
                body: "Ein einziger Link, auf jedem Gerät lesbar. Keine Downloads, keine Konten, kein Lärm — nur die Speisekarte, genau wie gedacht.",
              },
              {
                label: "KI-bereit",
                body: "Gebaut für die nächste Ebene: eine KI-Bildmaschine, die Menüfotografie aus einem einzigen Foto per Telegram generiert.",
              },
            ].map(({ label, body }) => (
              <div key={label} className="border-t border-gold/30 pt-8">
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-gold mb-4">
                  {label}
                </h3>
                <p className="font-display text-lg text-parchment/70 italic leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="kontakt" className="py-32 px-6 max-w-xl mx-auto text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
          Kontakt
        </span>
        <h2 className="font-display text-4xl md:text-5xl mt-6 mb-4 font-light">
          ORIZ an Ihren Tisch bringen
        </h2>
        <div className="hairline w-16 mx-auto mb-12" />

        <form
          action="mailto:contact@oriz.eu"
          method="get"
          encType="text/plain"
          className="flex flex-col gap-6 text-left"
        >
          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
              Ihre E-Mail
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="chef@restaurant.at"
              className="border-b border-onyx/30 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-gold transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
              Ihr Restaurant &amp; Ihre Anfrage
            </label>
            <textarea
              name="body"
              rows={4}
              placeholder="Erzählen Sie uns von Ihrem Lokal und was Sie benötigen."
              className="border-b border-onyx/30 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-gold transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx px-10 py-4 hover:bg-onyx/80 transition self-center"
          >
            Anfrage senden
          </button>
        </form>

        <a
          href="/admin"
          className="mt-16 inline-block font-sans text-[10px] tracking-regal uppercase text-onyx/30 border-b border-onyx/20 pb-1 hover:text-gold hover:border-gold transition"
        >
          Restaurant-Login →
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center border-t border-onyx/10">
        <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/25">
          © {new Date().getFullYear()} ORIZ · Wien · DSGVO-konform
        </p>
      </footer>

    </main>
  );
}
