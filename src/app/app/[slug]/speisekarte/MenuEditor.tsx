"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { parseAllergens, parseDiet, parseVariants } from "@/lib/guest-menu";
import { LOCALE_NAMES, MENU_LOCALES, type MenuLocale } from "@/lib/menu-edit";
import { createSection, deleteSection, moveSection, saveSection, setAvailable, setLocales } from "./actions";

export type EditorSection = { id: string; name: string; position: number; translations: Record<string, { name?: string }> | null };
export type EditorItem = {
  id: string;
  section_id: string;
  name: string;
  price_cents: number;
  price_variants: unknown;
  allergens: string | null;
  diet_tags: unknown;
  image_url: string | null;
  is_active: boolean;
  position: number;
  translations: Record<string, { name?: string; description?: string }> | null;
};

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-stone-200";

function priceSummary(item: EditorItem, currency: string): string {
  const sizes = parseVariants(item.price_variants);
  if (sizes.length > 1) return `${sizes.length} Größen ab ${formatPrice(Math.min(...sizes.map((s) => s.priceCents)), currency)}`;
  if (sizes.length === 1) return `${sizes[0].label} ${formatPrice(sizes[0].priceCents, currency)}`;
  return item.price_cents > 0 ? formatPrice(item.price_cents, currency) : "ohne Preis";
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(); }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-emerald-600" : "bg-stone-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function SectionDialog({
  slug,
  section,
  locales,
  itemCount,
  onClose,
}: {
  slug: string;
  section: EditorSection;
  locales: MenuLocale[];
  itemCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(section.name);
  const [tr, setTr] = useState<Record<string, string>>(() => Object.fromEntries(locales.map((l) => [l, section.translations?.[l]?.name ?? ""])));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Fehler.");
      else { onClose(); router.refresh(); }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Bereich bearbeiten">
      <button type="button" aria-label="Schließen" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={(e) => { e.preventDefault(); run(() => saveSection(slug, section.id, { name, translations: tr })); }}
        className="relative w-full max-w-md rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-2xl"
      >
        <p className="text-lg font-semibold">Bereich bearbeiten</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-stone-900" />
        </label>
        {locales.map((l) => (
          <label key={l} className="mt-3 block">
            <span className="text-sm text-stone-600">{LOCALE_NAMES[l]}</span>
            <input value={tr[l] ?? ""} placeholder={name} onChange={(e) => setTr((t) => ({ ...t, [l]: e.target.value }))} maxLength={80} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-stone-900" />
          </label>
        ))}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50">Speichern</button>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-3 text-stone-600">Abbrechen</button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const q = itemCount > 0 ? `„${section.name}“ mit ${itemCount} ${itemCount === 1 ? "Gericht" : "Gerichten"} löschen?` : `„${section.name}“ löschen?`;
            if (confirm(q)) run(() => deleteSection(slug, section.id));
          }}
          className="mt-3 w-full rounded-xl py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Bereich löschen
        </button>
      </form>
    </div>
  );
}

export function MenuEditor({
  slug,
  currency,
  locales,
  sections,
  items,
}: {
  slug: string;
  currency: string;
  locales: MenuLocale[];
  sections: EditorSection[];
  items: EditorItem[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<EditorSection | null>(null);
  const [newSection, setNewSection] = useState("");

  const isAvailable = (it: EditorItem) => availability[it.id] ?? it.is_active;
  const unknownAllergens = items.filter((it) => parseAllergens(it.allergens) === null).length;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onFail?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { setError(res.error ?? "Fehler."); onFail?.(); }
      router.refresh();
    });
  }

  function toggle(it: EditorItem) {
    const next = !isAvailable(it);
    // One tap, shown at once; rolled back if the server says no.
    setAvailability((a) => ({ ...a, [it.id]: next }));
    run(() => setAvailable(slug, it.id, next), () => setAvailability((a) => ({ ...a, [it.id]: !next })));
  }

  function toggleLocale(l: MenuLocale) {
    const next = locales.includes(l) ? locales.filter((x) => x !== l) : [...locales, l];
    run(() => setLocales(slug, next));
  }

  return (
    <div className="space-y-4">
      <section className={`${card} p-5`}>
        <p className="font-semibold">Sprachen der Karte</p>
        <p className="mt-0.5 text-sm text-stone-600">Deutsch immer. Gäste wählen oben in der Karte; fehlende Übersetzungen erscheinen auf Deutsch.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MENU_LOCALES.map((l) => {
            const on = locales.includes(l);
            const done = items.filter((it) => it.translations?.[l]?.name).length;
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                disabled={pending}
                onClick={() => toggleLocale(l)}
                className={`rounded-full px-3.5 py-2 text-sm ring-1 transition ${on ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300"}`}
              >
                {LOCALE_NAMES[l]}
                {on && items.length > 0 && <span className="ml-1.5 text-xs opacity-70">{done}/{items.length}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${card} p-5`}>
        <p className="font-semibold">Zum Drucken</p>
        <p className="mt-0.5 text-sm text-stone-600">
          Ihre Karte als PDF in A4, fertig für den Drucker — mit Datum „Stand“, Allergen-Legende und einem QR-Code zur aktuellen Online-Karte.
          Gerichte, die gerade als ausverkauft markiert sind, stehen mit drauf.
        </p>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Sobald Gerichte in der Karte stehen, können Sie sie hier drucken.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`/app/${slug}/speisekarte/pdf`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-medium text-white">
              PDF öffnen
            </a>
            {locales.map((l) => (
              <a key={l} href={`/app/${slug}/speisekarte/pdf?lang=${l}`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium ring-1 ring-stone-300">
                PDF · {LOCALE_NAMES[l]}
              </a>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-stone-600">
          Ihre Farben, Ihr Logo und Blatt für Blatt nachdrucken?{" "}
          <Link href={`/app/${slug}/druck`} className="font-medium underline">Zum Druck-Design (Pro)</Link>
        </p>
      </section>

      {unknownAllergens > 0 && items.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Bei {unknownAllergens} von {items.length} Gerichten fehlen die Allergene. Gäste sehen dort „Keine Angaben — bitte nachfragen“,
          und der Allergenfilter erscheint erst, wenn die meisten Gerichte Angaben haben.
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {sections.map((s, si) => {
        const list = items.filter((it) => it.section_id === s.id).sort((a, b) => a.position - b.position);
        return (
          <section key={s.id} className={card}>
            <header className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-stone-500">{list.length} {list.length === 1 ? "Gericht" : "Gerichte"}</p>
              </div>
              <button type="button" aria-label="Bereich nach oben" disabled={pending || si === 0} onClick={() => run(() => moveSection(slug, s.id, -1))} className="h-9 w-9 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30">↑</button>
              <button type="button" aria-label="Bereich nach unten" disabled={pending || si === sections.length - 1} onClick={() => run(() => moveSection(slug, s.id, 1))} className="h-9 w-9 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30">↓</button>
              <button type="button" onClick={() => setEditing(s)} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">Bearbeiten</button>
            </header>

            <ul className="divide-y divide-stone-100">
              {list.map((it) => {
                const allergens = parseAllergens(it.allergens);
                const diet = parseDiet(it.diet_tags);
                const on = isAvailable(it);
                return (
                  <li key={it.id} id={`item-${it.id}`} className="flex items-center gap-3 px-4 py-3">
                    <Link href={`/app/${slug}/speisekarte/gericht/${it.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      {it.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded-lg bg-stone-100" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <span className={`block truncate font-medium ${on ? "" : "text-stone-400 line-through"}`}>{it.name}</span>
                        <span className="block truncate text-sm text-stone-500">
                          {priceSummary(it, currency)}
                          {allergens && allergens.length > 0 && ` · ${allergens.join(" ")}`}
                          {diet.has("vegan") ? " · vegan" : diet.has("vegetarisch") ? " · vegetarisch" : ""}
                        </span>
                        {allergens === null && <span className="block text-xs text-amber-700">Allergene fehlen</span>}
                      </span>
                    </Link>
                    <span className="flex shrink-0 flex-col items-center gap-0.5">
                      <Switch on={on} onChange={() => toggle(it)} label={on ? `${it.name}: verfügbar` : `${it.name}: ausverkauft`} />
                      <span className={`text-[10px] ${on ? "text-stone-500" : "font-semibold text-red-700"}`}>{on ? "verfügbar" : "aus"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <Link href={`/app/${slug}/speisekarte/gericht/neu?bereich=${s.id}`} className="block border-t border-stone-100 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50">
              + Gericht
            </Link>
          </section>
        );
      })}

      <form
        onSubmit={(e) => { e.preventDefault(); const n = newSection; run(() => createSection(slug, n)); setNewSection(""); }}
        className={`${card} flex gap-2 p-3`}
      >
        <input value={newSection} onChange={(e) => setNewSection(e.target.value)} maxLength={80} placeholder="Neuer Bereich, z. B. Desserts" className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-stone-900" />
        <button type="submit" disabled={pending || !newSection.trim()} className="shrink-0 rounded-xl bg-stone-900 px-4 font-medium text-white disabled:opacity-40">Anlegen</button>
      </form>

      <Link href={`/app/${slug}/start`} className="block text-center text-sm text-stone-600 underline">
        Mehrere Gerichte auf einmal als Text einfügen
      </Link>

      {editing && (
        <SectionDialog
          slug={slug}
          section={editing}
          locales={locales}
          itemCount={items.filter((it) => it.section_id === editing.id).length}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
