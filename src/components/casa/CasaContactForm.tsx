"use client";

import { useState } from "react";

// ── options ────────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  "Pension",
  "Apartment(s)",
  "Bed & Breakfast",
  "Boutique-Hotel",
  "Andere",
];
const UNITS = [
  "1 – 5 Einheiten",
  "6 – 15 Einheiten",
  "16 – 30 Einheiten",
  "Mehr als 30",
];
const LANGUAGES = [
  "Nur Deutsch",
  "Deutsch & Englisch",
  "3 oder mehr Sprachen",
];

// ── chip group ─────────────────────────────────────────────────────────────
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
              border: active
                ? "1px solid #C69B3C"
                : "1px solid rgba(245,240,236,0.20)",
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

// ── main form ──────────────────────────────────────────────────────────────
type Status = "idle" | "sending" | "sent" | "error";

export default function CasaContactForm() {
  const [propertyType, setPropertyType] = useState("");
  const [units, setUnits] = useState("");
  const [languages, setLanguages] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const canSubmit = !!propertyName && !!email && !!propertyType;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");

    const fd = new FormData();
    fd.append("_captcha", "false");
    fd.append("_template", "table");
    fd.append(
      "_subject",
      `ORIZ Casa Anfrage — ${propertyName}${propertyType ? " · " + propertyType : ""}`,
    );
    fd.append("Unterkunft", propertyName);
    fd.append("Art", propertyType);
    if (units) fd.append("Einheiten", units);
    if (languages) fd.append("Sprachen", languages);
    if (name) fd.append("Ansprechpartner", name);
    fd.append("E-Mail", email);
    if (phone) fd.append("Telefon", phone);
    if (website) fd.append("Website / Booking-Link", website);
    if (message) fd.append("Nachricht", message);

    // Persist to our own API (DB source of truth) + email notification.
    const dbInsert = fetch("/api/casa/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_name: propertyName,
        property_type: propertyType,
        units,
        languages,
        contact_name: name,
        email,
        phone,
        website,
        message,
        source: "casa_landing",
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
      // Treat as sent if EITHER channel succeeded (we still got the lead).
      setStatus(dbOk || emailOk ? "sent" : "error");
      if (!dbOk && dbRes.status === "fulfilled") {
        console.error("[CasaContactForm] DB insert failed:", dbRes.value.status);
      }
    } catch {
      setStatus("error");
    }
  }

  // ── thank-you state ──────────────────────────────────────────────────────
  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <div
          className="mx-auto mb-8"
          style={{
            width: "40px",
            height: "1px",
            backgroundColor: "#C69B3C",
            opacity: 0.5,
          }}
        />
        <p
          className="font-display mb-3"
          style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
            color: "#F5F0EC",
            fontWeight: 300,
          }}
        >
          Vielen Dank.
        </p>
        <p
          className="font-display italic mx-auto"
          style={{
            fontSize: "0.95rem",
            color: "rgba(245,240,236,0.50)",
            maxWidth: "360px",
            lineHeight: 1.65,
          }}
        >
          Wir melden uns innerhalb von 24 Stunden bei Ihnen
          {name ? `, ${name}` : ""}.
        </p>
      </div>
    );
  }

  // ── form ─────────────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "rgba(245,240,236,0.40)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  };
  const inputCls =
    "w-full border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors";

  return (
    <form onSubmit={handleSubmit} className="text-left flex flex-col gap-7">
      {/* property type chips */}
      <div>
        <label className="font-sans" style={labelStyle}>
          Art der Unterkunft <span style={{ color: "#C69B3C" }}>*</span>
        </label>
        <ChipGroup
          options={PROPERTY_TYPES}
          value={propertyType}
          onChange={setPropertyType}
        />
      </div>

      {/* units chips */}
      <div>
        <label className="font-sans" style={labelStyle}>
          Anzahl der Einheiten
        </label>
        <ChipGroup options={UNITS} value={units} onChange={setUnits} />
      </div>

      {/* languages chips */}
      <div>
        <label className="font-sans" style={labelStyle}>
          Welche Sprachen brauchen Sie?
        </label>
        <ChipGroup
          options={LANGUAGES}
          value={languages}
          onChange={setLanguages}
        />
      </div>

      {/* text fields */}
      <div className="flex flex-col gap-5 pt-2">
        {[
          {
            key: "propertyName",
            label: "Name der Unterkunft *",
            placeholder: "Pension Belvedere",
            value: propertyName,
            setter: setPropertyName,
            type: "text",
            required: true,
          },
          {
            key: "name",
            label: "Ihr Name",
            placeholder: "Max Mustermann",
            value: name,
            setter: setName,
            type: "text",
            required: false,
          },
          {
            key: "email",
            label: "E-Mail-Adresse *",
            placeholder: "kontakt@unterkunft.at",
            value: email,
            setter: setEmail,
            type: "email",
            required: true,
          },
          {
            key: "phone",
            label: "Telefon (optional)",
            placeholder: "+43 …",
            value: phone,
            setter: setPhone,
            type: "tel",
            required: false,
          },
          {
            key: "website",
            label: "Website oder Booking-Link (optional)",
            placeholder: "https://…",
            value: website,
            setter: setWebsite,
            type: "url",
            required: false,
          },
        ].map(({ key, label, placeholder, value, setter, type, required }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-sans" style={labelStyle}>
              {label}
            </label>
            <input
              type={type}
              required={required}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={inputCls}
            />
          </div>
        ))}

        {/* message textarea */}
        <div className="flex flex-col gap-1">
          <label className="font-sans" style={labelStyle}>
            Nachricht (optional)
          </label>
          <textarea
            rows={3}
            placeholder="Was sollen wir wissen?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputCls + " resize-none leading-snug"}
          />
        </div>
      </div>

      {/* submit */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={!canSubmit || status === "sending"}
          className="font-sans uppercase tracking-regal bg-parchment text-onyx hover:bg-gold transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            fontSize: "11px",
            padding: "15px 44px",
            letterSpacing: "0.2em",
          }}
        >
          {status === "sending" ? "Wird gesendet …" : "Anfrage senden"}
        </button>
        {status === "error" && (
          <p
            className="font-sans"
            style={{ fontSize: "11px", color: "#E58A8A" }}
          >
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
