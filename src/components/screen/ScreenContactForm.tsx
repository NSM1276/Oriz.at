"use client";

import { useState } from "react";

// Screen enquiry form. Leads land in the same table the admin lead list reads
// (casa.leads), tagged with source "screen_landing", plus an email notification.

const VENUE_TYPES = ["Restaurant", "Café", "Bar", "Imbiss / Bistro", "Hotel", "Andere"];
const SCREEN_COUNT = ["1 Bildschirm", "2 – 3 Bildschirme", "Mehr als 3", "Noch keiner"];

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="font-sans transition-colors duration-200"
            style={{
              fontSize: "11px",
              padding: "8px 16px",
              border: active ? "1px solid #C69B3C" : "1px solid rgba(245,240,236,0.20)",
              backgroundColor: active ? "#C69B3C" : "transparent",
              color: active ? "#0A0A0A" : "rgba(245,240,236,0.55)",
              letterSpacing: "0.04em",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

type Status = "idle" | "sending" | "sent" | "error";

export default function ScreenContactForm() {
  const [venueType, setVenueType] = useState("");
  const [screens, setScreens] = useState("");
  const [venueName, setVenueName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const canSubmit = !!venueName && !!email && !!venueType;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");

    const fd = new FormData();
    fd.append("_captcha", "false");
    fd.append("_template", "table");
    fd.append("_subject", `ORIZ Screen Anfrage — ${venueName} · ${venueType}`);
    fd.append("Lokal", venueName);
    fd.append("Art", venueType);
    if (screens) fd.append("Bildschirme", screens);
    if (name) fd.append("Ansprechpartner", name);
    fd.append("E-Mail", email);
    if (phone) fd.append("Telefon", phone);
    if (message) fd.append("Nachricht", message);

    const dbInsert = fetch("/api/casa/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_name: venueName,
        property_type: venueType,
        units: screens,
        contact_name: name,
        email,
        phone,
        message,
        source: "screen_landing",
        _gotcha: gotcha,
      }),
    });

    const emailNotify = fetch("https://formsubmit.co/ajax/office@oriz.at", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
    });

    try {
      const [dbRes, emailRes] = await Promise.allSettled([dbInsert, emailNotify]);
      const dbOk = dbRes.status === "fulfilled" && dbRes.value.ok;
      const emailOk = emailRes.status === "fulfilled" && emailRes.value.ok;
      setStatus(dbOk || emailOk ? "sent" : "error");
      if (!dbOk && dbRes.status === "fulfilled") {
        console.error("[ScreenContactForm] DB insert failed:", dbRes.value.status);
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <div
          className="mx-auto mb-8"
          style={{ width: "40px", height: "1px", backgroundColor: "#C69B3C", opacity: 0.5 }}
        />
        <p
          className="font-display mb-3"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#F5F0EC", fontWeight: 300 }}
        >
          Vielen Dank.
        </p>
        <p
          className="font-display italic mx-auto"
          style={{
            fontSize: "0.95rem",
            color: "rgba(245,240,236,0.50)",
            maxWidth: "380px",
            lineHeight: 1.65,
          }}
        >
          Wir melden uns innerhalb von 24 Stunden bei Ihnen
          {name ? `, ${name}` : ""} — mit einem Vorschlag für Ihren Bildschirm.
        </p>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "rgba(245,240,236,0.40)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  };
  const inputCls =
    "w-full border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors";

  const fields = [
    { key: "venueName", label: "Name des Lokals *", placeholder: "Trattoria Belvedere", value: venueName, setter: setVenueName, type: "text" },
    { key: "name", label: "Ihr Name", placeholder: "Max Mustermann", value: name, setter: setName, type: "text" },
    { key: "email", label: "E-Mail-Adresse *", placeholder: "kontakt@lokal.at", value: email, setter: setEmail, type: "email" },
    { key: "phone", label: "Telefon (optional)", placeholder: "+43 …", value: phone, setter: setPhone, type: "tel" },
  ];

  return (
    <form onSubmit={handleSubmit} className="text-left flex flex-col gap-7">
      <div>
        <label className="font-sans" style={labelStyle}>
          Art des Lokals <span style={{ color: "#C69B3C" }}>*</span>
        </label>
        <ChipGroup options={VENUE_TYPES} value={venueType} onChange={setVenueType} />
      </div>

      <div>
        <label className="font-sans" style={labelStyle}>
          Wie viele Bildschirme hängen bei Ihnen?
        </label>
        <ChipGroup options={SCREEN_COUNT} value={screens} onChange={setScreens} />
      </div>

      <div className="flex flex-col gap-5 pt-2">
        {fields.map(({ key, label, placeholder, value, setter, type }) => (
          <div key={key}>
            <label className="font-sans" style={labelStyle}>{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={inputCls}
            />
          </div>
        ))}

        <div>
          <label className="font-sans" style={labelStyle}>Nachricht (optional)</label>
          <textarea
            rows={3}
            placeholder="Was sollen wir wissen?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputCls + " resize-none leading-snug"}
          />
        </div>

        {/* honeypot — hidden from humans, bots fill it */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={gotcha}
          onChange={(e) => setGotcha(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
      </div>

      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={!canSubmit || status === "sending"}
          className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "11px", padding: "15px 44px", letterSpacing: "0.2em" }}
        >
          {status === "sending" ? "Wird gesendet …" : "Anfrage senden"}
        </button>
        {status === "error" && (
          <p className="font-sans" style={{ fontSize: "11px", color: "#E58A8A" }}>
            Fehler beim Senden. Bitte versuchen Sie es erneut.
          </p>
        )}
        <p
          className="font-sans"
          style={{
            fontSize: "10px",
            color: "rgba(245,240,236,0.30)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: "8px",
          }}
        >
          Antwort innerhalb von 24 Stunden
        </p>
      </div>
    </form>
  );
}
