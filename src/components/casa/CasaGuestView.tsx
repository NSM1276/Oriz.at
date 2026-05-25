"use client";

import { useEffect, useState } from "react";

// City-aware curated recommendations. ORIZ manages these centrally;
// owner of the property doesn't add or edit them. Affiliate links will
// be wired in later — these are visual placeholders so the section's
// design and intent are visible from day one.
type Tip = {
  eyebrow: { de: string; en: string };
  name: string;
  body: { de: string; en: string };
};

const TIPS_BY_CITY: Record<string, Tip[]> = {
  wien: [
    {
      eyebrow: { de: "Wahrzeichen", en: "Landmark" },
      name: "Stephansdom",
      body: {
        de: "Führung und Aufstieg zum Südturm — beste Aussicht auf die Innenstadt.",
        en: "Guided tour and South Tower climb — the city's best skyline view.",
      },
    },
    {
      eyebrow: { de: "Kultur", en: "Culture" },
      name: "Schloss Schönbrunn",
      body: {
        de: "Prunkräume der Habsburger, weitläufiger Park, kaiserlicher Charme.",
        en: "Habsburg state rooms, sweeping gardens, imperial atmosphere.",
      },
    },
    {
      eyebrow: { de: "Geschmack", en: "Taste" },
      name: "Naschmarkt-Tour",
      body: {
        de: "Geführter Spaziergang mit Verkostung — Wiens älteste Markthalle.",
        en: "Guided walk with tastings through Vienna's oldest market.",
      },
    },
  ],
};

function CityRecommendations({
  city,
  lang,
  accent,
}: {
  city: string;
  lang: Lang;
  accent: string;
}) {
  const key = city.toLowerCase().includes("wien") ? "wien" : null;
  const tips = key ? TIPS_BY_CITY[key] : null;
  if (!tips || tips.length === 0) return null;

  const sectionLabel = lang === "de" ? "Empfehlungen" : "Recommendations";
  const subLabel =
    lang === "de"
      ? `Tipps von ORIZ · ${city}`
      : `Tips by ORIZ · ${city}`;
  const ctaLabel = lang === "de" ? "Bald buchbar" : "Booking soon";

  return (
    <section className="px-6 pb-16">
      <div className="max-w-xl mx-auto">
        {/* Section divider */}
        <div className="flex items-center gap-4 mb-10 mt-4">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: accent, opacity: 0.3 }}
          />
          <div className="text-center">
            <p
              className="font-sans uppercase"
              style={{
                fontSize: "10px",
                color: accent,
                letterSpacing: "0.32em",
              }}
            >
              {sectionLabel}
            </p>
            <p
              className="font-display italic mt-1"
              style={{
                fontSize: "11px",
                color: "rgba(245,240,236,0.35)",
              }}
            >
              {subLabel}
            </p>
          </div>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: accent, opacity: 0.3 }}
          />
        </div>

        {tips.map((t, i) => (
          <div
            key={t.name}
            className="py-6"
            style={{
              borderTop: i === 0 ? "1px solid rgba(245,240,236,0.10)" : undefined,
              borderBottom: "1px solid rgba(245,240,236,0.10)",
            }}
          >
            <div
              className="font-sans uppercase mb-2"
              style={{
                fontSize: "9px",
                color: accent,
                letterSpacing: "0.28em",
                opacity: 0.7,
              }}
            >
              {t.eyebrow[lang]}
            </div>
            <h3
              className="font-display font-light mb-2"
              style={{
                fontSize: "1.5rem",
                color: "#F5F0EC",
                lineHeight: 1.2,
              }}
            >
              {t.name}
            </h3>
            <p
              className="font-display italic mb-4"
              style={{
                fontSize: "0.95rem",
                color: "rgba(245,240,236,0.65)",
                lineHeight: 1.6,
              }}
            >
              {t.body[lang]}
            </p>
            <span
              className="inline-block font-sans uppercase"
              style={{
                fontSize: "10px",
                color: "rgba(245,240,236,0.30)",
                letterSpacing: "0.24em",
                border: "1px solid rgba(245,240,236,0.15)",
                padding: "8px 14px",
              }}
            >
              ◦ {ctaLabel}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

type Property = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  about: string | null;
  color_bg: string | null;
  color_primary: string | null;
  logo_url: string | null;
};

type ContentBlock = {
  id: string;
  block_type: string;
  title_de: string | null;
  title_en: string | null;
  body_de: string | null;
  body_en: string | null;
  position: number;
};

type Lang = "de" | "en";

export function CasaGuestView({
  property,
  blocks,
}: {
  property: Property;
  blocks: ContentBlock[];
}) {
  const [lang, setLang] = useState<Lang>("de");

  // detect browser language on mount
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("en")
    ) {
      setLang("en");
    }
  }, []);

  const bg = property.color_bg || "#0A0A0A";
  const accent = property.color_primary || "#C69B3C";

  const labels =
    lang === "de"
      ? { willkommen: "Willkommen" }
      : { willkommen: "Welcome" };

  return (
    <main
      style={{
        backgroundColor: bg,
        color: "#F5F0EC",
        minHeight: "100dvh",
      }}
    >
      {/* ── DE/EN toggle (top-right floating) ── */}
      <div
        className="fixed top-5 right-5 z-50 flex items-center"
        style={{
          backgroundColor: "rgba(10,10,10,0.70)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${accent}33`,
          padding: "4px 8px",
        }}
      >
        {(["de", "en"] as const).map((l, i) => (
          <span key={l} className="flex items-center">
            {i > 0 && (
              <span
                className="font-sans mx-1"
                style={{ fontSize: "9px", color: "rgba(245,240,236,0.20)" }}
              >
                |
              </span>
            )}
            <button
              onClick={() => setLang(l)}
              className="font-sans uppercase transition-colors"
              style={{
                fontSize: "10px",
                letterSpacing: "0.18em",
                padding: "4px 4px",
                color: lang === l ? accent : "rgba(245,240,236,0.40)",
              }}
            >
              {l.toUpperCase()}
            </button>
          </span>
        ))}
      </div>

      {/* ── Header ── */}
      <section
        className="px-6"
        style={{ paddingTop: "clamp(80px, 14vh, 140px)", paddingBottom: "48px" }}
      >
        <div className="max-w-xl mx-auto text-center">
          <p
            className="font-sans uppercase mb-4"
            style={{
              fontSize: "10px",
              color: accent,
              letterSpacing: "0.32em",
            }}
          >
            {labels.willkommen}
          </p>
          <h1
            className="font-display font-light"
            style={{
              fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
              color: "#F5F0EC",
              lineHeight: 1.1,
            }}
          >
            {property.name}
          </h1>
          {property.city && (
            <p
              className="font-display italic mt-3"
              style={{
                fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                color: "rgba(245,240,236,0.50)",
              }}
            >
              {property.city}
            </p>
          )}
          <div
            className="mx-auto mt-8"
            style={{
              width: "48px",
              height: "1px",
              backgroundColor: accent,
              opacity: 0.5,
            }}
            aria-hidden
          />
          {property.about && (
            <p
              className="font-display italic mt-8 mx-auto"
              style={{
                fontSize: "0.95rem",
                color: "rgba(245,240,236,0.60)",
                maxWidth: "440px",
                lineHeight: 1.65,
              }}
            >
              {property.about}
            </p>
          )}
        </div>
      </section>

      {/* ── Content blocks ── */}
      <section className="px-6 pb-16">
        <div className="max-w-xl mx-auto">
          {blocks.map((b, i) => {
            const title = lang === "de" ? b.title_de : b.title_en;
            const body = lang === "de" ? b.body_de : b.body_en;
            if (!title && !body) return null;
            return (
              <div
                key={b.id}
                className="py-6"
                style={{
                  borderTop:
                    i === 0
                      ? "1px solid rgba(245,240,236,0.10)"
                      : undefined,
                  borderBottom: "1px solid rgba(245,240,236,0.10)",
                }}
              >
                {title && (
                  <div
                    className="font-sans uppercase mb-3"
                    style={{
                      fontSize: "10px",
                      color: accent,
                      letterSpacing: "0.28em",
                    }}
                  >
                    {title}
                  </div>
                )}
                {body && (
                  <div
                    className="font-display"
                    style={{
                      fontSize: "1rem",
                      color: "rgba(245,240,236,0.85)",
                      lineHeight: 1.65,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Empfehlungen (city-aware, ORIZ-curated, preview) ── */}
      {property.city && (
        <CityRecommendations city={property.city} lang={lang} accent={accent} />
      )}

      {/* ── ORIZ footer mark ── */}
      <footer
        className="px-6 pb-12 text-center"
        style={{ paddingTop: "32px" }}
      >
        <a
          href="/casa"
          className="inline-block font-sans uppercase transition-colors hover:opacity-80"
          style={{
            fontSize: "9px",
            color: "rgba(245,240,236,0.30)",
            letterSpacing: "0.32em",
            textDecoration: "none",
          }}
        >
          ORIZ · Casa
        </a>
      </footer>
    </main>
  );
}
