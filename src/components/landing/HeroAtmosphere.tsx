"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/locale-context";

// ── slides ──────────────────────────────────────────────────────────────────
const SLIDES = [
  "/hero/hero-1.jpg",
  "/hero/hero-2.jpg",
  "/hero/hero-3.jpg",
  "/hero/hero-4.jpg",
  "/hero/hero-5.jpg",
];

// ── one word per slide — "menu" in 5 languages ───────────────────────────────
const WORDS: { text: string; dir: "ltr" | "rtl" }[] = [
  { text: "Speisekarte", dir: "ltr" },
  { text: "Menu",        dir: "ltr" },
  { text: "Carte",       dir: "ltr" },
  { text: "قائمة",       dir: "rtl" },
  { text: "メニュー",    dir: "ltr" },
];

const SLIDE_MS = 4000; // duration each slide stays visible
const FADE_MS  = 900;  // cross-fade length (images + word)

// ── corner mark ──────────────────────────────────────────────────────────────
type CornerProps = {
  pos: "tl" | "tr" | "bl" | "br";
};
function Corner({ pos }: CornerProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    width:  "clamp(18px, 2.8vw, 34px)",
    height: "clamp(18px, 2.8vw, 34px)",
    borderColor: "rgba(198,155,60,0.55)",
    borderStyle: "solid",
    borderWidth: 0,
    zIndex: 20,
  };
  const placements: Record<string, React.CSSProperties> = {
    tl: { top:    "clamp(18px, 3.5vw, 40px)", left:  "clamp(18px, 3.5vw, 40px)", borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top:    "clamp(18px, 3.5vw, 40px)", right: "clamp(18px, 3.5vw, 40px)", borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: "clamp(18px, 3.5vw, 40px)", left:  "clamp(18px, 3.5vw, 40px)", borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: "clamp(18px, 3.5vw, 40px)", right: "clamp(18px, 3.5vw, 40px)", borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <div style={{ ...base, ...placements[pos] }} aria-hidden />;
}

// ── main component ────────────────────────────────────────────────────────────
export function HeroAtmosphere() {
  const { t } = useT();
  const [slide,   setSlide]   = useState(0);
  const [word,    setWord]    = useState(0);
  const [wordIn,  setWordIn]  = useState(true);

  // image cycling
  useEffect(() => {
    const timer = setInterval(
      () => setSlide(s => (s + 1) % SLIDES.length),
      SLIDE_MS,
    );
    return () => clearInterval(timer);
  }, []);

  // word cycling: fade-out → swap → fade-in
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIn(false);
      setTimeout(() => {
        setWord(w => (w + 1) % WORDS.length);
        setWordIn(true);
      }, FADE_MS);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "100svh", minHeight: "560px" }}
    >
      {/* ── background images ── */}
      {SLIDES.map((src, idx) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            opacity:    slide === idx ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            zIndex: 0,
          }}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover object-center"
            priority={idx === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── dark overlay — heavier at top & bottom, lighter in center ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.62) 0%, rgba(10,10,10,0.38) 45%, rgba(10,10,10,0.38) 60%, rgba(10,10,10,0.72) 100%)",
        }}
      />

      {/* ── corner marks ── */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* ── centered content ── */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6 select-none">

        {/* eyebrow */}
        <span
          className="font-sans uppercase tracking-regal mb-8 md:mb-12 opacity-75"
          style={{
            fontSize:      "clamp(8px, 1.1vw, 10px)",
            color:         "#C69B3C",
            letterSpacing: "0.32em",
          }}
        >
          {t.hero.eyebrow}
        </span>

        {/* wordmark */}
        <h1
          className="font-display font-light leading-none tracking-widest"
          style={{
            fontSize:   "clamp(5.5rem, 19vw, 14rem)",
            color:      "#F5F0EC",
            textShadow: "0 4px 60px rgba(0,0,0,0.35)",
          }}
        >
          ORIZ
        </h1>

        {/* gold hairline */}
        <div
          className="my-6 md:my-9"
          style={{
            width:           "clamp(36px, 5vw, 72px)",
            height:          "1px",
            backgroundColor: "#C69B3C",
            opacity:         0.5,
          }}
        />

        {/* cycling word */}
        <p
          className="font-display italic"
          style={{
            fontSize:   "clamp(1.5rem, 4.5vw, 3.25rem)",
            color:      "#F5F0EC",
            opacity:    wordIn ? 0.88 : 0,
            transition: `opacity ${Math.round(FADE_MS * 0.65)}ms ease-in-out`,
            direction:  WORDS[word].dir,
            minHeight:  "1.35em",
            lineHeight: 1.2,
          }}
          aria-live="polite"
        >
          {WORDS[word].text}
        </p>

        {/* slogan */}
        <p
          className="font-display italic mt-4 md:mt-5"
          style={{
            fontSize:  "clamp(0.75rem, 1.4vw, 1rem)",
            color:     "rgba(245,240,236,0.42)",
            maxWidth:  "380px",
            lineHeight: 1.75,
          }}
        >
          {t.hero.slogan}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10 md:mt-14">
          <a
            href="#demo"
            className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold hover:text-onyx transition-colors duration-300"
            style={{
              fontSize: "clamp(9px, 1vw, 11px)",
              padding:  "clamp(11px, 1.4vh, 15px) clamp(24px, 3.5vw, 40px)",
              letterSpacing: "0.2em",
            }}
          >
            {t.hero.ctaDemo}
          </a>
          <a
            href="#kontakt"
            className="font-sans uppercase tracking-regal text-parchment/55 hover:text-gold transition-colors duration-300"
            style={{
              fontSize:    "clamp(9px, 1vw, 11px)",
              padding:     "clamp(11px, 1.4vh, 15px) clamp(24px, 3.5vw, 40px)",
              border:      "1px solid rgba(245,240,236,0.22)",
              letterSpacing: "0.2em",
            }}
          >
            {t.hero.ctaContact}
          </a>
        </div>
      </div>

      {/* ── slide indicators ── */}
      <div
        className="absolute z-20 flex items-center gap-2"
        style={{ bottom: "clamp(20px, 3.5vw, 36px)", left: "50%", transform: "translateX(-50%)" }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`${i + 1}`}
            style={{
              width:           i === slide ? "clamp(18px, 2.5vw, 28px)" : "5px",
              height:          "1px",
              backgroundColor: i === slide ? "#C69B3C" : "rgba(245,240,236,0.35)",
              transition:      "all 0.45s ease",
              border:          "none",
              cursor:          "pointer",
              padding:         0,
            }}
          />
        ))}
      </div>
    </section>
  );
}
