"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PLAN_OPTIONS = ["Trial (14 Tage kostenlos)", "Starter (€ 29 / Monat)", "Pro (€ 59 / Monat)", "Noch nicht sicher"];

export function ContactForm() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState("Noch nicht sicher");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const p = searchParams.get("plan");
    if (p === "trial") setPlan("Trial (14 Tage kostenlos)");
    else if (p === "starter") setPlan("Starter (€ 29 / Monat)");
    else if (p === "pro") setPlan("Pro (€ 59 / Monat)");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const body = {
      plan: fd.get("plan"),
      name: fd.get("name"),
      restaurant: fd.get("restaurant"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      message: fd.get("message"),
    };
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-px bg-gold/50 mx-auto mb-8" />
        <p className="font-display text-2xl text-parchment/80 italic mb-3">
          Vielen Dank.
        </p>
        <p className="font-sans text-sm text-parchment/40">
          Wir melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
      </div>
    );
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
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
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
      {[
        { name: "restaurant", label: "Restaurant / Lokal", placeholder: "Café Sacher Wien", required: true, type: "text" },
        { name: "name", label: "Ihr Name", placeholder: "Max Mustermann", required: false, type: "text" },
        { name: "email", label: "E-Mail-Adresse", placeholder: "chef@restaurant.at", required: true, type: "email" },
        { name: "phone", label: "Telefon (optional)", placeholder: "+43 …", required: false, type: "tel" },
      ].map(({ name, label, placeholder, required, type }) => (
        <div key={name} className="flex flex-col gap-1">
          <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">{label}</label>
          <input
            type={type}
            name={name}
            required={required}
            placeholder={placeholder}
            className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
          Nachricht (optional)
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="Erzählen Sie uns von Ihrem Lokal."
          className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-2 font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-10 py-4 hover:bg-gold/80 transition-colors duration-300 self-center disabled:opacity-50"
      >
        {status === "sending" ? "Wird gesendet …" : "Anfrage senden"}
      </button>

      {status === "error" && (
        <p className="text-center font-sans text-xs text-red-400">
          Fehler beim Senden. Bitte versuchen Sie es erneut.
        </p>
      )}
    </form>
  );
}
