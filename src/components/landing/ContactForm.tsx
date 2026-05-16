"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/locale-context";

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

function ChipGroup({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
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

function StepIndicator({ current, steps }: { current: number; steps: readonly string[] }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-3">
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
          {i < steps.length - 1 && (
            <div className={`w-8 h-px transition-colors ${i < current ? "bg-gold/50" : "bg-parchment/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const { t } = useT();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, setState] = useState<State>({
    step: 0,
    venueType: "",
    tables: "",
    dishes: "",
    languages: "",
    plan: t.form.plans[3],
    restaurant: "",
    name: "",
    email: "",
    phone: "",
  });

  // Reset plan default when locale changes
  useEffect(() => {
    setState(s => ({
      ...s,
      plan: t.form.plans[3],
      venueType: "",
      tables: "",
      dishes: "",
      languages: "",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    const p = searchParams.get("plan");
    if (p === "trial")   setState(s => ({ ...s, plan: t.form.plans[0] }));
    if (p === "starter") setState(s => ({ ...s, plan: t.form.plans[1] }));
    if (p === "pro")     setState(s => ({ ...s, plan: t.form.plans[2] }));
  }, [searchParams, t]);

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
        <p className="font-display text-3xl text-parchment/80 italic mb-3">{t.form.success.title}</p>
        <p className="font-sans text-sm text-parchment/40 max-w-xs mx-auto leading-relaxed">
          {t.form.success.body} {state.name || state.restaurant}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <StepIndicator current={state.step} steps={t.form.steps} />

      {/* Step 1 */}
      {state.step === 0 && (
        <div className="space-y-8">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              {t.form.labels.venueType}
            </label>
            <ChipGroup options={t.form.venueTypes} value={state.venueType} onChange={(v) => set("venueType", v)} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              {t.form.labels.tables}
            </label>
            <ChipGroup options={t.form.tables} value={state.tables} onChange={(v) => set("tables", v)} />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {state.step === 1 && (
        <div className="space-y-8">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              {t.form.labels.dishes}
            </label>
            <ChipGroup options={t.form.dishes} value={state.dishes} onChange={(v) => set("dishes", v)} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              {t.form.labels.languages}
            </label>
            <ChipGroup options={t.form.languages} value={state.languages} onChange={(v) => set("languages", v)} />
          </div>
        </div>
      )}

      {/* Step 3 */}
      {state.step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/40">
              {t.form.labels.plan}
            </label>
            <ChipGroup options={t.form.plans} value={state.plan} onChange={(v) => set("plan", v)} />
          </div>

          <div className="pt-4 space-y-5">
            {[
              { key: "restaurant", label: t.form.labels.restaurant, placeholder: t.form.placeholders.restaurant, type: "text", required: true },
              { key: "name", label: t.form.labels.name, placeholder: t.form.placeholders.name, type: "text", required: false },
              { key: "email", label: t.form.labels.email, placeholder: t.form.placeholders.email, type: "email", required: true },
              { key: "phone", label: t.form.labels.phone, placeholder: t.form.placeholders.phone, type: "tel", required: false },
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
                {t.form.labels.website}
              </label>
              <input
                type="url"
                name="Website"
                placeholder={t.form.placeholders.website}
                className="border-b border-parchment/15 bg-transparent py-3 font-sans text-sm text-parchment placeholder:text-parchment/20 focus:outline-none focus:border-gold transition-colors"
              />
              <span className="font-sans text-[10px] text-parchment/20 mt-1">
                {t.form.labels.websiteHint}
              </span>
            </div>

            {/* PDF upload */}
            <div className="flex flex-col gap-2">
              <label className="font-sans text-[10px] tracking-regal uppercase text-parchment/30">
                {t.form.labels.pdf}
              </label>
              <label className="flex items-center gap-4 border border-dashed border-parchment/15 px-5 py-4 cursor-pointer hover:border-parchment/30 transition-colors group">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-parchment/30 group-hover:text-parchment/50 transition-colors">
                  <path d="M8 1v9M4 6l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={`font-sans text-xs transition-colors ${fileName ? "text-gold" : "text-parchment/30 group-hover:text-parchment/50"}`}>
                  {fileName ?? t.form.labels.pdfPlaceholder}
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
                {t.form.labels.pdfHint}
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
            {t.form.buttons.back}
          </button>
        )}

        {state.step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setState((s) => ({ ...s, step: s.step + 1 }))}
            className="font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-8 py-3 hover:bg-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t.form.buttons.next}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canNext || status === "sending"}
            className="font-sans text-[11px] tracking-regal uppercase text-onyx bg-gold px-8 py-3 hover:bg-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {status === "sending" ? t.form.buttons.sending : t.form.buttons.submit}
          </button>
        )}
      </div>

      {status === "error" && (
        <p className="text-center font-sans text-xs text-red-400 mt-4">
          {t.form.error}
        </p>
      )}
    </form>
  );
}
