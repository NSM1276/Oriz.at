"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLOR_PRESETS } from "@/lib/colorPresets";
import { whatsappUrl } from "@/lib/contact-info";
import { linesToImport, parseMenuText, type ImportResult } from "@/lib/menu-parser";
import { TABLE_TEMPLATE, parseMenuTable, rowsToText } from "@/lib/menu-table";
import { readXlsxRows } from "@/lib/xlsx-read";
import { addTables } from "../tische/actions";
import { importMenuTable, importMenuText, saveStyle } from "./actions";

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
        className="flex-1 rounded-xl bg-onyx py-3 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Wird gespeichert…" : primary}
      </button>
      <Link href={skipHref} className="rounded-xl px-4 py-3 text-base font-medium text-onyx/70">
        {skipLabel}
      </Link>
    </div>
  );
}

type Mode = "choose" | "text" | "file";

const tile = "block w-full rounded-2xl bg-white p-5 text-left ring-1 ring-onyx/10 active:bg-onyx/5";
const tileTitle = "block text-xl font-semibold leading-snug";
const tileText = "mt-1 block text-base leading-snug text-onyx/65";

/** What will be saved, exactly as it will appear: shared by pasted text and uploaded tables. */
function ImportPreview({ result }: { result: ImportResult }) {
  const { sections, skipped } = result;
  const itemCount = sections.reduce((n, s) => n + s.items.length, 0);
  return (
    <>
      {itemCount > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-onyx/10">
          <p className="text-lg font-semibold">
            {itemCount} {itemCount === 1 ? "Gericht" : "Gerichte"} in {sections.length} {sections.length === 1 ? "Bereich" : "Bereichen"}
          </p>
          <div className="mt-3 max-h-80 space-y-4 overflow-y-auto">
            {sections.map((s, i) => (
              <div key={i}>
                <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#7A5C14]">{s.name}</p>
                <ul className="mt-1 divide-y divide-onyx/10">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex justify-between gap-3 py-2 text-base">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{it.name}</span>
                        {it.description && <span className="block truncate text-base text-onyx/60">{it.description}</span>}
                        {(it.allergens || it.diet.length > 0) && (
                          <span className="block text-base text-onyx/60">
                            {it.allergens && `Allergene ${it.allergens}`}
                            {it.allergens && it.diet.length > 0 && " · "}
                            {it.diet[0]}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        {it.variants.length > 0
                          ? it.variants.map((v) => (
                              <span key={v.label} className="block">
                                <span className="text-base text-onyx/60">{v.label}</span> {euro.format(v.price_cents / 100)}
                              </span>
                            ))
                          : it.priceless
                            ? <span className="text-base text-onyx/60">ohne Preis</span>
                            : euro.format(it.price_cents / 100)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {skipped.length > 0 && (
        <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-base text-amber-950 ring-1 ring-amber-200">
          <p className="font-semibold">Nicht übernommen:</p>
          <ul className="mt-1 list-disc pl-5">
            {skipped.slice(0, 12).map((line, i) => <li key={i}>{line}</li>)}
            {skipped.length > 12 && <li>… und {skipped.length - 12} weitere</li>}
          </ul>
        </div>
      )}
    </>
  );
}

const EMPTY: ImportResult = { sections: [], skipped: [] };

export function MenuStep({ slug, venueName, existingItems, nextHref }: { slug: string; venueName: string; existingItems: number; nextHref: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [text, setText] = useState("");
  const [table, setTable] = useState<{ name: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const result = useMemo<ImportResult>(
    () => (mode === "text" ? linesToImport(parseMenuText(text)) : mode === "file" && table ? parseMenuTable(table.text) : EMPTY),
    [mode, text, table],
  );
  const itemCount = result.sections.reduce((n, s) => n + s.items.length, 0);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const isExcel = /\.xlsx$/i.test(file.name);
      if (/\.xls$/i.test(file.name)) throw new Error("Bitte in Excel als .xlsx oder .csv speichern und noch einmal hochladen.");
      if (!isExcel && file.size > 1024 * 1024) throw new Error("Die Datei ist zu groß (höchstens 1 MB).");
      setTable({ name: file.name, text: isExcel ? rowsToText(await readXlsxRows(file)) : await file.text() });
    } catch (err) {
      setTable(null);
      setError(err instanceof Error ? err.message : "Die Datei lässt sich nicht lesen.");
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = mode === "file" ? await importMenuTable(slug, table?.text ?? "") : await importMenuText(slug, text);
      if (res.ok) router.push(nextHref);
      else setError(res.error);
    });
  }

  if (mode === "choose") {
    return (
      <div className="space-y-3">
        {existingItems > 0 && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base text-emerald-900 ring-1 ring-emerald-200">
            Ihre Karte hat schon {existingItems} {existingItems === 1 ? "Gericht" : "Gerichte"}. Neue kommen dazu.
          </p>
        )}
        <button type="button" onClick={() => setMode("text")} className={tile}>
          <span className="mb-2 inline-block rounded-full bg-gold px-2.5 py-0.5 text-base font-semibold text-onyx">Empfohlen</span>
          <span className={tileTitle}>Text einfügen</span>
          <span className={tileText}>Karte aus Word, PDF oder von Ihrer Website kopieren und einfügen.</span>
        </button>
        <button type="button" onClick={() => setMode("file")} className={tile}>
          <span className={tileTitle}>Datei hochladen</span>
          <span className={tileText}>Excel oder CSV, eine Zeile pro Gericht.</span>
        </button>
        <a href={whatsappUrl(`Guten Tag, bitte tragen Sie die Speisekarte für „${venueName}“ ein. Ich schicke sie Ihnen gleich als Foto oder PDF.`)} target="_blank" rel="noreferrer" className={tile}>
          <span className={tileTitle}>Wir tragen sie ein</span>
          <span className={tileText}>Foto oder PDF per WhatsApp schicken. Den Preis nennen wir Ihnen vorher.</span>
        </a>
        <Link href={existingItems > 0 ? nextHref : `/app/${slug}/speisekarte`} className="block py-3 text-center text-base font-medium text-onyx/70 underline underline-offset-4">
          {existingItems > 0 ? "Weiter" : "Einzeln selbst eintragen"}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <button type="button" onClick={() => { setMode("choose"); setError(null); }} className="mb-3 text-base font-medium text-onyx/70">‹ Andere Möglichkeit</button>

      {mode === "text" ? (
        <>
          <p className="mb-2 text-base text-onyx/70">Überschriften werden Bereiche, Zeilen mit Preis werden Gerichte.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE}
            rows={12}
            aria-label="Text der Speisekarte"
            className="w-full rounded-2xl border border-onyx/20 bg-white p-4 text-base leading-relaxed outline-none placeholder:text-onyx/35 focus:border-onyx"
          />
        </>
      ) : (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
          <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl bg-onyx px-5 text-lg font-semibold text-parchment">
            {table ? "Andere Datei wählen" : "Datei wählen"}
            <input type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={pickFile} className="hidden" />
          </label>
          {table && <p className="mt-3 truncate text-base text-onyx/70">{table.name}</p>}
          <p className="mt-4 text-base text-onyx/70">
            Spalten: Kategorie, Gericht, Beschreibung, Größe, Preis, Allergene.{" "}
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + TABLE_TEMPLATE)}`} download="oriz-speisekarte-vorlage.csv" className="font-semibold text-onyx underline underline-offset-4">
              Vorlage herunterladen
            </a>
          </p>
        </div>
      )}

      <ImportPreview result={result} />
      {itemCount > 0 && <p className="mt-3 text-base text-onyx/65">Fotos und fehlende Allergene ergänzen Sie danach in der Speisekarte.</p>}

      {error && <p role="alert" className="mt-3 text-base text-red-700">{error}</p>}
      <div className="mt-6">
        <button type="submit" disabled={pending || itemCount === 0} className="min-h-14 w-full rounded-xl bg-gold text-lg font-semibold text-onyx disabled:opacity-40">
          {pending ? "Wird gespeichert…" : itemCount > 0 ? `${itemCount} ${itemCount === 1 ? "Gericht" : "Gerichte"} übernehmen` : "Übernehmen"}
        </button>
      </div>
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
        <legend className="text-base font-medium">Darstellung</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => setTheme(t.id)}
              className={`rounded-xl p-3 text-left ring-1 transition ${
                theme === t.id ? "bg-onyx text-white ring-onyx" : "bg-white ring-onyx/10"
              }`}
            >
              <span className="block text-base font-medium">{t.label}</span>
              <span className={`block text-sm ${theme === t.id ? "text-parchment/70" : "text-onyx/60"}`}>{t.text}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-base font-medium">Farben</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {custom && (
            <button
              type="button"
              aria-pressed={presetId === "custom"}
              aria-label="Aktuelle Farben"
              onClick={() => setPresetId("custom")}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 ring-2 transition ${presetId === "custom" ? "ring-onyx" : "ring-transparent"}`}
            >
              <span className="relative block h-10 w-full rounded-lg ring-1 ring-black/10" style={{ background: custom.bg }}>
                <span className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full" style={{ background: custom.primary }} />
              </span>
              <span className="text-xs text-onyx/70">Aktuell</span>
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
                presetId === p.id ? "ring-onyx" : "ring-transparent"
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
              <span className="text-xs text-onyx/70">{p.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-base font-medium">Vorschau</p>
          <button type="button" onClick={() => save()} disabled={pending} className="text-base font-medium text-onyx/70 underline">
            Vorschau aktualisieren
          </button>
        </div>
        <div className="mx-auto mt-2 h-[480px] w-full max-w-[300px] overflow-hidden rounded-[28px] border-[6px] border-onyx bg-white shadow-lg">
          <iframe key={previewKey} src={`/${slug}`} title="Vorschau" className="h-full w-full" />
        </div>
      </div>

      {error && <p className="mt-3 text-base text-red-700">{error}</p>}
      {settings ? (
        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-onyx py-3 font-medium text-white disabled:opacity-50">
            {pending ? "Wird gespeichert…" : "Speichern"}
          </button>
          {saved && <span className="text-base text-emerald-700">Gespeichert.</span>}
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
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-base text-emerald-900 ring-1 ring-emerald-200">
          Sie haben schon {existingTables} Tische angelegt.
        </p>
      )}
      <label className="block rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
        <span className="text-base font-medium">Wie viele Tische haben Sie?</span>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="Weniger"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="h-12 w-12 rounded-xl bg-onyx/5 text-xl"
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
            className="h-12 w-20 rounded-xl border border-onyx/20 text-center text-xl tabular-nums outline-none focus:border-onyx"
          />
          <button
            type="button"
            aria-label="Mehr"
            onClick={() => setCount((c) => Math.min(100, c + 1))}
            className="h-12 w-12 rounded-xl bg-onyx/5 text-xl"
          >
            +
          </button>
        </div>
        <span className="mt-3 block text-sm text-onyx/60">
          {existingTables === 0 ? `Sie bekommen Tisch 1 bis ${Math.max(count, 1)}. ` : "Die neuen Tische werden weiter nummeriert. "}
          Namen wie „Bar“ oder Bereiche wie „Terrasse“ legen Sie später unter „Tische“ an.
        </span>
      </label>

      {error && <p className="mt-3 text-base text-red-700">{error}</p>}
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
