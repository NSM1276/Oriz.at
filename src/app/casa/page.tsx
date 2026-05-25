import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ORIZ Casa — Digitale Willkommenskarte für Apartments & Pensionen",
  description:
    "Ersetzt die veraltete Papiermappe durch eine stille, mehrsprachige Seite — auf dem Telefon des Gastes, ohne App, ohne IT.",
};

// ── corner mark (matches HeroAtmosphere) ───────────────────────────────────
type CornerPos = "tl" | "tr" | "bl" | "br";

function Corner({ pos }: { pos: CornerPos }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "clamp(18px, 2.8vw, 34px)",
    height: "clamp(18px, 2.8vw, 34px)",
    borderColor: "rgba(198,155,60,0.55)",
    borderStyle: "solid",
    borderWidth: 0,
    zIndex: 20,
  };
  const placements: Record<CornerPos, React.CSSProperties> = {
    tl: { top: "clamp(18px, 3.5vw, 40px)", left: "clamp(18px, 3.5vw, 40px)", borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top: "clamp(18px, 3.5vw, 40px)", right: "clamp(18px, 3.5vw, 40px)", borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: "clamp(18px, 3.5vw, 40px)", left: "clamp(18px, 3.5vw, 40px)", borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: "clamp(18px, 3.5vw, 40px)", right: "clamp(18px, 3.5vw, 40px)", borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <div style={{ ...base, ...placements[pos] }} aria-hidden />;
}

// ── Casa hero (ORIZ-styled rewrite of Na-Max HeroSection) ──────────────────
export default function CasaPage() {
  return (
    <main className="bg-onyx text-parchment">
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "100svh", minHeight: "640px", backgroundColor: "#0A0A0A" }}
      >
        {/* very subtle gold radial glow centered */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(198,155,60,0.05) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        {/* corner marks */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* centered content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6 select-none">
          {/* eyebrow */}
          <span
            className="font-sans uppercase mb-8 md:mb-10 opacity-80"
            style={{
              fontSize: "clamp(8px, 1.1vw, 10px)",
              color: "#C69B3C",
              letterSpacing: "0.32em",
            }}
          >
            ORIZ · Casa
          </span>

          {/* headline — Garamond, two-line, italic accent on second word */}
          <h1
            className="font-display font-light"
            style={{
              fontSize: "clamp(2.6rem, 7.5vw, 5.5rem)",
              color: "#F5F0EC",
              lineHeight: 1.05,
              maxWidth: "18ch",
              textShadow: "0 4px 60px rgba(0,0,0,0.35)",
            }}
          >
            Die digitale
            <br />
            <span style={{ fontStyle: "italic" }}>Willkommenskarte.</span>
          </h1>

          {/* gold hairline */}
          <div
            className="my-7 md:my-10"
            style={{
              width: "clamp(36px, 5vw, 72px)",
              height: "1px",
              backgroundColor: "#C69B3C",
              opacity: 0.5,
            }}
            aria-hidden
          />

          {/* subhead */}
          <p
            className="font-display italic"
            style={{
              fontSize: "clamp(1rem, 1.6vw, 1.25rem)",
              color: "rgba(245,240,236,0.65)",
              maxWidth: "560px",
              lineHeight: 1.55,
            }}
          >
            Ersetzen Sie die veraltete Papiermappe durch eine ruhige
            digitale Seite — auf dem Telefon Ihres Gastes, in seiner Sprache.
            Ohne App. Ohne IT.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10 md:mt-14">
            <Link
              href="/#kontakt"
              className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold transition-colors duration-300"
              style={{
                fontSize: "clamp(9px, 1vw, 11px)",
                padding: "clamp(11px, 1.4vh, 15px) clamp(24px, 3.5vw, 40px)",
                letterSpacing: "0.2em",
              }}
            >
              Beratung anfragen
            </Link>
            <a
              href="#demo"
              className="font-sans uppercase tracking-regal text-parchment/55 hover:text-gold transition-colors duration-300"
              style={{
                fontSize: "clamp(9px, 1vw, 11px)",
                padding: "clamp(11px, 1.4vh, 15px) clamp(24px, 3.5vw, 40px)",
                border: "1px solid rgba(245,240,236,0.22)",
                letterSpacing: "0.2em",
              }}
            >
              Demo ansehen
            </a>
          </div>

          {/* trust line */}
          <p
            className="mt-10 md:mt-14 font-sans"
            style={{
              fontSize: "clamp(9px, 1vw, 10px)",
              color: "rgba(245,240,236,0.35)",
              letterSpacing: "0.18em",
            }}
          >
            DSGVO-konform · EU-Hosting · In 30 Minuten fertig
          </p>
        </div>
      </section>

      {/* ── Placeholder for next sections (will be added after pilot approval) ── */}
      <section
        className="py-20 px-6 text-center border-t border-parchment/5"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <p
          className="font-sans uppercase"
          style={{
            fontSize: "10px",
            color: "rgba(245,240,236,0.30)",
            letterSpacing: "0.32em",
          }}
        >
          Pilot · Nur Hero · Weitere Sektionen folgen nach Freigabe
        </p>
      </section>
    </main>
  );
}
