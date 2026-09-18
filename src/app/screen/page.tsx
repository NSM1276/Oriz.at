import type { Metadata } from "next";
import Link from "next/link";
import ScreenContactForm from "@/components/screen/ScreenContactForm";
import { ScreenTvFrame } from "@/components/screen/ScreenTvFrame";

export const metadata: Metadata = {
  title: "ORIZ Screen — Digitale Menütafel für Ihren Fernseher",
  description:
    "Der Bildschirm, der schon bei Ihnen hängt, zeigt Ihre Speisekarte. Preise in Echtzeit, Wechsel nach Tageszeit, ohne Zusatzgerät und ohne Installation.",
  alternates: { canonical: "https://oriz.at/screen" },
};

// ── content ────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: "Der Fernseher läuft leer",
    body:
      "Nachrichten ohne Ton oder ein schwarzer Bildschirm. Das Gerät hängt an der Wand und verkauft nichts.",
  },
  {
    title: "Die Kreidetafel altert",
    body:
      "Schön geschrieben, aber seit Monaten dieselbe. Jede Änderung heißt abwischen und neu schreiben.",
  },
  {
    title: "Signage-Systeme sind schwer",
    body:
      "Player-Box, Lizenz, Software, Technikertermin. Für zwei Bildschirme im Lokal steht das in keinem Verhältnis.",
  },
  {
    title: "Zwei Karten, doppelte Arbeit",
    body:
      "Am Tisch die eine Karte, an der Wand eine andere. Irgendwann stimmt ein Preis nicht mehr überein.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Browser am TV öffnen",
    body:
      "Jeder Smart-TV der letzten Jahre hat einen Browser. Sie brauchen nichts zu kaufen und nichts zu installieren.",
  },
  {
    n: "02",
    title: "Ihre Adresse eingeben",
    body:
      "oriz.at/screen/ihr-lokal — einmal mit der Fernbedienung getippt, als Lesezeichen gespeichert.",
  },
  {
    n: "03",
    title: "Vollbild. Fertig.",
    body:
      "Die Karte läuft von selbst weiter, Tag für Tag. Kein Rechner im Hintergrund, kein USB-Stick.",
  },
];

const FEATURES = [
  {
    title: "Echtzeit",
    body:
      "Sie ändern einen Preis am Handy, der Bildschirm zeigt ihn im selben Moment. Kein Neustart, kein Warten.",
  },
  {
    title: "Wechsel nach Tageszeit",
    body:
      "Frühstück am Morgen, Mittagskarte ab 11:30, Abendkarte am Abend. Der Bildschirm schaltet selbst um.",
  },
  {
    title: "Spotlight",
    body:
      "Ein Gericht bildschirmfüllend, in Ruhe inszeniert. Was Sie verkaufen möchten, sieht jeder Gast.",
  },
  {
    title: "Ihre Handschrift",
    body:
      "Ihre Farben, Ihr Logo, Ihre Schrift. Der Bildschirm sieht aus wie Ihr Haus, nicht wie eine Werbetafel.",
  },
  {
    title: "Ohne Zusatzgerät",
    body:
      "Kein Player, kein Stick, keine Installation. Ein Fernseher mit Browser und WLAN genügt.",
  },
  {
    title: "Eine Karte, einmal gepflegt",
    body:
      "Dieselben Gerichte wie am Tisch. Sie ändern an einer Stelle, alles bleibt gleich aktuell.",
  },
];

const FAQ = [
  {
    q: "Brauche ich einen besonderen Fernseher?",
    a: "Nein. Jeder Smart-TV mit Browser und WLAN reicht — Samsung, LG, Sony, Philips. Falls Ihr Gerät keinen Browser hat, genügt ein einfacher Streaming-Stick für unter 50 Euro.",
  },
  {
    q: "Muss ich etwas installieren?",
    a: "Nein. Sie öffnen eine Internetadresse im Browser des Fernsehers und schalten auf Vollbild. Es gibt keine Software, keinen Player und keinen Vertrag mit einem Signage-Anbieter.",
  },
  {
    q: "Was passiert, wenn das Internet ausfällt?",
    a: "Der Bildschirm zeigt weiter die zuletzt geladene Karte. Sobald die Verbindung zurück ist, aktualisiert er sich von selbst.",
  },
  {
    q: "Funktioniert das auch ohne Fotos?",
    a: "Ja. Lokale ohne Fotos bekommen eine ruhige Schrift-Tafel mit großen Preisen — gut lesbar aus fünf Metern. Sobald Fotos da sind, wechselt die Darstellung automatisch auf große Bilder.",
  },
  {
    q: "Kann ich mehrere Bildschirme betreiben?",
    a: "Ja. Jeder Bildschirm öffnet dieselbe Adresse, oder Sie zeigen auf jedem einen anderen Bereich — etwa Getränke an der Bar und Speisen im Gastraum.",
  },
  {
    q: "Was kostet das?",
    a: "Der Preis richtet sich nach Größe und Anzahl der Bildschirme. Schreiben Sie uns kurz — Sie bekommen innerhalb von 24 Stunden einen Vorschlag.",
  },
];

// ── corner mark (matches Casa / HeroAtmosphere) ────────────────────────────
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
  const edge = "clamp(18px, 3.5vw, 44px)";
  const map: Record<CornerPos, React.CSSProperties> = {
    tl: { top: edge, left: edge, borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top: edge, right: edge, borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: edge, left: edge, borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: edge, right: edge, borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <div style={{ ...base, ...map[pos] }} aria-hidden />;
}

const GOLD = "#C69B3C";
const EYEBROW: React.CSSProperties = {
  fontSize: "10px",
  color: GOLD,
  letterSpacing: "0.32em",
};

export default function ScreenLanding() {
  return (
    <main className="bg-onyx text-parchment">
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "100svh", minHeight: "640px", backgroundColor: "#0A0A0A" }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(198,155,60,0.06) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6 select-none">
          <span
            className="font-sans uppercase mb-8 md:mb-10 opacity-80"
            style={{ fontSize: "clamp(8px, 1.1vw, 10px)", color: GOLD, letterSpacing: "0.32em" }}
          >
            ORIZ · Screen
          </span>

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
            Die Karte
            <br />
            <span style={{ fontStyle: "italic" }}>an der Wand.</span>
          </h1>

          <div
            className="my-7 md:my-10"
            style={{ width: "clamp(36px, 5vw, 72px)", height: "1px", backgroundColor: GOLD, opacity: 0.5 }}
            aria-hidden
          />

          <p
            className="font-display italic"
            style={{
              fontSize: "clamp(1rem, 1.6vw, 1.25rem)",
              color: "rgba(245,240,236,0.65)",
              maxWidth: "560px",
              lineHeight: 1.55,
            }}
          >
            Der Bildschirm, der schon bei Ihnen hängt, zeigt ab heute Ihre
            Speisekarte. In Echtzeit, in Ihren Farben — ohne Zusatzgerät,
            ohne Installation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10 md:mt-14">
            <a
              href="#kontakt"
              className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold transition-colors duration-300"
              style={{
                fontSize: "clamp(9px, 1vw, 11px)",
                padding: "clamp(15px, 1.6vh, 17px) clamp(24px, 3.5vw, 40px)",
                letterSpacing: "0.2em",
              }}
            >
              Beratung anfragen
            </a>
            <a
              href="#demo"
              className="font-sans uppercase tracking-regal text-parchment/55 hover:text-gold transition-colors duration-300"
              style={{
                fontSize: "clamp(9px, 1vw, 11px)",
                padding: "clamp(15px, 1.6vh, 17px) clamp(24px, 3.5vw, 40px)",
                border: "1px solid rgba(245,240,236,0.22)",
                letterSpacing: "0.2em",
              }}
            >
              Live ansehen
            </a>
          </div>

          <p
            className="mt-10 md:mt-14 font-sans"
            style={{
              fontSize: "clamp(9px, 1vw, 10px)",
              color: "rgba(245,240,236,0.35)",
              letterSpacing: "0.18em",
            }}
          >
            Kein Player · Keine Installation · In 10 Minuten am Bildschirm
          </p>
        </div>
      </section>

      {/* ── Problems ── */}
      <section id="problem" className="py-28 px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans uppercase" style={EYEBROW}>Die Realität</span>
            <h2
              className="font-display font-light mt-6 leading-tight"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", color: "#F5F0EC" }}
            >
              Der Bildschirm hängt.<br />
              <span style={{ fontStyle: "italic" }}>Er verkauft nur nichts.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: "rgba(245,240,236,0.06)" }}>
            {PROBLEMS.map(({ title, body }) => (
              <div key={title} className="p-8 sm:p-10" style={{ backgroundColor: "#0A0A0A" }}>
                <div
                  className="font-display"
                  style={{ fontSize: "2rem", color: "rgba(245,240,236,0.15)", marginBottom: "1rem", fontWeight: 300 }}
                  aria-hidden
                >
                  ✕
                </div>
                <h3
                  className="font-sans uppercase mb-3"
                  style={{ fontSize: "11px", color: "rgba(245,240,236,0.55)", letterSpacing: "0.18em" }}
                >
                  {title}
                </h3>
                <p
                  className="font-display italic leading-relaxed"
                  style={{ fontSize: "0.95rem", color: "rgba(245,240,236,0.55)", lineHeight: 1.65 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="mx-auto mb-6" style={{ width: "48px", height: "1px", backgroundColor: GOLD, opacity: 0.4 }} aria-hidden />
            <p
              className="font-display italic"
              style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.75rem)", color: "rgba(245,240,236,0.70)" }}
            >
              Es geht auch anders.
            </p>
          </div>
        </div>
      </section>

      {/* ── Demo ── */}
      <section
        id="demo"
        className="py-28 px-6"
        style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-sans uppercase" style={EYEBROW}>Live</span>
            <h2
              className="font-display font-light mt-6"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", color: "#0A0A0A" }}
            >
              So sieht es an der Wand aus.
            </h2>
            <p
              className="font-display italic mx-auto mt-5"
              style={{ fontSize: "1rem", color: "rgba(10,10,10,0.55)", maxWidth: "520px", lineHeight: 1.65 }}
            >
              Beides sind echte Aufnahmen laufender Bildschirme — keine Montage.
              Der Bildschirm wechselt alle paar Sekunden weiter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            <ScreenTvFrame
              src="/screen/board-restaurant.jpg"
              alt="Menütafel eines Restaurants mit großem Empfehlungsbild und Gerichten mit Preisen"
              caption="Restaurant mit Fotos"
              priority
            />
            <ScreenTvFrame
              src="/screen/board-pub.jpg"
              alt="Menütafel eines Lokals ohne Fotos, in großer Schrift mit Preisen"
              caption="Lokal ohne Fotos"
            />
          </div>

          <div className="text-center mt-12">
            <a
              href="/screen/ristorante-tosca"
              target="_blank"
              rel="noreferrer"
              className="font-sans uppercase tracking-regal transition-colors duration-300"
              style={{
                fontSize: "11px",
                padding: "15px 40px",
                letterSpacing: "0.2em",
                border: "1px solid rgba(10,10,10,0.25)",
                color: "#0A0A0A",
                display: "inline-block",
              }}
            >
              In voller Größe öffnen ↗
            </a>
            <p
              className="font-sans uppercase mt-5"
              style={{ fontSize: "10px", color: "rgba(10,10,10,0.30)", letterSpacing: "0.18em" }}
            >
              Am besten am Laptop oder direkt am Fernseher
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="wie-es-funktioniert" className="py-28 px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans uppercase" style={EYEBROW}>In drei Schritten</span>
            <h2
              className="font-display font-light mt-6"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", color: "#F5F0EC" }}
            >
              Eine Adresse. <span style={{ fontStyle: "italic" }}>Mehr braucht es nicht.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-px" style={{ backgroundColor: "rgba(245,240,236,0.06)" }}>
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="p-8 sm:p-10" style={{ backgroundColor: "#0A0A0A" }}>
                <div className="font-display font-light mb-5" style={{ fontSize: "2.25rem", color: GOLD, opacity: 0.55 }}>
                  {n}
                </div>
                <h3
                  className="font-sans uppercase mb-3"
                  style={{ fontSize: "11px", color: "rgba(245,240,236,0.75)", letterSpacing: "0.18em" }}
                >
                  {title}
                </h3>
                <p
                  className="font-display italic"
                  style={{ fontSize: "0.95rem", color: "rgba(245,240,236,0.55)", lineHeight: 1.65 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6" style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans uppercase" style={EYEBROW}>Was der Bildschirm kann</span>
            <h2
              className="font-display font-light mt-6"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", color: "#0A0A0A" }}
            >
              Ruhig, aber nie <span style={{ fontStyle: "italic" }}>stillstehend.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: "rgba(10,10,10,0.08)" }}>
            {FEATURES.map(({ title, body }) => (
              <div key={title} className="p-8 sm:p-9" style={{ backgroundColor: "#F5F0EC" }}>
                <div className="mb-5" style={{ width: "28px", height: "1px", backgroundColor: GOLD, opacity: 0.7 }} aria-hidden />
                <h3
                  className="font-sans uppercase mb-3"
                  style={{ fontSize: "11px", color: "rgba(10,10,10,0.70)", letterSpacing: "0.18em" }}
                >
                  {title}
                </h3>
                <p
                  className="font-display italic"
                  style={{ fontSize: "0.95rem", color: "rgba(10,10,10,0.58)", lineHeight: 1.65 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carta combination ── */}
      <section className="py-28 px-6" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-sans uppercase" style={EYEBROW}>Zusammen stärker</span>
          <h2
            className="font-display font-light mt-6 mb-8 leading-tight"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", color: "#F5F0EC" }}
          >
            Eine Karte.<br />
            <span style={{ fontStyle: "italic" }}>Zwei Orte.</span>
          </h2>
          <div className="mx-auto mb-8" style={{ width: "48px", height: "1px", backgroundColor: GOLD, opacity: 0.4 }} aria-hidden />
          <p
            className="font-display italic mx-auto mb-10"
            style={{ fontSize: "1.05rem", color: "rgba(245,240,236,0.60)", maxWidth: "520px", lineHeight: 1.7 }}
          >
            Am Tisch der QR-Code, an der Wand der Bildschirm. Beide zeigen
            dieselben Gerichte und dieselben Preise, weil beide aus derselben
            Karte kommen. Sie pflegen sie genau einmal.
          </p>
          <Link
            href="/carta"
            className="font-sans uppercase tracking-regal text-parchment/55 hover:text-gold transition-colors duration-300"
            style={{
              fontSize: "11px",
              padding: "15px 40px",
              letterSpacing: "0.2em",
              border: "1px solid rgba(245,240,236,0.22)",
              display: "inline-block",
            }}
          >
            ORIZ Carta ansehen →
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28 px-6" style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-sans uppercase" style={EYEBROW}>Häufige Fragen</span>
            <h2
              className="font-display font-light mt-6"
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.75rem)", color: "#0A0A0A" }}
            >
              Bevor Sie fragen.
            </h2>
          </div>

          <div className="flex flex-col">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="py-8" style={{ borderTop: "1px solid rgba(10,10,10,0.08)" }}>
                <h3
                  className="font-display mb-3"
                  style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)", color: "#0A0A0A", fontWeight: 500 }}
                >
                  {q}
                </h3>
                <p
                  className="font-display italic"
                  style={{ fontSize: "0.95rem", color: "rgba(10,10,10,0.60)", lineHeight: 1.7 }}
                >
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section
        id="kontakt"
        className="py-28 px-6"
        style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid rgba(245,240,236,0.05)" }}
      >
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-sans uppercase" style={EYEBROW}>Beratung</span>
            <h2
              className="font-display font-light mt-6 mb-6"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#F5F0EC" }}
            >
              Bereit für Ihre<br />
              <span style={{ fontStyle: "italic" }}>Karte an der Wand?</span>
            </h2>
            <div className="mx-auto mb-8" style={{ width: "48px", height: "1px", backgroundColor: GOLD, opacity: 0.4 }} aria-hidden />
            <p
              className="font-display italic mx-auto"
              style={{ fontSize: "1.05rem", color: "rgba(245,240,236,0.55)", lineHeight: 1.65, maxWidth: "440px" }}
            >
              Erzählen Sie uns kurz, wie Ihr Lokal aussieht und wo der Bildschirm
              hängt. Wir melden uns innerhalb von 24 Stunden mit einem Vorschlag.
            </p>
          </div>

          <ScreenContactForm />

          <div className="mt-10 flex items-center justify-center gap-3">
            <div style={{ width: "32px", height: "1px", backgroundColor: "rgba(245,240,236,0.10)" }} aria-hidden />
            <a
              href="https://wa.me/4367764292055"
              target="_blank"
              rel="noreferrer"
              className="font-sans uppercase hover:text-gold transition-colors"
              style={{ fontSize: "10px", color: "rgba(245,240,236,0.30)", letterSpacing: "0.18em" }}
            >
              oder direkt auf WhatsApp →
            </a>
            <div style={{ width: "32px", height: "1px", backgroundColor: "rgba(245,240,236,0.10)" }} aria-hidden />
          </div>
        </div>
      </section>
    </main>
  );
}
