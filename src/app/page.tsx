export default function Landing() {
  return (
    <main className="bg-parchment text-onyx">

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold mb-8">
          Quiet · Digital · Excellence
        </span>
        <h1 className="font-display text-7xl md:text-9xl font-light tracking-wide text-onyx">
          ORIZ
        </h1>
        <div className="hairline w-24 my-10" />
        <p className="font-display text-2xl md:text-3xl text-onyx/80 italic max-w-2xl leading-relaxed">
          The quiet replacement for the paper menu — and the restaurant website.
        </p>
        <a
          href="#philosophy"
          className="mt-16 font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-gold transition"
        >
          Discover ↓
        </a>
      </section>

      {/* ── Philosophy ── */}
      <section id="philosophy" className="py-32 px-6 max-w-3xl mx-auto text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
          Philosophy
        </span>
        <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light">
          A new kind of presence
        </h2>
        <div className="hairline w-16 mx-auto mb-10" />
        <p className="font-display text-xl md:text-2xl text-onyx/70 italic leading-relaxed">
          Fine dining deserves a surface as refined as the experience itself.
          ORIZ replaces the laminated card and the cluttered website with one
          calm, live interface — always current, always silent.
        </p>
        <p className="font-sans text-sm text-onyx/50 mt-8 leading-relaxed max-w-xl mx-auto">
          Frankfurt-hosted. GDPR-clean. No cookies banner. No tracking scripts.
          A single link your guests open on their phone — nothing to install,
          no account required.
        </p>
      </section>

      {/* ── Benefits ── */}
      <section className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
              Why ORIZ
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              Digital excellence, quietly delivered
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                label: "Live Updates",
                body: "Change a price or mark a dish sold out. Guests see it in under a second — no reload, no app, no friction.",
              },
              {
                label: "Guest Experience",
                body: "A single link, scannable on any device. No downloads, no accounts, no noise — just the menu, exactly as intended.",
              },
              {
                label: "AI-Ready",
                body: "Built for the next layer: an AI visual engine that generates menu photography from a single photograph sent via Telegram.",
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

      {/* ── Connect with us ── */}
      <section id="connect" className="py-32 px-6 max-w-xl mx-auto text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
          Connect with us
        </span>
        <h2 className="font-display text-4xl md:text-5xl mt-6 mb-4 font-light">
          Bring ORIZ to your table
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
              Your email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="chef@maison.eu"
              className="border-b border-onyx/30 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-gold transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
              Your restaurant &amp; message
            </label>
            <textarea
              name="body"
              rows={4}
              placeholder="Tell us about your venue and what you need."
              className="border-b border-onyx/30 bg-transparent py-3 font-sans text-sm text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-gold transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 font-sans text-[11px] tracking-regal uppercase text-parchment bg-onyx px-10 py-4 hover:bg-onyx/80 transition self-center"
          >
            Send enquiry
          </button>
        </form>

        <a
          href="/admin"
          className="mt-16 inline-block font-sans text-[10px] tracking-regal uppercase text-onyx/30 border-b border-onyx/20 pb-1 hover:text-gold hover:border-gold transition"
        >
          Restaurant log-in →
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center border-t border-onyx/10">
        <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/25">
          © {new Date().getFullYear()} ORIZ · Frankfurt · GDPR-clean
        </p>
      </footer>

    </main>
  );
}
