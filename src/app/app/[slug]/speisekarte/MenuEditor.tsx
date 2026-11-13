"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { foldForSearch, parseAllergens, parseDiet, parseVariants } from "@/lib/guest-menu";
import { LOCALE_NAMES, MENU_LOCALES, type MenuLocale } from "@/lib/menu-edit";
import { PACKAGE_LOCALES } from "@/lib/locales";
import { lockedText } from "@/lib/entitlements";
import { whatsappUrl } from "@/lib/contact-info";
import { createSection, deleteSection, moveSection, saveSection, setAvailable, setLocales } from "./actions";
import { setSectionMenu } from "./menus-actions";
import { RowPhoto } from "./RowPhoto";
import { AVAILABILITY_LABEL, availabilityOf, type Availability } from "@/lib/sold-out";

export type EditorSection = { id: string; name: string; position: number; translations: Record<string, { name?: string }> | null; menu_id: string | null };
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
  sold_out_until: string | null;
  position: number;
  translations: Record<string, { name?: string; description?: string }> | null;
};

const card = "rounded-2xl bg-white ring-1 ring-onyx/10";
const panel = "overflow-hidden rounded-2xl bg-white ring-1 ring-onyx/10";
// A search box appears once scrolling through the list stops being quick.
const SEARCH_MIN_ITEMS = 30;

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
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-emerald-600" : "bg-onyx/25"}`}
    >
      <span className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-all ${on ? "left-[26px]" : "left-0.5"}`} />
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
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-1 w-full rounded-xl border border-onyx/20 px-3 py-2.5 text-base outline-none focus:border-onyx" />
        </label>
        {locales.map((l) => (
          <label key={l} className="mt-3 block">
            <span className="text-sm text-onyx/70">{LOCALE_NAMES[l]}</span>
            <input value={tr[l] ?? ""} placeholder={name} onChange={(e) => setTr((t) => ({ ...t, [l]: e.target.value }))} maxLength={80} className="mt-1 w-full rounded-xl border border-onyx/20 px-3 py-2.5 text-base outline-none focus:border-onyx" />
          </label>
        ))}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-onyx py-3 font-medium text-white disabled:opacity-50">Speichern</button>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-3 text-onyx/70">Abbrechen</button>
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
  allLanguages,
  sections,
  items,
  menus,
  menusSlot,
}: {
  slug: string;
  currency: string;
  /** Languages switched on (only those the plan includes). */
  locales: MenuLocale[];
  /** The "20+ Sprachen" add-on (or the trial): every language may be switched on. */
  allLanguages: boolean;
  sections: EditorSection[];
  items: EditorItem[];
  /** The venue's separate menus (lunch, dinner…); empty = one menu for everything. */
  menus: { id: string; name: string }[];
  /** The "Karten" card, rendered on the server page. */
  menusSlot: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  // The dish being switched off: the sheet asks "today" or "until I switch it on".
  const [asking, setAsking] = useState<EditorItem | null>(null);
  const [editing, setEditing] = useState<EditorSection | null>(null);
  const [newSection, setNewSection] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  // Photos added from the list show at once, before the page data comes back.
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const stateOf = (it: EditorItem): Availability => availability[it.id] ?? availabilityOf(it);
  const isAvailable = (it: EditorItem) => stateOf(it) === "on";
  const unknownAllergens = items.filter((it) => parseAllergens(it.allergens) === null).length;
  const soldOut = items.filter((it) => !isAvailable(it)).length;
  const canSearch = items.length >= SEARCH_MIN_ITEMS;
  const tokens = foldForSearch(query).split(" ").filter(Boolean);
  const matchesQuery = (it: EditorItem) => tokens.length === 0 || tokens.every((t) => foldForSearch(it.name).includes(t));

  function toggleCollapsed(id: string) {
    setCollapsed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onFail?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { setError(res.error ?? "Fehler."); onFail?.(); }
      router.refresh();
    });
  }

  function setState(it: EditorItem, next: Availability) {
    const before = stateOf(it);
    // Shown at once; rolled back if the server says no.
    setAvailability((a) => ({ ...a, [it.id]: next }));
    run(() => setAvailable(slug, it.id, next === "on", next === "today" ? "today" : "open"), () => setAvailability((a) => ({ ...a, [it.id]: before })));
  }

  // Switching on is one tap; switching off asks for how long.
  function toggle(it: EditorItem) {
    if (isAvailable(it)) setAsking(it);
    else setState(it, "on");
  }

  function toggleLocale(l: MenuLocale) {
    const next = locales.includes(l) ? locales.filter((x) => x !== l) : [...locales, l];
    run(() => setLocales(slug, next));
  }

  const asideCards = (
    <>
      <section className={`${panel} p-5`}>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A5C14]">Sprachen</p>
        <p className="mt-1 text-base text-onyx/65">Deutsch ist immer an. Die Zahl zeigt, wie viele Gerichte übersetzt sind.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(allLanguages ? MENU_LOCALES : PACKAGE_LOCALES).map((l) => {
            const on = locales.includes(l);
            const done = items.filter((it) => it.translations?.[l]?.name).length;
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                disabled={pending}
                onClick={() => toggleLocale(l)}
                className={`min-h-11 rounded-full px-4 text-base ring-1 transition ${on ? "bg-onyx text-parchment ring-onyx" : "bg-white text-onyx ring-onyx/20"}`}
              >
                {LOCALE_NAMES[l]}
                {on && items.length > 0 && <span className="ml-1.5 text-sm opacity-70">{done}/{items.length}</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-base text-onyx/65">
          Wir übersetzen Ihre Karte für Sie, auch in weitere Sprachen.{" "}
          <a href={whatsappUrl("Guten Tag, bitte übersetzen Sie meine Speisekarte.")} target="_blank" rel="noreferrer" className="font-semibold text-onyx underline underline-offset-4">Anfragen</a>
        </p>
      </section>

      <section className={panel}>
        <a href={`/app/${slug}/speisekarte/pdf`} target="_blank" rel="noopener" className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 active:bg-onyx/5">
          <span>
            <span className="block text-[17px] font-semibold leading-snug">Karte drucken</span>
            <span className="block text-base leading-snug text-onyx/60">PDF in A4, mit Allergenen und QR-Code</span>
          </span>
          <span aria-hidden className="text-xl text-onyx/40">↗</span>
        </a>
        <Link href={`/app/${slug}/druck`} className="flex min-h-16 items-center justify-between gap-3 border-t border-onyx/10 px-5 py-3 active:bg-onyx/5">
          <span>
            <span className="block text-[17px] font-semibold leading-snug">Druck-Design</span>
            <span className="block text-base leading-snug text-onyx/60">Ihre Farben, Ihr Logo, andere Sprachen</span>
          </span>
          <span aria-hidden className="text-xl text-onyx/40">›</span>
        </Link>
      </section>

      {menusSlot}
    </>
  );

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-base text-onyx/70">
          <span>{sections.length} {sections.length === 1 ? "Bereich" : "Bereiche"} · {items.length} {items.length === 1 ? "Gericht" : "Gerichte"}</span>
          {soldOut > 0 && <span className="font-medium text-red-700">{soldOut} ausverkauft</span>}
          <a href={`/${slug}`} target="_blank" rel="noreferrer" className="ml-auto font-medium underline">Als Gast ansehen</a>
        </div>
      )}

      {items.some((it) => !(photos[it.id] ?? it.image_url)) && (
        <p className="px-1 text-base text-onyx/70">
          Fotos: einfach auf das Kamerafeld beim Gericht tippen.{" "}
          <a href={whatsappUrl("Guten Tag, ich möchte Fotos meiner Gerichte für die Karte schicken.")} target="_blank" rel="noreferrer" className="font-semibold text-onyx underline underline-offset-4">
            Zu aufwendig? Schicken Sie uns Ihre Fotos.
          </a>
        </p>
      )}

      {canSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gericht suchen"
          aria-label="Gericht suchen"
          className="w-full rounded-2xl border border-onyx/15 bg-white px-4 py-3.5 text-lg outline-none placeholder:text-onyx/45 focus:border-onyx"
        />
      )}

      {unknownAllergens > 0 && items.length > 0 && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-base leading-snug text-amber-950 ring-1 ring-amber-200">
          <strong className="font-semibold">{unknownAllergens} {unknownAllergens === 1 ? "Gericht" : "Gerichte"} ohne Allergene.</strong>{" "}
          Gäste sehen dort „bitte nachfragen“. Tippen Sie ein Gericht an, um sie einzutragen.
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {sections.map((s, si) => {
        const all = items.filter((it) => it.section_id === s.id).sort((a, b) => a.position - b.position);
        const list = all.filter(matchesQuery);
        // While searching, sections without a hit step aside; the rest open up.
        if (tokens.length > 0 && list.length === 0) return null;
        const isCollapsed = tokens.length === 0 && collapsed.has(s.id);
        return (
          <section key={s.id} className={panel}>
            <header className="flex items-center gap-1 border-b border-onyx/10 py-3 pl-4 pr-2">
              <button
                type="button"
                onClick={() => toggleCollapsed(s.id)}
                aria-expanded={!isCollapsed}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span aria-hidden className={`shrink-0 text-xl text-onyx/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}>›</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[26px] font-medium leading-tight">{s.name}</span>
                  <span className="block text-sm text-onyx/60">{all.length} {all.length === 1 ? "Gericht" : "Gerichte"}</span>
                </span>
              </button>
              <div className="min-w-0">
                {menus.length > 0 && (
                  <select
                    aria-label={`Karte für ${s.name}`}
                    disabled={pending}
                    value={s.menu_id ?? ""}
                    onChange={(e) => run(() => setSectionMenu(slug, s.id, e.target.value || null))}
                    className="mt-1.5 max-w-full rounded-lg border border-onyx/20 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">In allen Karten</option>
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>Nur: {m.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <button type="button" aria-label="Bereich nach oben" disabled={pending || si === 0} onClick={() => run(() => moveSection(slug, s.id, -1))} className="h-11 w-9 rounded-lg text-lg text-onyx/55 hover:bg-onyx/5 disabled:opacity-25">↑</button>
              <button type="button" aria-label="Bereich nach unten" disabled={pending || si === sections.length - 1} onClick={() => run(() => moveSection(slug, s.id, 1))} className="h-11 w-9 rounded-lg text-lg text-onyx/55 hover:bg-onyx/5 disabled:opacity-25">↓</button>
              <button type="button" onClick={() => setEditing(s)} className="min-h-11 rounded-lg px-2.5 text-base font-medium text-onyx/75 hover:bg-onyx/5">Ändern</button>
            </header>

            {!isCollapsed && (<>
            <ul className="divide-y divide-onyx/10">
              {list.map((it) => {
                const allergens = parseAllergens(it.allergens);
                const diet = parseDiet(it.diet_tags);
                const on = isAvailable(it);
                return (
                  <li key={it.id} id={`item-${it.id}`} className="flex items-center gap-3 px-4 py-3.5">
                    <RowPhoto
                      itemId={it.id}
                      name={it.name}
                      url={photos[it.id] ?? it.image_url}
                      href={`/app/${slug}/speisekarte/gericht/${it.id}`}
                      onUploaded={(url) => { setPhotos((p) => ({ ...p, [it.id]: url })); router.refresh(); }}
                    />
                    <Link href={`/app/${slug}/speisekarte/gericht/${it.id}`} className="min-w-0 flex-1 py-1">
                      <span className={`block text-[17px] font-semibold leading-snug ${on ? "" : "text-onyx/40 line-through"}`}>{it.name}</span>
                      <span className="mt-0.5 block truncate text-base">
                        <span className="font-medium text-[#7A5C14]">{priceSummary(it, currency)}</span>
                        <span className="text-onyx/60">
                          {allergens && allergens.length > 0 && ` · ${allergens.join(" ")}`}
                          {diet.has("vegan") ? " · vegan" : diet.has("vegetarisch") ? " · vegetarisch" : ""}
                        </span>
                      </span>
                      {allergens === null && <span className="block text-sm text-amber-700">Allergene fehlen</span>}
                    </Link>
                    <span className="flex shrink-0 flex-col items-center gap-1">
                      <Switch on={on} onChange={() => toggle(it)} label={on ? `${it.name}: verfügbar` : `${it.name}: ausverkauft`} />
                      <span className={`text-xs ${on ? "text-onyx/60" : "font-semibold text-red-700"}`}>{AVAILABILITY_LABEL[stateOf(it)]}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <Link href={`/app/${slug}/speisekarte/gericht/neu?bereich=${s.id}`} className="flex min-h-14 items-center gap-2 border-t border-onyx/10 px-4 text-[17px] font-semibold text-[#7A5C14] hover:bg-onyx/[0.03]">
              <span aria-hidden className="text-2xl leading-none">+</span> Gericht hinzufügen
            </Link>
            </>)}
          </section>
        );
      })}

      {tokens.length > 0 && items.filter(matchesQuery).length === 0 && (
        <p className="px-1 text-sm text-onyx/70">Kein Gericht passt zu „{query}“.</p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); const n = newSection; run(() => createSection(slug, n)); setNewSection(""); }}
        className={`${panel} flex gap-2 p-3`}
      >
        <input value={newSection} onChange={(e) => setNewSection(e.target.value)} maxLength={80} placeholder="Neuer Bereich, z. B. Desserts" aria-label="Neuer Bereich" className="min-w-0 flex-1 rounded-xl border border-onyx/20 px-3.5 py-3 text-lg outline-none placeholder:text-onyx/40 focus:border-onyx" />
        <button type="submit" disabled={pending || !newSection.trim()} className="min-h-12 shrink-0 rounded-xl bg-onyx px-5 text-base font-semibold text-parchment disabled:opacity-40">Hinzufügen</button>
      </form>

      <Link href={`/app/${slug}/start`} className={`${panel} flex min-h-16 items-center justify-between gap-3 px-5 py-3 active:bg-onyx/5`}>
        <span>
          <span className="block text-[17px] font-semibold leading-snug">Viele Gerichte auf einmal</span>
          <span className="block text-base leading-snug text-onyx/60">Text einfügen oder Datei hochladen</span>
        </span>
        <span aria-hidden className="text-xl text-onyx/40">›</span>
      </Link>

      {asideCards}

      {asking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${asking.name} ausschalten`}>
          <button type="button" aria-label="Schließen" className="absolute inset-0 bg-black/45" onClick={() => setAsking(null)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-3xl">
            <p className="font-display text-3xl font-medium leading-tight">{asking.name}</p>
            <p className="mt-1 text-base text-onyx/70">Gäste sehen das Gericht weiter, aber grau und als „nicht verfügbar“.</p>
            <button type="button" onClick={() => { setState(asking, "today"); setAsking(null); }} className="mt-5 flex min-h-16 w-full flex-col items-start justify-center rounded-2xl bg-onyx px-5 text-left text-parchment">
              <span className="text-lg font-semibold">Heute aus</span>
              <span className="text-sm text-parchment/75">Morgen früh ist es von selbst wieder da.</span>
            </button>
            <button type="button" onClick={() => { setState(asking, "open"); setAsking(null); }} className="mt-3 flex min-h-16 w-full flex-col items-start justify-center rounded-2xl px-5 text-left ring-1 ring-onyx/20">
              <span className="text-lg font-semibold">Aus, bis ich es einschalte</span>
              <span className="text-sm text-onyx/65">Zum Beispiel außerhalb der Saison.</span>
            </button>
            <button type="button" onClick={() => setAsking(null)} className="mt-2 min-h-12 w-full text-base font-medium text-onyx/70">Abbrechen</button>
          </div>
        </div>
      )}

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
