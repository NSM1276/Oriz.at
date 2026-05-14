"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PLAN_OPTIONS = [
  "Trial (14 Tage kostenlos)",
  "Starter (€ 29 / Monat)",
  "Pro (€ 59 / Monat)",
  "Noch nicht sicher",
];

const TO = "office@na-max.com";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState("Noch nicht sicher");
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const p = searchParams.get("plan");
    if (p === "trial") setPlan("Trial (14 Tage kostenlos)");
    else if (p === "starter") setPlan("Starter (€ 29 / Monat)");
    else if (p === "pro") setPlan("Pro (€ 59 / Monat)");
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const subject = `ORIZ Anfrage: ${restaurant} — ${plan}`;
    const body = [
      `Paket: ${plan}`,
      `Restaurant: ${restaurant}`,
      `Name: ${name || "—"}`,
      `E-Mail: ${email}`,
      `Telefon: ${phone || "—"}`,
      ``,
      `Nachricht:`,
      message || "—",
    ].join("\n");

    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
      {/* Plan selector */}
      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
          Ihr gewünschtes Paket
        </label>
        <div className="flex flex-col gap-2 mt-1">
          {PLAN_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="plan"
                value={opt}
                checked={plan === opt}
                onChange={() => setPlan(opt)}
                className="sr-only"
              />
              <span
                className={`w-3 h-3 border shrink-0 flex items-center justify-center transition-colors ${
                  plan === opt ? "border-gold bg-gold" : "border-parchment/20"
                }`}
              >
                {plan === opt && <span className="w-1 h-1 bg-onyx" />}
              </span>
              <span className={`font-sans text-xs transition-colors ${plan === opt ? "text-parchment" : "text-parchment/40"}`}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">Restaurant / Lokal *</label>
        <input
          type="text"
          required
          value={restaurant}
          onChange={e => setRestaurant(e.target.value)}
          placeholder="Café Sacher Wien"
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">Ihr Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Max Mustermann"
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">E-Mail-Adresse *</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="chef@restaurant.at"
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+43 …"
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">Nachricht</label>
        <textarea
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Erzählen Sie uns von Ihrem Lokal."
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        className="mt-2 font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-10 py-4 hover:bg-gold/80 transition-colors duration-300 self-center"
      >
        Anfrage senden
      </button>

      <p className="text-center font-sans text-[10px] text-parchment/20">
        Es öffnet sich Ihr E-Mail-Programm mit dem ausgefüllten Formular.
      </p>
    </form>
  );
}
