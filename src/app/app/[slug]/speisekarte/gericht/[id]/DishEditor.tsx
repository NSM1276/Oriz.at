"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { ALLERGEN_LABELS, allergenIcon } from "@/lib/allergens";
import { ALLERGEN_CODES } from "@/lib/guest-menu";
import { LOCALE_NAMES, type DishForm, type MenuLocale } from "@/lib/menu-edit";
import { deleteDish, moveDish, saveDish } from "../../actions";

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";
const input = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900";
const label = "text-sm font-medium";

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`rounded-full px-3.5 py-2 text-sm ring-1 transition ${on ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300"}`}
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

  function toggleAllergen(code: string) {
    setForm((f) => ({
      ...f,
      allergensDeclared: true,
      allergens: f.allergens.includes(code) ? f.allergens.filter((c) => c !== code) : [...f.allergens, code],
    }));
  }

  return (
    <form onSubmit={save} className="space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <Link href={back} className="text-sm font-medium text-stone-600">‹ Speisekarte</Link>
        <p className="text-sm text-stone-500">{itemId ? "Gericht bearbeiten" : "Neues Gericht"}</p>
      </div>

      <section className={card}>
        <label className="block">
          <span className={label}>Name</span>
          <input required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
        </label>
        <label className="mt-4 block">
          <span className={label}>Beschreibung</span>
          <textarea rows={2} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Erscheint unter dem Namen, z. B. „Mit Erdäpfelsalat und Preiselbeeren“" className={input} />
        </label>
        {showStory ? (
          <label className="mt-4 block">
            <span className={label}>Längerer Text <span className="font-normal text-stone-500">(nur in der Detailansicht)</span></span>
            <textarea rows={3} maxLength={1000} value={form.story} onChange={(e) => set("story", e.target.value)} className={input} />
          </label>
        ) : (
          <button type="button" onClick={() => setShowStory(true)} className="mt-2 text-sm text-stone-600 underline">Längeren Text hinzufügen</button>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <span className={label}>{multi ? "Größen und Preise" : "Preis"}</span>
          <button
            type="button"
            onClick={() => set("sizes", multi ? [] : [{ label: "", price: form.price }, { label: "", price: "" }])}
            className="text-sm text-stone-600 underline"
          >
            {multi ? "Nur ein Preis" : "Mehrere Größen"}
          </button>
        </div>
        {multi ? (
          <div className="mt-2 space-y-2">
            {form.sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input aria-label={`Größe ${i + 1}`} placeholder={i === 0 ? "z. B. 0,3 l" : "z. B. 0,5 l"} maxLength={30} value={s.label} onChange={(e) => set("sizes", form.sizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${input} mt-0 flex-1`} />
                <input aria-label={`Preis ${i + 1}`} inputMode="decimal" placeholder="0,00" value={s.price} onChange={(e) => set("sizes", form.sizes.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className={`${input} mt-0 w-24 text-right`} />
                <span className="text-stone-500">€</span>
                <button type="button" aria-label={`Größe ${i + 1} entfernen`} onClick={() => set("sizes", form.sizes.filter((_, j) => j !== i))} className="h-10 w-8 text-stone-400 hover:text-red-700">✕</button>
              </div>
            ))}
            {form.sizes.length < 6 && (
              <button type="button" onClick={() => set("sizes", [...form.sizes, { label: "", price: "" }])} className="text-sm font-medium text-stone-700">+ Größe</button>
            )}
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <input inputMode="decimal" required value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0,00" className={`${input} mt-0 w-32 text-right text-lg`} />
            <span className="text-stone-500">€</span>
            <span className="text-xs text-stone-500">0 = ohne Preis anzeigen</span>
          </div>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <span className={label}>Allergene</span>
          {form.allergensDeclared && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, allergensDeclared: false, allergens: [] }))} className="text-sm text-stone-600 underline">
              Noch nicht angeben
            </button>
          )}
        </div>
        <p className="mt-0.5 text-sm text-stone-600">
          {!form.allergensDeclared
            ? "Noch keine Angabe — Gäste sehen „bitte nachfragen“. Tippen Sie an, was enthalten ist."
            : form.allergens.length === 0
              ? "Enthält keines der 14 Hauptallergene."
              : `Enthält: ${ALLERGEN_CODES.filter((c) => form.allergens.includes(c)).join(", ")}`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALLERGEN_CODES.map((code) => {
            const on = form.allergens.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                onClick={() => toggleAllergen(code)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition ${on ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300"}`}
              >
                <span aria-hidden className="shrink-0 opacity-80">{allergenIcon(code)}</span>
                <span className="min-w-0"><span className="font-semibold">{code}</span> {ALLERGEN_LABELS[code]}</span>
              </button>
            );
          })}
        </div>
        {!form.allergensDeclared && (
          <button type="button" onClick={() => setForm((f) => ({ ...f, allergensDeclared: true, allergens: [] }))} className="mt-3 text-sm font-medium text-stone-700 underline">
            Enthält keines davon
          </button>
        )}
      </section>

      <section className={card}>
        <span className={label}>Ernährung</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Toggle on={form.vegetarian || form.vegan} onChange={(v) => setForm((f) => ({ ...f, vegetarian: v, vegan: v ? f.vegan : false }))}>Vegetarisch</Toggle>
          <Toggle on={form.vegan} onChange={(v) => setForm((f) => ({ ...f, vegan: v, vegetarian: v || f.vegetarian }))}>Vegan</Toggle>
        </div>
        <p className="mt-2 text-xs text-stone-500">Nur ankreuzen, wenn es sicher stimmt — Gäste filtern danach.</p>
      </section>

      <section className={card}>
        <span className={label}>Foto</span>
        {itemId ? (
          <div className="mt-2 [--accent:#1c1917] [--color-border:#d6d3d1] [--color-dim:#57534e] [--color-muted:#78716c] [--color-text:#1c1917]">
            <PhotoUploader target="carta-item" id={itemId} currentUrl={photo} onChange={setPhoto} aspect="wide" />
          </div>
        ) : (
          <p className="mt-1 text-sm text-stone-600">Ein Foto können Sie nach dem ersten Speichern hinzufügen.</p>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className={label}>Verfügbar</span>
            <p className="text-sm text-stone-600">{form.available ? "Gäste können es bestellen." : "Wird als „nicht verfügbar“ angezeigt."}</p>
          </div>
          <Toggle on={form.available} onChange={(v) => set("available", v)}>{form.available ? "Ja" : "Ausverkauft"}</Toggle>
        </div>
        <label className="mt-4 block">
          <span className={label}>Bereich</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={input}>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </section>

      {locales.length > 0 && (
        <section className={card}>
          <span className={label}>Übersetzungen</span>
          <p className="mt-0.5 text-sm text-stone-600">Leer lassen = Gäste sehen den deutschen Text.</p>
          {locales.map((l) => (
            <div key={l} className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{LOCALE_NAMES[l]}</p>
              <input aria-label={`Name ${LOCALE_NAMES[l]}`} value={form.translations[l]?.name ?? ""} placeholder={form.name} maxLength={200} onChange={(e) => set("translations", { ...form.translations, [l]: { ...form.translations[l], name: e.target.value } })} className={input} />
              <textarea aria-label={`Beschreibung ${LOCALE_NAMES[l]}`} rows={2} value={form.translations[l]?.description ?? ""} placeholder={form.description} maxLength={600} onChange={(e) => set("translations", { ...form.translations, [l]: { ...form.translations[l], description: e.target.value } })} className={input} />
            </div>
          ))}
        </section>
      )}

      {itemId && (
        <section className={`${card} flex flex-wrap items-center gap-2`}>
          <span className="mr-auto text-sm text-stone-600">Reihenfolge im Bereich</span>
          <button type="button" disabled={pending} onClick={() => start(async () => { await moveDish(slug, itemId, -1); router.refresh(); })} className="rounded-xl px-4 py-2 ring-1 ring-stone-300">↑ Nach oben</button>
          <button type="button" disabled={pending} onClick={() => start(async () => { await moveDish(slug, itemId, 1); router.refresh(); })} className="rounded-xl px-4 py-2 ring-1 ring-stone-300">↓ Nach unten</button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`„${form.name}“ löschen?`)) return;
              start(async () => {
                const res = await deleteDish(slug, itemId);
                if (!res.ok) setError(res.error);
                else { router.push(back); router.refresh(); }
              });
            }}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 sm:w-auto sm:px-4"
          >
            Gericht löschen
          </button>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-stone-100/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {error && <p className="min-w-0 flex-1 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={pending} className={`${error ? "" : "flex-1"} rounded-xl bg-stone-900 px-6 py-3 font-medium text-white disabled:opacity-50`}>
            {pending ? "Wird gespeichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </form>
  );
}
