"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLOR_PRESETS } from "@/lib/colorPresets";
import { linesToSections, parseMenuText } from "@/lib/menu-parser";
import { addTables } from "../tische/actions";
import { importMenuText, saveStyle } from "./actions";

const euro = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

const EXAMPLE = `Vorspeisen
Bruschetta 7,50
Geröstetes Brot mit Tomaten und Basilikum
Vitello Tonnato 14,00

Hauptspeisen
Wiener Schnitzel 19,90
Mit Petersilkartoffeln und Preiselbeeren`;

function Actions({
  primary,
  pending,
  disabled,
  skipHref,
  skipLabel = "Überspringen",
}: {
  primary: string;
  pending: boolean;
  disabled?: boolean;
  skipHref: string;
  skipLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="submit"
        disabled={pending || disabled}
        className="flex-1 rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Wird gespeichert…" : primary}
      </button>
      <Link href={skipHref} className="rounded-xl px-4 py-3 text-sm font-medium text-stone-600">
        {skipLabel}
      </Link>
    </div>
  );
}

export function MenuStep({ slug, existingItems, nextHref }: { slug: string; existingItems: number; nextHref: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sections = useMemo(() => linesToSections(parseMenuText(text)), [text]);
  const itemCount = sections.reduce((n, s) => n + s.items.length, 0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await importMenuText(slug, text);
      if (res.ok) router.push(nextHref);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {existingItems > 0 && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Ihre Karte hat schon {existingItems} Gerichte. Neu eingefügte werden ergänzt.
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE}
        rows={12}
        className="w-full rounded-2xl border border-stone-300 bg-white p-4 font-mono text-sm leading-relaxed outline-none focus:border-stone-900"
      />

      {itemCount > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-medium">
            Erkannt: {sections.length} {sections.length === 1 ? "Bereich" : "Bereiche"}, {itemCount}{" "}
            {itemCount === 1 ? "Gericht" : "Gerichte"}
          </p>
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
            {sections.map((s, i) => (
              <div key={i}>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{s.name}</p>
                <ul className="mt-1 divide-y divide-stone-100">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex justify-between gap-3 py-1.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{it.name}</span>
                        {it.description && <span className="block truncate text-xs text-stone-500">{it.description}</span>}
                      </span>
                      <span className="shrink-0 tabular-nums">{euro.format(it.price_cents / 100)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">Fotos, Allergene und Übersetzungen ergänzen Sie danach in der Speisekarte.</p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <Actions
        primary="Übernehmen"
        pending={pending}
        disabled={itemCount === 0}
        skipHref={nextHref}
        skipLabel={existingItems > 0 ? "Weiter" : "Später"}
      />
    </form>
  );
}

const THEMES = [
  { id: "classic", label: "Klassisch", text: "Liste wie auf Papier" },
  { id: "visual", label: "Mit Fotos", text: "Große Bilder je Gericht" },
  { id: "modern", label: "Modern", text: "Karten, kompakt" },
];

export function StyleStep({
  slug,
  initialTheme,
  initialPreset,
  nextHref,
  settings = false,
  custom = null,
}: {
  slug: string;
  initialTheme: string;
  initialPreset: string;
  nextHref: string;
  /** On the settings page: save in place instead of moving to the next setup step. */
  settings?: boolean;
  /** Colours that match no preset (set by us earlier); offered as "Aktuell" so saving keeps them. */
  custom?: { bg: string; primary: string } | null;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [presetId, setPresetId] = useState(initialPreset);
  const [previewKey, setPreviewKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(then?: string) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveStyle(slug, { theme, presetId });
      if (!res.ok) { setError(res.error); return; }
      if (then) router.push(then);
      else { setPreviewKey((k) => k + 1); if (settings) setSaved(true); }
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(settings ? undefined : nextHref); }}>
      <fieldset>
        <legend className="text-sm font-medium">Darstellung</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => setTheme(t.id)}
              className={`rounded-xl p-3 text-left ring-1 transition ${
                theme === t.id ? "bg-stone-900 text-white ring-stone-900" : "bg-white ring-stone-200"
              }`}
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span className={`block text-xs ${theme === t.id ? "text-stone-300" : "text-stone-500"}`}>{t.text}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Farben</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {custom && (
            <button
              type="button"
              aria-pressed={presetId === "custom"}
              aria-label="Aktuelle Farben"
              onClick={() => setPresetId("custom")}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 ring-2 transition ${presetId === "custom" ? "ring-stone-900" : "ring-transparent"}`}
            >
              <span className="relative block h-10 w-full rounded-lg ring-1 ring-black/10" style={{ background: custom.bg }}>
                <span className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full" style={{ background: custom.primary }} />
              </span>
              <span className="text-[11px] text-stone-600">Aktuell</span>
            </button>
          )}
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={presetId === p.id}
              aria-label={p.label}
              onClick={() => setPresetId(p.id)}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 ring-2 transition ${
                presetId === p.id ? "ring-stone-900" : "ring-transparent"
              }`}
            >
              <span
                className="relative block h-10 w-full rounded-lg ring-1 ring-black/10"
                style={{ background: p.color_bg }}
              >
                <span
                  className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full"
                  style={{ background: p.color_primary }}
                />
              </span>
              <span className="text-[11px] text-stone-600">{p.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Vorschau</p>
          <button type="button" onClick={() => save()} disabled={pending} className="text-sm font-medium text-stone-600 underline">
            Vorschau aktualisieren
          </button>
        </div>
        <div className="mx-auto mt-2 h-[480px] w-full max-w-[300px] overflow-hidden rounded-[28px] border-[6px] border-stone-900 bg-white shadow-lg">
          <iframe key={previewKey} src={`/${slug}`} title="Vorschau" className="h-full w-full" />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {settings ? (
        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50">
            {pending ? "Wird gespeichert…" : "Speichern"}
          </button>
          {saved && <span className="text-sm text-emerald-700">Gespeichert.</span>}
        </div>
      ) : (
        <Actions primary="Speichern & weiter" pending={pending} skipHref={nextHref} />
      )}
    </form>
  );
}

export function TablesStep({ slug, existingTables, nextHref }: { slug: string; existingTables: number; nextHref: string }) {
  const router = useRouter();
  const [count, setCount] = useState(existingTables > 0 ? 0 : 10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addTables(slug, { count });
      if (res.ok) router.push(nextHref);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {existingTables > 0 && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Sie haben schon {existingTables} Tische angelegt.
        </p>
      )}
      <label className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <span className="text-sm font-medium">Wie viele Tische haben Sie?</span>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="Weniger"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="h-12 w-12 rounded-xl bg-stone-100 text-xl"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={count || ""}
            onChange={(e) => setCount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="h-12 w-20 rounded-xl border border-stone-300 text-center text-xl tabular-nums outline-none focus:border-stone-900"
          />
          <button
            type="button"
            aria-label="Mehr"
            onClick={() => setCount((c) => Math.min(100, c + 1))}
            className="h-12 w-12 rounded-xl bg-stone-100 text-xl"
          >
            +
          </button>
        </div>
        <span className="mt-3 block text-xs text-stone-500">
          {existingTables === 0 ? `Sie bekommen Tisch 1 bis ${Math.max(count, 1)}. ` : "Die neuen Tische werden weiter nummeriert. "}
          Namen wie „Bar“ oder Bereiche wie „Terrasse“ legen Sie später unter „Tische“ an.
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <Actions
        primary="Tische anlegen"
        pending={pending}
        disabled={count < 1}
        skipHref={nextHref}
        skipLabel={existingTables > 0 ? "Weiter" : "Später"}
      />
    </form>
  );
}
