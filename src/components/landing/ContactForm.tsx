"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type State = {
  step: number;
  // Step 1
  venueType: string;
  tables: string;
  // Step 2
  dishes: string;
  languages: string;
  // Step 3
  plan: string;
  restaurant: string;
  name: string;
  email: string;
  phone: string;
};

const VENUE_TYPES = ["Restaurant", "Café", "Bar", "Hotel", "Imbiss / Bistro", "Andere"];
const TABLES = ["1 – 10 Tische", "11 – 25 Tische", "26 – 50 Tische", "Mehr als 50"];
const DISHES = ["Bis zu 20 Gerichte", "20 – 50 Gerichte", "50 – 100 Gerichte", "Mehr als 100"];
const LANGUAGES = ["Nur Deutsch", "Deutsch & Englisch", "3 oder mehr Sprachen"];
const PLANS = ["Trial (14 Tage kostenlos)", "Starter (€ 29 / Monat)", "Pro (€ 59 / Monat)", "Noch nicht sicher"];

function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`font-sans text-[11px] tracking-wide px-4 py-2 border transition-colors duration-200 ${
            value === opt
              ? "border-gold bg-gold text-onyx"
              : "border-parchment/20 text-parchment/50 hover:border-parchment/50 hover:text-parchment"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const STEPS = ["Ihr Lokal", "Ihr Menü", "Kontakt"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 flex items-center justify-center font-sans text-[10px] border transition-colors ${
                i < current
                  ? "border-gold bg-gold text-onyx"
                  : i === current
                  ? "border-parchment/60 text-parchment"
                  : "border-parchment/15 text-parchment/25"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className={`font-sans text-[10px] tracking-regal uppercase transition-colors ${
              i === current ? "text-parchment/70" : "text-parchment/25"
            }`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px transition-colors ${i < current ? "bg-gold/50" : "bg-parchment/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, setState] = useState<State>({
    step: 0,
    venueType: "",
    tables: "",
    dishes: "",
    languages: "",
    plan: "Noch nicht sicher",
    restaurant: "",
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const p = searchParams.get("plan");
    if (p === "trial") setState((s) => ({ ...s, plan: "Trial (14 Tage kostenlos)" }));
    else if (p === "starter") setState((s) => ({ ...s, plan: "Starter (€ 29 / Monat)" }));
    else if (p === "pro") setState((s) => ({ ...s, plan: "Pro (€ 59 / Monat)" }));
  }, [searchParams]);

  const set = (key: keyof State, value: string) => setState((s) => ({ ...s, [key]: value }));

  const canNext =
    state.step === 0 ? !!state.venueType && !!state.tables :
    state.step === 1 ? !!state.dishes && !!state.languages :
    !!state.restaurant && !!state.email;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canNext) return;
    setStatus("sending");

    const fd = new FormData();
    fd.append("_captcha", "false");
    fd.append("_template", "table");
    fd.append("_subject", `ORIZ Anfrage — ${state.restaurant} · ${state.plan}`);
    fd.append("Paket", state.plan);
    fd.append("Art des Lokals", state.venueType);
    fd.append("Anzahl Tische", state.tables);
    fd.append("Anzahl Gerichte", state.dishes);
    fd.append("Sprachen", state.languages);
    fd.append("Restaurant", state.restaurant);
    if (state.name) fd.append("Name", state.name);
    fd.append("E-Mail", state.email);
    if (state.phone) fd.append("Telefon", state.phone);

    try {
      const res = await fetch("https://formsubmit.co/ajax/office@na-max.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const json = await res.json();
      setStatus(json.success === "true" || json.success === true ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-px bg-gold/50 mx-auto mb-8" />
        <p className="font-display text-3xl text-parchment/80 italic mb-3">Vielen Dank.</p>
        <p className="font-sans text-sm text-parchment/40 max-w-xs mx-auto leading-relaxed">
          Wir melden uns innerhalb von 24 Stunden bei Ihnen, {state.name || state.restaurant}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <StepIndicator current={state.step} />

      {/* Step 1 */}
      {state.step === 0 && (
        <div className="space-y-8">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              Art des Lokals
            </label>
            <ChipGroup options={VENUE_TYPES} value={state.venueType} onChange={(v) => set("venueType", v)} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              Anzahl der Tische
            </label>
            <ChipGroup options={TABLES} value={state.tables} onChange={(v) => set("tables", v)} />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {state.step === 1 && (
        <div className="space-y-8">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              Wie viele Gerichte hat Ihre Karte?
            </label>
            <ChipGroup options={DISHES} value={state.dishes} onChange={(v) => set("dishes", v)} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              Welche Sprachen brauchen Sie?
            </label>
            <ChipGroup options={LANGUAGES} value={state.languages} onChange={(v) => set("languages", v)} />
          </div>
        </div>
      )}

      {/* Step 3 */}
      {state.step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              Gewünschtes Paket
            </label>
            <ChipGroup options={PLANS} value={state.plan} onChange={(v) => set("plan", v)} />
          </div>

          <div className="pt-4 space-y-5">
            {[
              { key: "restaurant", label: "Restaurant / Lokal *", placeholder: "Café Sacher Wien", type: "text", required: true },
              { key: "name", label: "Ihr Name", placeholder: "Max Mustermann", type: "text", required: false },
              { key: "email", label: "E-Mail-Adresse *", placeholder: "chef@restaurant.at", type: "email", required: true },
              { key: "phone", label: "Telefon (optional)", placeholder: "+43 …", type: "tel", required: false },
            ].map(({ key, label, placeholder, type, required }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">{label}</label>
                <input
                  type={type}
                  required={required}
                  placeholder={placeholder}
                  value={state[key as keyof State] as string}
                  onChange={(e) => set(key as keyof State, e.target.value)}
                  className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            ))}

            {/* Website URL */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
                Ihre Website (optional)
              </label>
              <input
                type="url"
                name="Website"
                placeholder="https://ihr-restaurant.at"
                className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
              />
              <span className="font-sans text-[10px] text-parchment/20 mt-1">
                Falls Ihr Menü dort zu finden ist — wir übernehmen den Rest.
              </span>
            </div>

            {/* PDF upload */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
                Menü als PDF (optional)
              </label>
              <label className="flex items-center gap-4 border border-dashed border-parchment/15 px-5 py-4 cursor-pointer hover:border-parchment/30 transition-colors group">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-parchment/30 group-hover:text-parchment/50 transition-colors">
                  <path d="M8 1v9M4 6l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={`font-sans text-xs transition-colors ${fileName ? "text-gold" : "text-parchment/30 group-hover:text-parchment/50"}`}>
                  {fileName ?? "PDF auswählen oder hierher ziehen"}
                </span>
                <input
                  type="file"
                  name="attachment"
                  accept=".pdf"
                  className="sr-only"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>
              <span className="font-sans text-[10px] text-parchment/20">
                Max. 5 MB · Wird direkt an uns übermittelt.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={`mt-10 flex ${state.step > 0 ? "justify-between" : "justify-end"}`}>
        {state.step > 0 && (
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, step: s.step - 1 }))}
            className="font-sans text-[11px] tracking-regal uppercase text-parchment/30 hover:text-parchment transition-colors"
          >
            ← Zurück
          </button>
        )}

        {state.step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setState((s) => ({ ...s, step: s.step + 1 }))}
            className="font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-8 py-3 hover:bg-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Weiter →
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canNext || status === "sending"}
            className="font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-8 py-3 hover:bg-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "Wird gesendet …" : "Anfrage senden"}
          </button>
        )}
      </div>

      {status === "error" && (
        <p className="text-center font-sans text-xs text-red-400 mt-4">
          Fehler beim Senden. Bitte versuchen Sie es erneut.
        </p>
      )}
    </form>
  );
}
