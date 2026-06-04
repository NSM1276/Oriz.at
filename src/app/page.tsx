import Link from "next/link";
import { Suspense } from "react";
import { LegalLinks } from "@/components/landing/LegalLinks";
import { StickyNav } from "@/components/landing/StickyNav";
import { RotatingWord } from "@/components/landing/RotatingWord";
import { StatsBar } from "@/components/landing/StatsBar";
import { ContactForm } from "@/components/landing/ContactForm";

export const metadata = {
  title: "ORIZ — Quiet Luxury für Gastronomie & Hospitality",
  description:
    "ORIZ ist das digitale Zuhause für Restaurants, Hotels und Pensionen. Carta · Casa · Screen — drei Produkte, eine Sprache.",
};

/* Subtle noise texture as inline SVG data URI */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const PRODUCTS = [
  {
    slug: "carta",
    eyebrow: "Carta",
    title: "Digitale Speisekarte",
    body: "QR-Code am Tisch — mehrsprachig, in Echtzeit aktualisierbar. Ersetzt Papier und veraltete Website-Menüs.",
    cta: "Mehr erfahren",
    accent: "#C69B3C",
    available: true,
    badge: null as string | null,
  },
  {
    slug: "casa",
    eyebrow: "Casa",
    title: "Digitale Begrüßungskarte",
    body: "Eine ruhige, mehrsprachige Karte für Apartments, Pensionen und kleine Hotels. WLAN, Check-in, Tipps — ohne PDF, ohne App.",
    cta: "Mehr erfahren",
    accent: "#C8963E",
    available: true,
    badge: null as string | null,
  },
  {
    slug: null as string | null,
    eyebrow: "Screen",
    title: "TV- & Lobby-Displays",
    body: "Stille, redaktionell gepflegte Bildschirme für Lobby, Bar und Lounge.",
    cta: "Bald verfügbar",
    accent: "#8A8A8A",
    available: false,
    badge: "Bald verfügbar" as string | null,
  },
];

const HOW_STEPS = [
  {
    num: "01",
    title: "Onboarding in 24h",
    body: "ORIZ richtet alles ein — Inhalt, Design, QR-Codes. Kein technisches Vorwissen nötig.",
  },
  {
    num: "02",
    title: "QR-Code am Tisch",
    body: "Gäste scannen, sehen sofort das Menü oder die Begrüßungskarte — ohne App, ohne Download.",
  },
  {
    num: "03",
    title: "Änderungen in Echtzeit",
    body: "Kein Neudruck, kein Warten. Änderungen erscheinen sofort auf jedem Gerät.",
  },
];

export default function UmbrellaLanding() {
  return (
    <>
      {/* ── Sticky Pill Navbar ── */}
      <StickyNav />

      <main className="flex flex-col">
        {/* ══════════════════════════════════════════
            §1  HERO
        ══════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-24 text-center overflow-hidden"
          style={{
            backgroundColor: "#1C1208",
            backgroundImage: NOISE_BG,
            backgroundRepeat: "repeat",
          }}
        >
          {/* Radial gold glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(200,150,62,0.08) 0%, transparent 70%)",
            }}
          />

          {/* Eyebrow */}
          <span
            className="relative font-sans text-[10px] tracking-regal uppercase mb-10 animate-hero-fade-up"
            style={{ color: "rgba(200,150,62,0.55)" }}
          >
            Quiet Luxury · Hospitality Software
          </span>

          {/* Main headline */}
          <h1
            className="relative font-display font-light text-parchment leading-tight mb-6 animate-hero-fade-up delay-100"
            style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)", maxWidth: "20ch" }}
          >
            Das digitale Zuhause für{" "}
            <br className="hidden sm:block" />
            <RotatingWord />
          </h1>

          {/* Sub-line */}
          <p
            className="relative font-display italic animate-hero-fade-up delay-200"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(245,240,236,0.38)",
              maxWidth: "38ch",
            }}
          >
            Drei Produkte. Eine Sprache. Eine Handschrift.
          </p>

          {/* CTA button */}
          <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-4 animate-hero-fade-up delay-300">
            <a
              href="#kontakt"
              className="font-sans text-[11px] tracking-regal uppercase px-8 py-3.5 transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: "#C8963E", color: "#1C1208" }}
            >
              Demo anfragen
            </a>
            <a
              href="#produkte"
              className="font-sans text-[11px] tracking-regal uppercase px-8 py-3.5 border transition-all duration-300 hover:border-gold/60"
              style={{ borderColor: "rgba(200,150,62,0.25)", color: "rgba(245,240,236,0.50)" }}
            >
              Produkte ↓
            </a>
          </div>

          {/* Gold hairline divider */}
          <div
            className="relative mt-14 animate-hero-fade-up delay-400"
            style={{
              width: "56px",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(200,150,62,0.55) 50%, transparent)",
            }}
          />

          {/* Scroll hint arrow */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-hero-fade-up delay-600"
          >
            <span
              className="font-sans text-[9px] tracking-regal uppercase"
              style={{ color: "rgba(200,150,62,0.28)" }}
            >
              Scroll
            </span>
            <svg
              width="12"
              height="18"
              viewBox="0 0 12 18"
              fill="none"
              aria-hidden="true"
              style={{ opacity: 0.22 }}
            >
              <line x1="6" y1="0" x2="6" y2="14" stroke="#C8963E" strokeWidth="1" />
              <polyline points="2,10 6,16 10,10" stroke="#C8963E" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            §2  PRODUCTS — BENTO GRID
        ══════════════════════════════════════════ */}
        <section
          className="px-6 py-24"
          style={{ backgroundColor: "#1C1208" }}
          id="produkte"
        >
          {/* Section header */}
          <div className="max-w-6xl mx-auto mb-14">
            <span
              className="font-sans text-[10px] tracking-regal uppercase"
              style={{ color: "rgba(200,150,62,0.40)" }}
            >
              Unsere Produkte
            </span>
            <div
              className="mt-3"
              style={{
                width: "36px",
                height: "1px",
                background: "linear-gradient(90deg, rgba(200,150,62,0.55), transparent)",
              }}
            />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRODUCTS.map(({ slug, eyebrow, title, body, cta, accent, available, badge }) => {
              const card = (
                <div
                  className="group relative bg-[#0A0A0A] text-parchment p-10 flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1 overflow-hidden"
                  style={{ aspectRatio: "4/5" }}
                >
                  {/* Hover: radial glow from top */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${accent}28 0%, transparent 65%)`,
                    }}
                  />

                  {/* Bottom hairline — always dim, expands to full on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                    style={{ backgroundColor: accent, opacity: 0.12 }}
                  />
                  <div
                    className="absolute bottom-0 left-0 h-px transition-all duration-500 group-hover:w-full pointer-events-none"
                    style={{ backgroundColor: accent, width: "0%", opacity: 0.65 }}
                  />

                  {/* Top: eyebrow + badge */}
                  <div className="relative z-10 flex items-start justify-between">
                    <span
                      className="font-sans text-[10px] tracking-regal uppercase"
                      style={{ color: `${accent}bb` }}
                    >
                      {eyebrow}
                    </span>
                    {badge && (
                      <span
                        className="font-sans text-[9px] tracking-regal uppercase px-2.5 py-1 rounded-full border"
                        style={{
                          color: accent,
                          borderColor: `${accent}30`,
                          backgroundColor: `${accent}0d`,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>

                  {/* Middle: title + body */}
                  <div className="relative z-10">
                    <h2
                      className="font-display font-light leading-snug text-parchment mb-4"
                      style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.1rem)" }}
                    >
                      {title}
                    </h2>
                    <p
                      className="font-display text-sm italic leading-relaxed"
                      style={{
                        color: available
                          ? "rgba(245,240,236,0.50)"
                          : "rgba(245,240,236,0.28)",
                      }}
                    >
                      {body}
                    </p>
                  </div>

                  {/* Bottom: CTA */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/35 group-hover:text-parchment/65 transition-colors duration-300">
                      {cta}
                    </span>
                    {available && (
                      <span
                        className="font-sans text-sm transition-transform duration-300 group-hover:translate-x-1"
                        style={{ color: accent }}
                      >
                        ↗
                      </span>
                    )}
                  </div>
                </div>
              );

              if (!available || !slug) {
                return (
                  <div key={eyebrow} id={eyebrow.toLowerCase()} className="opacity-60 cursor-default">
                    {card}
                  </div>
                );
              }

              return (
                <Link key={eyebrow} href={`/${slug}`} className="block">
                  {card}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            §3  HOW IT WORKS — Timeline
        ══════════════════════════════════════════ */}
        <section className="bg-parchment px-6 py-28" id="so-funktionierts">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="mb-16 text-center">
              <span
                className="font-sans text-[10px] tracking-regal uppercase"
                style={{ color: "rgba(28,18,8,0.32)" }}
              >
                So funktioniert&apos;s
              </span>
              <div
                className="mt-3 mx-auto"
                style={{
                  width: "36px",
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(200,150,62,0.50) 50%, transparent)",
                }}
              />
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
              {/* Connecting line between circles (desktop only) */}
              <div
                className="hidden md:block absolute top-7 left-[calc(16.666%+28px)] right-[calc(16.666%+28px)] h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(200,150,62,0.20), rgba(200,150,62,0.20))",
                }}
              />

              {HOW_STEPS.map(({ num, title, body }) => (
                <div key={num} className="flex flex-col items-center text-center">
                  {/* Number ring */}
                  <div
                    className="relative mb-8 flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: "56px",
                      height: "56px",
                      border: "1px solid rgba(200,150,62,0.22)",
                      backgroundColor: "rgba(200,150,62,0.04)",
                    }}
                  >
                    <span
                      className="font-display font-light"
                      style={{ fontSize: "1.4rem", color: "rgba(200,150,62,0.58)", lineHeight: 1 }}
                    >
                      {num}
                    </span>
                  </div>

                  <h3
                    className="font-display font-light mb-3"
                    style={{
                      fontSize: "clamp(1.15rem, 2vw, 1.4rem)",
                      color: "#1C1208",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="font-display text-sm italic leading-relaxed"
                    style={{ color: "rgba(28,18,8,0.48)" }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            §4  STATS BAR  (client — IntersectionObserver)
        ══════════════════════════════════════════ */}
        <StatsBar />

        {/* ══════════════════════════════════════════
            §5  CONTACT — Lead capture
        ══════════════════════════════════════════ */}
        <section
          id="kontakt"
          className="px-6 py-24"
          style={{ backgroundColor: "#1C1208" }}
        >
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <span
                className="font-sans text-[10px] tracking-regal uppercase"
                style={{ color: "rgba(200,150,62,0.40)" }}
              >
                Demo anfragen
              </span>
              <h2
                className="font-display font-light mt-3"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "rgba(245,240,236,0.85)" }}
              >
                Bereit für den ersten Schritt?
              </h2>
              <div
                className="mt-5 mx-auto"
                style={{
                  width: "36px",
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(200,150,62,0.50) 50%, transparent)",
                }}
              />
            </div>

            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            §6  FOOTER
        ══════════════════════════════════════════ */}
        <footer style={{ backgroundColor: "#1C1208" }}>
          {/* Gold hairline top */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,150,62,0.30) 25%, rgba(200,150,62,0.30) 75%, transparent 100%)",
            }}
          />

          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Brand + copyright */}
              <div className="flex flex-col items-center sm:items-start gap-2">
                <span
                  className="font-display font-light"
                  style={{
                    fontSize: "1.05rem",
                    letterSpacing: "0.28em",
                    color: "rgba(245,240,236,0.65)",
                  }}
                >
                  ORIZ
                </span>
                <p
                  className="font-sans text-[10px] tracking-regal uppercase"
                  style={{ color: "rgba(245,240,236,0.22)" }}
                >
                  © {new Date().getFullYear()} · Wien
                </p>
              </div>

              {/* Contact + admin */}
              <div className="flex items-center gap-6">
                <a
                  href="mailto:office@oriz.at"
                  className="font-sans text-[10px] tracking-regal uppercase hover:text-gold transition-colors duration-200"
                  style={{ color: "rgba(245,240,236,0.28)" }}
                >
                  office@oriz.at
                </a>
                <Link
                  href="/admin"
                  className="font-sans text-[10px] tracking-regal uppercase hover:text-gold transition-colors duration-200"
                  style={{ color: "rgba(245,240,236,0.28)" }}
                >
                  Admin →
                </Link>
              </div>
            </div>

            {/* Legal links */}
            <div
              className="mt-8 pt-6 flex justify-center sm:justify-end"
              style={{ borderTop: "1px solid rgba(245,240,236,0.055)" }}
            >
              <LegalLinks />
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
