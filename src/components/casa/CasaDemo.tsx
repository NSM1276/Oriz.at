"use client";

import { useState } from "react";

// ── defaults ───────────────────────────────────────────────────────────────
const DEFAULTS = {
  name: "Pension Belmondo",
  city: "Wien",
  wifi_name: "Belmondo_Guest",
  wifi_pass: "wien2026",
  checkin: "15:00",
  checkout: "10:00",
  breakfast: "07:00 – 10:00 · Frühstücksraum EG",
  rules: "Bitte Ruhezeiten von 22:00 – 8:00 einhalten.",
};

type DemoData = typeof DEFAULTS;
type Lang = "de" | "en";

// ── editor field (matches Carta ContactForm style) ─────────────────────────
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const inputCls =
    "w-full border-b border-parchment/15 bg-transparent py-2 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors";
  return (
    <div className="flex flex-col gap-1">
      <label
        className="font-sans uppercase"
        style={{
          fontSize: "10px",
          color: "rgba(245,240,236,0.40)",
          letterSpacing: "0.18em",
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          className={inputCls + " resize-none leading-snug"}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ── phone shell ────────────────────────────────────────────────────────────
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto"
      style={{ width: "clamp(240px, 22vw, 300px)" }}
    >
      {/* outer frame */}
      <div
        className="overflow-hidden"
        style={{
          border: "1px solid rgba(198,155,60,0.35)",
          borderRadius: "32px",
          padding: "8px",
          backgroundColor: "#0A0A0A",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(198,155,60,0.10)",
        }}
      >
        {/* notch */}
        <div className="flex justify-center pt-1 pb-2">
          <div
            style={{
              width: "48px",
              height: "3px",
              borderRadius: "999px",
              backgroundColor: "rgba(245,240,236,0.18)",
            }}
          />
        </div>
        {/* screen */}
        <div
          className="overflow-y-auto"
          style={{
            backgroundColor: "#0A0A0A",
            height: "520px",
            borderRadius: "24px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ── guest preview (ORIZ-styled) ────────────────────────────────────────────
function GuestPreview({ data, lang }: { data: DemoData; lang: Lang }) {
  const labels =
    lang === "de"
      ? {
          willkommen: "Willkommen",
          wlan: "WLAN",
          netzwerk: "Netzwerk",
          passwort: "Passwort",
          checkin: "Check-in",
          checkout: "Check-out",
          fruehstueck: "Frühstück",
          regeln: "Hausordnung",
        }
      : {
          willkommen: "Welcome",
          wlan: "Wi-Fi",
          netzwerk: "Network",
          passwort: "Password",
          checkin: "Check-in",
          checkout: "Check-out",
          fruehstueck: "Breakfast",
          regeln: "House Rules",
        };

  const blockStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(245,240,236,0.08)",
    paddingTop: "14px",
    paddingBottom: "14px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "8px",
    color: "#C69B3C",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
  };
  const valueStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "rgba(245,240,236,0.75)",
    lineHeight: 1.5,
  };
  const dimStyle: React.CSSProperties = {
    fontSize: "9px",
    color: "rgba(245,240,236,0.40)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };

  return (
    <div className="px-5 py-6 select-none">
      {/* header */}
      <div className="text-center mb-5">
        <div style={{ ...dimStyle, marginBottom: 6 }}>{labels.willkommen}</div>
        <div
          className="font-display"
          style={{
            fontSize: "20px",
            color: "#F5F0EC",
            fontWeight: 400,
            lineHeight: 1.15,
          }}
        >
          {data.name || "—"}
        </div>
        <div
          className="font-display italic"
          style={{
            fontSize: "11px",
            color: "rgba(245,240,236,0.45)",
            marginTop: 3,
          }}
        >
          {data.city}
        </div>
        <div
          className="mx-auto mt-4"
          style={{
            width: "28px",
            height: "1px",
            backgroundColor: "#C69B3C",
            opacity: 0.5,
          }}
        />
      </div>

      {/* WiFi */}
      <div style={blockStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{labels.wlan}</div>
        <div style={valueStyle}>
          <div>
            <span style={{ opacity: 0.5 }}>{labels.netzwerk}: </span>
            {data.wifi_name || "—"}
          </div>
          <div>
            <span style={{ opacity: 0.5 }}>{labels.passwort}: </span>
            {data.wifi_pass || "—"}
          </div>
        </div>
      </div>

      {/* Check-in / out */}
      <div style={blockStyle}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>
          {labels.checkin} · {labels.checkout}
        </div>
        <div style={valueStyle}>
          <span>{data.checkin || "—"}</span>
          <span style={{ opacity: 0.4, margin: "0 8px" }}>—</span>
          <span>{data.checkout || "—"}</span>
        </div>
      </div>

      {/* Breakfast */}
      {data.breakfast && (
        <div style={blockStyle}>
          <div style={{ ...labelStyle, marginBottom: 6 }}>
            {labels.fruehstueck}
          </div>
          <div style={valueStyle}>{data.breakfast}</div>
        </div>
      )}

      {/* Rules */}
      {data.rules && (
        <div style={blockStyle}>
          <div style={{ ...labelStyle, marginBottom: 6 }}>{labels.regeln}</div>
          <div style={valueStyle}>{data.rules}</div>
        </div>
      )}

      {/* footer mark */}
      <div
        className="text-center font-sans uppercase mt-6"
        style={{
          fontSize: "7px",
          color: "rgba(245,240,236,0.20)",
          letterSpacing: "0.32em",
        }}
      >
        ORIZ · Casa
      </div>
    </div>
  );
}

// ── main demo section content (no outer section wrapper) ───────────────────
export default function CasaDemo() {
  const [data, setData] = useState<DemoData>(DEFAULTS);
  const [lang, setLang] = useState<Lang>("de");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  function set(key: keyof DemoData) {
    return (v: string) => setData((d) => ({ ...d, [key]: v }));
  }

  function reset() {
    setData(DEFAULTS);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* heading */}
      <div className="text-center mb-14">
        <span
          className="font-sans uppercase"
          style={{
            fontSize: "10px",
            color: "#C69B3C",
            letterSpacing: "0.32em",
          }}
        >
          Probieren Sie es aus
        </span>
        <h2
          className="font-display font-light mt-6"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            color: "#F5F0EC",
          }}
        >
          Links tippen.<br />
          <span style={{ fontStyle: "italic" }}>Rechts sehen Ihre Gäste.</span>
        </h2>
        <p
          className="font-display italic mx-auto mt-6"
          style={{
            fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
            color: "rgba(245,240,236,0.55)",
            maxWidth: "440px",
            lineHeight: 1.6,
          }}
        >
          Eine Vorschau aus dem echten Admin-Panel. Ändern Sie etwas links —
          die Gast-Seite rechts aktualisiert sich sofort.
        </p>
      </div>

      {/* mobile tab switcher */}
      <div
        className="flex lg:hidden mb-6 mx-auto"
        style={{
          maxWidth: "320px",
          border: "1px solid rgba(245,240,236,0.12)",
        }}
      >
        <button
          onClick={() => setTab("edit")}
          className="flex-1 font-sans uppercase transition-colors"
          style={{
            fontSize: "10px",
            padding: "10px",
            letterSpacing: "0.2em",
            backgroundColor: tab === "edit" ? "#C69B3C" : "transparent",
            color: tab === "edit" ? "#0A0A0A" : "rgba(245,240,236,0.50)",
          }}
        >
          Bearbeiten
        </button>
        <button
          onClick={() => setTab("preview")}
          className="flex-1 font-sans uppercase transition-colors"
          style={{
            fontSize: "10px",
            padding: "10px",
            letterSpacing: "0.2em",
            backgroundColor: tab === "preview" ? "#C69B3C" : "transparent",
            color: tab === "preview" ? "#0A0A0A" : "rgba(245,240,236,0.50)",
          }}
        >
          Vorschau
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* LEFT: editor */}
        <div className={tab === "preview" ? "hidden lg:block" : ""}>
          <div
            className="p-6 sm:p-8"
            style={{
              border: "1px solid rgba(245,240,236,0.10)",
              backgroundColor: "rgba(245,240,236,0.02)",
            }}
          >
            {/* editor header */}
            <div className="flex items-center justify-between mb-7">
              <span
                className="font-sans uppercase"
                style={{
                  fontSize: "10px",
                  color: "#C69B3C",
                  letterSpacing: "0.28em",
                }}
              >
                Admin-Panel
              </span>
              <button
                onClick={reset}
                className="font-sans uppercase hover:text-gold transition-colors"
                style={{
                  fontSize: "10px",
                  color: "rgba(245,240,236,0.35)",
                  letterSpacing: "0.18em",
                }}
              >
                ↺ Zurücksetzen
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <Field label="Name" value={data.name} onChange={set("name")} />
              <Field label="Ort" value={data.city} onChange={set("city")} />

              <div className="grid grid-cols-2 gap-5">
                <Field label="WLAN-Name" value={data.wifi_name} onChange={set("wifi_name")} />
                <Field label="WLAN-Passwort" value={data.wifi_pass} onChange={set("wifi_pass")} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Field label="Check-in" value={data.checkin} onChange={set("checkin")} />
                <Field label="Check-out" value={data.checkout} onChange={set("checkout")} />
              </div>

              <Field
                label="Frühstück"
                value={data.breakfast}
                onChange={set("breakfast")}
                multiline
              />
              <Field
                label="Hausordnung"
                value={data.rules}
                onChange={set("rules")}
                multiline
              />
            </div>

            <div
              className="mt-8 pt-5 text-center font-sans"
              style={{
                fontSize: "9px",
                color: "rgba(245,240,236,0.30)",
                letterSpacing: "0.18em",
                borderTop: "1px solid rgba(245,240,236,0.08)",
                textTransform: "uppercase",
              }}
            >
              Änderungen werden im echten Panel sofort gespeichert
            </div>
          </div>
        </div>

        {/* RIGHT: phone preview */}
        <div
          className={`flex flex-col items-center gap-5 ${
            tab === "edit" ? "hidden lg:flex" : ""
          }`}
        >
          {/* lang toggle */}
          <div
            className="flex items-center"
            style={{ border: "1px solid rgba(245,240,236,0.12)" }}
          >
            {(["de", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="font-sans uppercase transition-colors"
                style={{
                  fontSize: "10px",
                  padding: "8px 16px",
                  letterSpacing: "0.2em",
                  backgroundColor: lang === l ? "#C69B3C" : "transparent",
                  color: lang === l ? "#0A0A0A" : "rgba(245,240,236,0.50)",
                }}
              >
                {l === "de" ? "Deutsch" : "English"}
              </button>
            ))}
          </div>

          <PhoneMockup>
            <GuestPreview data={data} lang={lang} />
          </PhoneMockup>

          <p
            className="font-display italic text-center mt-2"
            style={{
              fontSize: "11px",
              color: "rgba(245,240,236,0.40)",
              maxWidth: "240px",
              lineHeight: 1.5,
            }}
          >
            Was Ihr Gast nach dem Scannen des QR-Codes sieht.
          </p>
        </div>
      </div>
    </div>
  );
}
