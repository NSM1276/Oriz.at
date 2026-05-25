import type { Metadata } from "next";
import Link from "next/link";
import CasaDemo from "@/components/casa/CasaDemo";

export const metadata: Metadata = {
  title: "ORIZ Casa — Digitale Willkommenskarte für Apartments & Pensionen",
  description:
    "Ersetzt die veraltete Papiermappe durch eine stille, mehrsprachige Seite — auf dem Telefon des Gastes, ohne App, ohne IT.",
};

// ── content ────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: "Die Papiermappe nervt",
    body:
      "Vergilbt, zerrissen, veraltet — und kein Gast liest sie wirklich. Jeder Druck kostet Zeit und Geld.",
  },
  {
    title: "Immer dieselben Fragen",
    body:
      '„Wie ist das WLAN-Passwort?" — täglich, mehrfach, für jedes Zimmer. An der Rezeption, am Telefon, per Nachricht.',
  },
  {
    title: "Sprachbarriere",
    body:
      "Englische, türkische, japanische, arabische Gäste — die deutsche Mappe hilft ihnen nicht. Höflichkeit allein reicht nicht.",
  },
  {
    title: "Aktualisieren kostet Zeit",
    body:
      "Neue Frühstückszeiten? Anderer Code für das WLAN? Alles neu drucken, laminieren, in jedes Zimmer tragen.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Profil ausfüllen",
    body:
      "WLAN, Check-in, Frühstück, Hausregeln — einmal eingeben. Dauert eine halbe Stunde, nicht mehr.",
  },
  {
    n: "02",
    title: "QR-Code drucken",
    body:
      "Wir generieren eine fertige A4-Karte mit Ihrem QR-Code. Ausdrucken, laminieren, ins Zimmer stellen.",
  },
  {
    n: "03",
    title: "Gast scannt & liest",
    body:
      "Öffnet sich direkt im Browser — auf Deutsch, Englisch oder in der Sprache seines Smartphones.",
  },
  {
    n: "04",
    title: "Sie ändern in Sekunden",
    body:
      "Neue Öffnungszeiten? Eine Zeile bearbeiten — sofort live für alle Gäste. Kein Nachdrucken, kein Verteilen.",
  },
];

const FAQ = [
  {
    q: "Muss der Gast eine App herunterladen?",
    a: "Nein. Der Gast scannt den QR-Code mit der Kamera des Smartphones — die Seite öffnet sich direkt im Browser. Keine App, kein Login, keine Wartezeit.",
  },
  {
    q: "In welchen Sprachen funktioniert das?",
    a: "Standard: Deutsch und Englisch — Sie pflegen beide Versionen selbst. Auf Wunsch erkennt die Seite die Sprache des Gastgeräts und zeigt Inhalte in über 20 Sprachen automatisch.",
  },
  {
    q: "Wie schnell bin ich live?",
    a: "In der Regel 30 Minuten. Sie tragen Ihre Informationen ein, wir generieren den QR-Code, Sie drucken ihn aus — fertig.",
  },
  {
    q: "Was passiert mit den Daten meiner Gäste?",
    a: "Die Gast-Seite sammelt keine personenbezogenen Daten. Keine Cookies, kein Tracking, keine Registrierung. Inhalte liegen auf EU-Servern in Frankfurt.",
  },
  {
    q: "Kann ich mehrere Apartments oder Pensionen verwalten?",
    a: "Ja. Für Netzwerke mit mehreren Objekten erstellen wir ein individuelles Angebot — sprechen Sie uns einfach an.",
  },
  {
    q: "Was kostet das?",
    a: "Wir richten den Preis nach Größe und Anspruch Ihres Hauses. Schreiben Sie uns kurz — Sie bekommen innerhalb von 24 Stunden einen Vorschlag.",
  },
];

const TRUST = [
  {
    label: "30 Min Setup",
    body: "Heute einrichten, heute live. Kein Termin, kein Techniker vor Ort.",
  },
  {
    label: "Kein IT nötig",
    body: "Formular ausfüllen, fertig. Wer ein Smartphone bedient, schafft auch das.",
  },
  {
    label: "DSGVO-konform",
    body: "Server in Frankfurt. Keine Gästedaten, keine Cookies, keine Tracker.",
  },
];

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

// ── page ───────────────────────────────────────────────────────────────────
export default function CasaPage() {
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
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(198,155,60,0.05) 0%, transparent 70%)",
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
            style={{
              fontSize: "clamp(8px, 1.1vw, 10px)",
              color: "#C69B3C",
              letterSpacing: "0.32em",
            }}
          >
            ORIZ · Casa
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
            Die digitale
            <br />
            <span style={{ fontStyle: "italic" }}>Willkommenskarte.</span>
          </h1>

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
              href="#wie-es-funktioniert"
              className="font-sans uppercase tracking-regal text-parchment/55 hover:text-gold transition-colors duration-300"
              style={{
                fontSize: "clamp(9px, 1vw, 11px)",
                padding: "clamp(11px, 1.4vh, 15px) clamp(24px, 3.5vw, 40px)",
                border: "1px solid rgba(245,240,236,0.22)",
                letterSpacing: "0.2em",
              }}
            >
              Wie es funktioniert
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
            DSGVO-konform · EU-Hosting · In 30 Minuten fertig
          </p>
        </div>
      </section>

      {/* ── Problems (dark) ── */}
      <section
        id="problem"
        className="py-28 px-6"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="font-sans uppercase"
              style={{
                fontSize: "10px",
                color: "#C69B3C",
                letterSpacing: "0.32em",
              }}
            >
              Die Realität
            </span>
            <h2
              className="font-display font-light mt-6 leading-tight"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                color: "#F5F0EC",
              }}
            >
              Papier vergilbt.<br />Gäste fragen.<br />
              <span style={{ fontStyle: "italic" }}>Sie verlieren Zeit.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: "rgba(245,240,236,0.06)" }}>
            {PROBLEMS.map(({ title, body }) => (
              <div
                key={title}
                className="p-8 sm:p-10"
                style={{ backgroundColor: "#0A0A0A" }}
              >
                <div
                  className="font-display"
                  style={{
                    fontSize: "2rem",
                    color: "rgba(245,240,236,0.15)",
                    marginBottom: "1rem",
                    fontWeight: 300,
                  }}
                  aria-hidden
                >
                  ✕
                </div>
                <h3
                  className="font-sans uppercase mb-3"
                  style={{
                    fontSize: "11px",
                    color: "rgba(245,240,236,0.55)",
                    letterSpacing: "0.18em",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="font-display italic leading-relaxed"
                  style={{
                    fontSize: "0.95rem",
                    color: "rgba(245,240,236,0.55)",
                    lineHeight: 1.65,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div
              className="mx-auto mb-6"
              style={{ width: "48px", height: "1px", backgroundColor: "#C69B3C", opacity: 0.4 }}
              aria-hidden
            />
            <p
              className="font-display italic"
              style={{
                fontSize: "clamp(1.2rem, 2.2vw, 1.75rem)",
                color: "rgba(245,240,236,0.70)",
              }}
            >
              Es geht auch anders.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works (light) ── */}
      <section
        id="wie-es-funktioniert"
        className="py-28 px-6"
        style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span
              className="font-sans uppercase"
              style={{
                fontSize: "10px",
                color: "#C69B3C",
                letterSpacing: "0.32em",
              }}
            >
              In 4 Schritten
            </span>
            <h2
              className="font-display font-light mt-6"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                color: "#0A0A0A",
              }}
            >
              Heute eingerichtet — heute live.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {STEPS.map(({ n, title, body }) => (
              <div key={n}>
                <div
                  className="font-display leading-none mb-4"
                  style={{
                    fontSize: "clamp(3rem, 5vw, 4.5rem)",
                    color: "rgba(198,155,60,0.18)",
                    fontWeight: 300,
                  }}
                >
                  {n}
                </div>
                <h3
                  className="font-sans uppercase mb-3"
                  style={{
                    fontSize: "11px",
                    color: "#0A0A0A",
                    letterSpacing: "0.18em",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="font-display italic leading-relaxed"
                  style={{
                    fontSize: "0.95rem",
                    color: "rgba(10,10,10,0.60)",
                    lineHeight: 1.65,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo (dark, interactive) ── */}
      <section
        id="demo"
        className="py-28 px-6"
        style={{
          backgroundColor: "#0A0A0A",
          borderTop: "1px solid rgba(245,240,236,0.05)",
        }}
      >
        <CasaDemo />
      </section>

      {/* ── Trust (dark) ── */}
      <section
        id="vertrauen"
        className="py-24 px-6"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10 sm:gap-6">
            {TRUST.map(({ label, body }) => (
              <div key={label} className="text-center sm:text-left">
                <div
                  className="mb-4 mx-auto sm:mx-0"
                  style={{
                    width: "32px",
                    height: "1px",
                    backgroundColor: "#C69B3C",
                    opacity: 0.6,
                  }}
                  aria-hidden
                />
                <h3
                  className="font-display"
                  style={{
                    fontSize: "1.25rem",
                    color: "#F5F0EC",
                    marginBottom: "0.5rem",
                    fontWeight: 400,
                  }}
                >
                  {label}
                </h3>
                <p
                  className="font-sans"
                  style={{
                    fontSize: "13px",
                    color: "rgba(245,240,236,0.50)",
                    lineHeight: 1.6,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ (light) ── */}
      <section
        id="faq"
        className="py-28 px-6"
        style={{ backgroundColor: "#F5F0EC", color: "#0A0A0A" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="font-sans uppercase"
              style={{
                fontSize: "10px",
                color: "#C69B3C",
                letterSpacing: "0.32em",
              }}
            >
              Häufige Fragen
            </span>
            <h2
              className="font-display font-light mt-6"
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                color: "#0A0A0A",
              }}
            >
              Bevor Sie schreiben.
            </h2>
          </div>

          <div className="flex flex-col">
            {FAQ.map(({ q, a }, i) => (
              <div
                key={q}
                className="py-7"
                style={{
                  borderTop: i === 0 ? "1px solid rgba(10,10,10,0.10)" : undefined,
                  borderBottom: "1px solid rgba(10,10,10,0.10)",
                }}
              >
                <h3
                  className="font-display mb-3"
                  style={{
                    fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
                    color: "#0A0A0A",
                    fontWeight: 500,
                  }}
                >
                  {q}
                </h3>
                <p
                  className="font-display italic"
                  style={{
                    fontSize: "0.95rem",
                    color: "rgba(10,10,10,0.60)",
                    lineHeight: 1.7,
                  }}
                >
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-24 px-6 text-center"
        style={{
          backgroundColor: "#0A0A0A",
          borderTop: "1px solid rgba(245,240,236,0.05)",
        }}
      >
        <div className="max-w-xl mx-auto">
          <span
            className="font-sans uppercase"
            style={{
              fontSize: "10px",
              color: "#C69B3C",
              letterSpacing: "0.32em",
            }}
          >
            Beratung
          </span>
          <h2
            className="font-display font-light mt-6 mb-6"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "#F5F0EC",
            }}
          >
            Bereit für Ihre digitale<br />
            <span style={{ fontStyle: "italic" }}>Willkommenskarte?</span>
          </h2>
          <div
            className="mx-auto mb-10"
            style={{ width: "48px", height: "1px", backgroundColor: "#C69B3C", opacity: 0.4 }}
            aria-hidden
          />
          <p
            className="font-display italic mb-12"
            style={{
              fontSize: "1.1rem",
              color: "rgba(245,240,236,0.55)",
              lineHeight: 1.65,
            }}
          >
            Schreiben Sie uns kurz — wir melden uns innerhalb von 24 Stunden
            mit einem individuellen Vorschlag.
          </p>
          <Link
            href="/#kontakt"
            className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold transition-colors duration-300 inline-block"
            style={{
              fontSize: "11px",
              padding: "15px 40px",
              letterSpacing: "0.2em",
            }}
          >
            Beratung anfragen
          </Link>
        </div>
      </section>

      {/* ── Pilot notice ── */}
      <div
        className="py-6 px-6 text-center"
        style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid rgba(245,240,236,0.05)" }}
      >
        <p
          className="font-sans uppercase"
          style={{
            fontSize: "9px",
            color: "rgba(245,240,236,0.25)",
            letterSpacing: "0.28em",
          }}
        >
          Pilot · Inline-Kontaktformular folgt
        </p>
      </div>
    </main>
  );
}
