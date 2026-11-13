"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { ALLERGEN_LABELS } from "@/lib/allergens";
import { ALLERGEN_CODES } from "@/lib/guest-menu";
import { LOCALE_NAMES, type DishForm, type MenuLocale } from "@/lib/menu-edit";
import { deleteDish, moveDish, saveDish } from "../../actions";

// One dish. Built the way owners know it from the apps they already use: only name and price are
// needed, the fields come in the order name → price → text → photo → allergens, sizes are plain
// rows, allergens are tap-on letters, and nothing is saved until "Speichern" is pressed.

const card = "rounded-2xl bg-white p-5 ring-1 ring-onyx/10";
const input = "mt-1.5 w-full rounded-xl border border-onyx/20 bg-white px-3.5 py-3 text-lg outline-none placeholder:text-onyx/35 focus:border-onyx";
const label = "text-base font-semibold";
const link = "text-base font-medium text-[#7A5C14] underline underline-offset-4";
const MAX_SIZES = 6;

function Chip({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`min-h-11 rounded-full px-4 text-base ring-1 transition ${on ? "bg-onyx text-parchment ring-onyx" : "bg-white text-onyx ring-onyx/20"}`}
    >
      {children}
    </button>
  );
}

export function DishEditor({
  slug,
  itemId,
  sectionId: initialSection,
  sections,
  locales,
  initial,
  imageUrl,
}: {
  slug: string;
  itemId: string | null;
  sectionId: string;
  sections: { id: string; name: string }[];
  locales: MenuLocale[];
  initial: DishForm;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<DishForm>(initial);
  const [sectionId, setSectionId] = useState(initialSection);
  const [photo, setPhoto] = useState(imageUrl);
  const [showStory, setShowStory] = useState(!!initial.story);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const back = `/app/${slug}/speisekarte`;

  const set = <K extends keyof DishForm>(key: K, value: DishForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const multi = form.sizes.length > 0;
  const dirty = sectionId !== initialSection || JSON.stringify(form) !== JSON.stringify(initial);

  // Closing the tab with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveDish(slug, { itemId, sectionId, form });
      if (!res.ok) { setError(res.error); return; }
      // A new dish stays open once, so a photo can be added right away.
      if (!itemId && res.id) router.replace(`/app/${slug}/speisekarte/gericht/${res.id}?neu=1`);
      else router.push(`${back}#item-${itemId}`);
      router.refresh();
    });
  }

  function leave() {
    if (dirty && !confirm("Änderungen verwerfen?")) return;
    router.push(itemId ? `${back}#item-${itemId}` : back);
  }

  function toggleAllergen(code: string) {
    setForm((f) => ({
      ...f,
      allergensDeclared: true,
      allergens: f.allergens.includes(code) ? f.allergens.filter((c) => c !== code) : [...f.allergens, code],
    }));
  }

  const chosen = ALLERGEN_CODES.filter((c) => form.allergens.includes(c));
  const translated = locales.filter((l) => form.translations[l]?.name).length;

  return (
    <form onSubmit={save} className="space-y-4 pb-32">
      <div>
        <Link href={back} onClick={(e) => { if (dirty && !confirm("Änderungen verwerfen?")) e.preventDefault(); }} className="text-base font-medium text-onyx/70">
          ‹ Speisekarte
        </Link>
        <h1 className="mt-2 font-display text-4xl font-medium leading-tight">{itemId ? form.name || "Gericht" : "Neues Gericht"}</h1>
      </div>

      {/* 1 — name and price: all a dish needs */}
      <section className={card}>
        <label className="block">
          <span className={label}>Name</span>
          <input required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Wiener Schnitzel" className={input} />
        </label>

        <div className="mt-5">
          <span className={label}>{multi ? "Größen und Preise" : "Preis"}</span>
          {multi ? (
            <div className="mt-1.5 space-y-2">
              {form.sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input aria-label={`Größe ${i + 1}`} placeholder={i === 0 ? "z. B. 0,3 l" : "z. B. 0,5 l"} maxLength={30} value={s.label} onChange={(e) => set("sizes", form.sizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${input} mt-0 min-w-0 flex-1`} />
                  <input aria-label={`Preis ${i + 1}`} inputMode="decimal" placeholder="0,00" value={s.price} onChange={(e) => set("sizes", form.sizes.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className={`${input} mt-0 w-24 text-right`} />
                  <span className="text-lg text-onyx/60">€</span>
                  <button type="button" aria-label={`Größe ${i + 1} entfernen`} onClick={() => set("sizes", form.sizes.filter((_, j) => j !== i))} className="h-11 w-9 shrink-0 text-xl text-onyx/40 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                {form.sizes.length < MAX_SIZES && (
                  <button type="button" onClick={() => set("sizes", [...form.sizes, { label: "", price: "" }])} className={link}>+ Größe hinzufügen</button>
                )}
                <button type="button" onClick={() => set("sizes", [])} className="text-base text-onyx/60 underline underline-offset-4">Nur ein Preis</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-1.5 flex items-center gap-2">
                <input inputMode="decimal" required value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0,00" className={`${input} mt-0 w-36 text-right text-xl`} />
                <span className="text-xl text-onyx/60">€</span>
              </div>
              <button type="button" onClick={() => set("sizes", [{ label: "", price: form.price }, { label: "", price: "" }])} className={`${link} mt-3 inline-block`}>
                + Größe hinzufügen <span className="font-normal text-onyx/60 no-underline">(klein / groß, 0,3 l / 0,5 l)</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* 2 — text */}
      <section className={card}>
        <label className="block">
          <span className={label}>Beschreibung <span className="font-normal text-onyx/55">· optional</span></span>
          <textarea rows={2} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="z. B. mit Erdäpfelsalat und Preiselbeeren" className={input} />
        </label>
        {showStory ? (
          <label className="mt-4 block">
            <span className={label}>Längerer Text <span className="font-normal text-onyx/55">· nur in der Detailansicht</span></span>
            <textarea rows={3} maxLength={1000} value={form.story} onChange={(e) => set("story", e.target.value)} className={input} />
          </label>
        ) : (
          <button type="button" onClick={() => setShowStory(true)} className={`${link} mt-3 inline-block`}>+ Längeren Text hinzufügen</button>
        )}
      </section>

      {/* 3 — photo */}
      <section className={card}>
        <span className={label}>Foto <span className="font-normal text-onyx/55">· optional</span></span>
        {itemId ? (
          <>
            <div className="mt-2 [--accent:#0a0a0a] [--color-border:#d6d3d1] [--color-dim:#57534e] [--color-muted:#78716c] [--color-text:#0a0a0a]">
              <PhotoUploader target="carta-item" id={itemId} currentUrl={photo} onChange={setPhoto} aspect="wide" />
            </div>
            <p className="mt-2 text-sm text-onyx/60">Quer aufnehmen, das ganze Gericht in der Mitte, ohne Text und ohne Personen.</p>
          </>
        ) : (
          <p className="mt-1 text-base text-onyx/65">Nach dem ersten Speichern können Sie ein Foto hinzufügen.</p>
        )}
      </section>

      {/* 4 — allergens: tap the letters */}
      <section className={card}>
        <span className={label}>Allergene</span>
        <p className="mt-0.5 text-base text-onyx/65">Tippen Sie an, was enthalten ist.</p>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {ALLERGEN_CODES.map((code) => {
            const on = form.allergens.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                aria-label={`${code} ${ALLERGEN_LABELS[code]}`}
                title={ALLERGEN_LABELS[code]}
                onClick={() => toggleAllergen(code)}
                className={`grid aspect-square place-items-center rounded-full text-lg font-semibold ring-1 transition ${on ? "bg-onyx text-parchment ring-onyx" : "bg-white text-onyx ring-onyx/25"}`}
              >
                {code}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-base leading-snug" aria-live="polite">
          {!form.allergensDeclared ? (
            <span className="text-amber-700">Noch keine Angabe: Gäste sehen „bitte nachfragen“.</span>
          ) : chosen.length === 0 ? (
            <span className="text-emerald-700">Enthält keines der 14 Allergene.</span>
          ) : (
            chosen.map((c) => (
              <span key={c} className="mr-3 inline-block">
                <strong className="font-semibold">{c}</strong> {ALLERGEN_LABELS[c]}
              </span>
            ))
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {!(form.allergensDeclared && chosen.length === 0) && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, allergensDeclared: true, allergens: [] }))} className={link}>Enthält keines davon</button>
          )}
          {form.allergensDeclared && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, allergensDeclared: false, allergens: [] }))} className="text-base text-onyx/60 underline underline-offset-4">Noch nicht angeben</button>
          )}
        </div>
        <details className="mt-3 text-base text-onyx/65">
          <summary className="cursor-pointer">Was bedeuten die Buchstaben?</summary>
          <p className="mt-2 leading-relaxed">
            {ALLERGEN_CODES.map((c) => (
              <span key={c} className="mr-3 inline-block"><strong className="font-semibold text-onyx">{c}</strong> {ALLERGEN_LABELS[c]}</span>
            ))}
          </p>
          <p className="mt-2 text-sm">Für die Richtigkeit der Angaben ist Ihr Betrieb verantwortlich. ORIZ zeigt Gästen, was Sie eintragen.</p>
        </details>

        <div className="mt-5 border-t border-onyx/10 pt-4">
          <span className={label}>Ernährung</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip on={form.vegetarian || form.vegan} onChange={(v) => setForm((f) => ({ ...f, vegetarian: v, vegan: v ? f.vegan : false }))}>Vegetarisch</Chip>
            <Chip on={form.vegan} onChange={(v) => setForm((f) => ({ ...f, vegan: v, vegetarian: v || f.vegetarian }))}>Vegan</Chip>
          </div>
        </div>
      </section>

      {/* 5 — where it sits */}
      {sections.length > 1 && (
        <section className={card}>
          <label className="block">
            <span className={label}>Bereich</span>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={input}>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </section>
      )}

      {/* 6 — other languages: closed until wanted */}
      {locales.length > 0 && (
        <details className={card}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className={label}>Übersetzungen</span>
            <span className={`text-base ${translated === locales.length ? "text-emerald-700" : "text-onyx/60"}`}>{translated} von {locales.length} <span aria-hidden>›</span></span>
          </summary>
          <p className="mt-2 text-base text-onyx/65">Leer = Gäste sehen den deutschen Text. Auf Wunsch übersetzen wir Ihre Karte für Sie.</p>
          {locales.map((l) => (
            <div key={l} className="mt-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A5C14]">{LOCALE_NAMES[l]}</p>
              <input aria-label={`Name ${LOCALE_NAMES[l]}`} value={form.translations[l]?.name ?? ""} placeholder={form.name} maxLength={200} onChange={(e) => set("translations", { ...form.translations, [l]: { ...form.translations[l], name: e.target.value } })} className={input} />
              <textarea aria-label={`Beschreibung ${LOCALE_NAMES[l]}`} rows={2} value={form.translations[l]?.description ?? ""} placeholder={form.description} maxLength={600} onChange={(e) => set("translations", { ...form.translations, [l]: { ...form.translations[l], description: e.target.value } })} className={input} />
            </div>
          ))}
        </details>
      )}

      {/* 7 — order and delete, last */}
      {itemId && (
        <section className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-base text-onyx/70">Reihenfolge im Bereich</span>
            <button type="button" disabled={pending} onClick={() => start(async () => { await moveDish(slug, itemId, -1); router.refresh(); })} className="min-h-11 rounded-xl px-4 text-base ring-1 ring-onyx/20">↑ Nach oben</button>
            <button type="button" disabled={pending} onClick={() => start(async () => { await moveDish(slug, itemId, 1); router.refresh(); })} className="min-h-11 rounded-xl px-4 text-base ring-1 ring-onyx/20">↓ Nach unten</button>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`„${form.name}“ löschen? Das lässt sich nicht rückgängig machen.`)) return;
              start(async () => {
                const res = await deleteDish(slug, itemId);
                if (!res.ok) setError(res.error);
                else { router.push(back); router.refresh(); }
              });
            }}
            className="min-h-11 text-base font-medium text-red-700 underline underline-offset-4"
          >
            Gericht löschen
          </button>
        </section>
      )}

      {/* Save bar: above the phone's bottom bar (z-30), so the button is never covered. */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-onyx px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 text-parchment">
        <div className="mx-auto max-w-3xl">
          {error && <p role="alert" className="mb-2 text-base text-red-300">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={leave} disabled={pending} className="min-h-12 rounded-xl px-4 text-lg font-medium text-parchment/80 ring-1 ring-parchment/25">
              {dirty ? "Verwerfen" : "Zurück"}
            </button>
            <button type="submit" disabled={pending} className="min-h-12 flex-1 rounded-xl bg-gold px-6 text-lg font-semibold text-onyx disabled:opacity-60">
              {pending ? "Wird gespeichert…" : "Speichern"}
            </button>
          </div>
          <p className="mt-1.5 text-center text-sm text-parchment/60">{dirty ? "Nicht gespeicherte Änderungen" : "Gespeichertes ist sofort online."}</p>
        </div>
      </div>
    </form>
  );
}
