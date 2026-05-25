import Link from "next/link";
import { LegalLinks } from "@/components/landing/LegalLinks";

export const metadata = {
  title: "ORIZ — Quiet Luxury für Gastronomie & Hospitality",
  description:
    "ORIZ ist das digitale Zuhause für Restaurants, Hotels und Pensionen. Carta · Casa · Screen — drei Produkte, eine Sprache.",
};

const PRODUCTS = [
  {
    slug: "carta",
    eyebrow: "Carta",
    title: "Digitale Speisekarte",
    body:
      "QR-Code am Tisch, mehrsprachig, in Echtzeit aktualisierbar. Ersetzt Papier und veraltete Website-Menüs.",
    cta: "Mehr erfahren",
    accent: "#C69B3C",
    available: true,
  },
  {
    slug: "casa",
    eyebrow: "Casa",
    title: "Digitale Begrüßungskarte",
    body:
      "Eine ruhige, mehrsprachige Karte für Apartments, Pensionen und kleine Hotels. WLAN, Check-in, Tipps — ohne PDF, ohne App.",
    cta: "Mehr erfahren",
    accent: "#C8963E",
    available: true,
  },
  {
    slug: null,
    eyebrow: "Screen",
    title: "TV- und Lobby-Displays",
    body:
      "Stille, redaktionell gepflegte Bildschirme für Lobby, Bar und Lounge. In Vorbereitung.",
    cta: "Bald verfügbar",
    accent: "#8A8A8A",
    available: false,
  },
] as const;

export default function UmbrellaLanding() {
  return (
    <main className="min-h-screen bg-parchment text-onyx flex flex-col">
      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <span className="font-sans text-[10px] tracking-regal uppercase text-gold mb-8">
          Quiet Luxury · Hospitality Software
        </span>
        <h1 className="font-display text-6xl md:text-7xl font-light leading-none mb-8">
          ORIZ
        </h1>
        <div className="w-16 h-px bg-gold/40 mb-8" />
        <p className="font-display text-xl md:text-2xl italic text-onyx/55 max-w-2xl leading-relaxed">
          Drei Produkte für Gastronomie und Hospitality.
          <br />
          Eine Sprache. Eine Handschrift.
        </p>
      </section>

      {/* ── Products ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRODUCTS.map(({ slug, eyebrow, title, body, cta, accent, available }) => {
            const inner = (
              <div
                className="group relative h-full bg-onyx text-parchment p-10 flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1"
                style={{ aspectRatio: "4/5" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}22 0%, transparent 70%)`,
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 opacity-20 group-hover:opacity-70"
                  style={{ backgroundColor: accent }}
                />

                <div className="relative z-10">
                  <span
                    className="font-sans text-[10px] tracking-regal uppercase"
                    style={{ color: `${accent}cc` }}
                  >
                    {eyebrow}
                  </span>
                </div>

                <div className="relative z-10">
                  <h2
                    className="font-display font-light leading-snug text-parchment mb-4"
                    style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.1rem)" }}
                  >
                    {title}
                  </h2>
                  <p className="font-display text-sm italic text-parchment/55 leading-relaxed">
                    {body}
                  </p>
                </div>

                <div className="relative z-10">
                  <div
                    className="w-10 h-px mb-5 transition-all duration-500 opacity-30 group-hover:opacity-80 group-hover:w-full"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/45 group-hover:text-parchment/75 transition-colors duration-300">
                      {cta}
                    </span>
                    {available && (
                      <span
                        className="font-sans text-[11px] transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: accent }}
                      >
                        ↗
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            if (!available || !slug) {
              return (
                <div key={eyebrow} className="opacity-70 cursor-default">
                  {inner}
                </div>
              );
            }

            return (
              <Link key={eyebrow} href={`/${slug}`} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-onyx/8 bg-onyx text-parchment py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
            © {new Date().getFullYear()} ORIZ · Wien
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-sans text-[10px] tracking-regal uppercase text-parchment/30 hover:text-gold transition-colors"
            >
              Admin
            </Link>
            <a
              href="mailto:office@oriz.at"
              className="font-sans text-[10px] tracking-regal uppercase text-parchment/30 hover:text-gold transition-colors"
            >
              office@oriz.at
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-4 flex justify-center sm:justify-end">
          <LegalLinks />
        </div>
      </footer>
    </main>
  );
}
