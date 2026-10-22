"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATES, type PrintDesign, type Template } from "@/lib/print/design";
import { placeSection, resetSheets, saveDesign, shiftSheet } from "./actions";

export type SheetView = {
  id: string;
  index: number;
  virtual: boolean;
  status: "neu" | "geaendert" | "aktuell";
  /** Day this sheet last changed, written out. */
  stand: string;
  printed: string | null;
  pagesNeeded: number;
  sections: { id: string; name: string; items: number }[];
};

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-stone-200";
const btn = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium";
const btnDark = `${btn} bg-stone-900 text-white disabled:opacity-40`;
const btnLight = `${btn} ring-1 ring-stone-300 disabled:opacity-40`;

const STATUS: Record<SheetView["status"], { label: string; cls: string }> = {
  neu: { label: "Noch nie gedruckt", cls: "bg-sky-100 text-sky-900" },
  geaendert: { label: "Geändert seit dem Druck", cls: "bg-amber-100 text-amber-900" },
  aktuell: { label: "Aktuell gedruckt", cls: "bg-emerald-100 text-emerald-900" },
};

/** A tiny drawing of what each look does to a section title. */
function Thumb({ template, accent }: { template: Template; accent: string }) {
  const line = <div className="h-1 w-full rounded-sm bg-stone-300" />;
  return (
    <div className="flex h-24 w-full flex-col justify-center gap-1.5 border border-stone-200 bg-white px-3">
      {template === "klassisch" && (
        <>
          <div className="mx-auto h-1.5 w-12 bg-stone-800" />
          <div className="mx-auto h-0.5 w-5" style={{ backgroundColor: accent }} />
        </>
      )}
      {template === "elegant" && (
        <>
          <div className="h-px w-full" style={{ backgroundColor: accent }} />
          <div className="mx-auto h-1.5 w-12" style={{ backgroundColor: accent }} />
          <div className="h-px w-full" style={{ backgroundColor: accent }} />
        </>
      )}
      {template === "modern" && (
        <>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1" style={{ backgroundColor: accent }} />
            <div className="h-1.5 w-14" style={{ backgroundColor: accent }} />
          </div>
          <div className="h-px w-full bg-stone-300" />
        </>
      )}
      {line}
      {line}
    </div>
  );
}

export function DruckEditor({
  slug,
  locale,
  languages,
  design,
  accent,
  venueColor,
  swatches,
  sheets,
}: {
  slug: string;
  locale: string;
  languages: { id: string; name: string }[];
  design: PrintDesign;
  accent: string;
  venueColor: string | null;
  swatches: string[];
  sheets: SheetView[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [template, setTemplate] = useState<Template>(design.template);
  const [chosen, setChosen] = useState(accent.toUpperCase());
  const [showQr, setShowQr] = useState(design.showQr);
  const [showAbout, setShowAbout] = useState(design.showAbout);
  const follows = venueColor && chosen === venueColor.toUpperCase();
  const dirty = template !== design.template || chosen !== accent.toUpperCase() || showQr !== design.showQr || showAbout !== design.showAbout;

  const lang = locale === "de" ? "" : `&lang=${locale}`;
  const pdf = (pages: string, extra = "") => `/app/${slug}/druck/pdf?pages=${pages}${lang}${extra}`;
  const changed = sheets.filter((s) => s.status !== "aktuell");
  const realSheets = sheets.filter((s) => !s.virtual);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, done?: string) {
    setMessage(null);
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? done ?? null : res.error ?? "Fehler.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className={`${card} p-5`}>
        <h1 className="text-xl font-semibold">Druck-Design</h1>
        <p className="mt-1 text-sm text-stone-600">
          Ihre Karte in Ihrem Stil, Blatt für Blatt. Auf jedem Blatt steht ein Datum („Stand“): So sehen Sie am Blatt in der Mappe, ob es noch zur Karte passt.
          Ändern Sie ein Gericht, müssen Sie nur dieses Blatt neu drucken.
        </p>
        {languages.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {languages.map((l) => (
              <Link
                key={l.id}
                href={l.id === "de" ? `/app/${slug}/druck` : `/app/${slug}/druck?lang=${l.id}`}
                className={`rounded-full px-3.5 py-2 text-sm ring-1 ${l.id === locale ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300"}`}
              >
                {l.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Sheets ── */}
      <section className={`${card} p-5`}>
        <p className="font-semibold">Blätter</p>
        <p className="mt-0.5 text-sm text-stone-600">
          {realSheets.length} {realSheets.length === 1 ? "Blatt" : "Blätter"}
          {changed.length > 0 ? ` · ${changed.length} zu drucken` : " · alles aktuell gedruckt"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={pdf("changed")} target="_blank" rel="noopener" aria-disabled={changed.length === 0} className={`${btnDark} ${changed.length === 0 ? "pointer-events-none opacity-40" : ""}`}>
            Zu druckende Blätter ({changed.length})
          </a>
          <a href={pdf("all")} target="_blank" rel="noopener" className={btnLight}>Ganze Karte</a>
        </div>
        <p className="mt-2 text-xs text-stone-500">Ein Blatt gilt als gedruckt, sobald Sie sein PDF öffnen. „Vorschau“ zählt nicht.</p>

        <ul className="mt-4 space-y-3">
          {sheets.map((s, i) => {
            const st = STATUS[s.status];
            return (
              <li key={s.id} className="rounded-xl p-4 ring-1 ring-stone-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{s.virtual ? "Neue Bereiche" : `Blatt ${s.index}`}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-0.5 text-sm text-stone-600">
                  Stand {s.stand}
                  {s.printed && s.status !== "neu" ? ` · gedruckt am ${s.printed}` : ""}
                </p>
                {s.virtual && <p className="mt-1 text-sm text-amber-800">Diese Bereiche sind noch keinem Blatt zugeordnet. Sie stehen hier, damit nichts im Druck fehlt.</p>}
                {s.pagesNeeded > 1 && (
                  <p className="mt-1 text-sm font-medium text-red-700">Zu voll: dieses Blatt läuft auf {s.pagesNeeded} Seiten. Schieben Sie einen Bereich auf ein anderes Blatt.</p>
                )}

                <ul className="mt-3 space-y-2">
                  {s.sections.map((sec) => (
                    <li key={sec.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm">
                        {sec.name} <span className="text-stone-500">· {sec.items}</span>
                      </span>
                      <select
                        aria-label={`${sec.name} auf Blatt`}
                        disabled={pending}
                        value={s.virtual ? "" : s.id}
                        onChange={(e) => e.target.value && run(() => placeSection(slug, sec.id, e.target.value))}
                        className="shrink-0 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
                      >
                        {s.virtual && <option value="">Blatt wählen …</option>}
                        {realSheets.map((o) => (
                          <option key={o.id} value={o.id}>Blatt {o.index}</option>
                        ))}
                        <option value="new">Neues Blatt</option>
                      </select>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={pdf(s.id)} target="_blank" rel="noopener" className={btnDark}>PDF öffnen</a>
                  <a href={pdf(s.id, "&preview=1")} target="_blank" rel="noopener" className={btnLight}>Vorschau</a>
                  {!s.virtual && (
                    <>
                      <button type="button" disabled={pending || i === 0} onClick={() => run(() => shiftSheet(slug, s.id, -1))} className={btnLight} aria-label="Blatt nach vorn">↑</button>
                      <button type="button" disabled={pending || i >= realSheets.length - 1} onClick={() => run(() => shiftSheet(slug, s.id, 1))} className={btnLight} aria-label="Blatt nach hinten">↓</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          disabled={pending}
          onClick={() => { if (confirm("Die Blätter neu aufteilen? Ihre Zuordnung geht verloren, und die meisten Blätter gelten danach als geändert.")) run(() => resetSheets(slug), "Blätter neu aufgeteilt."); }}
          className={`${btnLight} mt-4`}
        >
          Blätter automatisch neu aufteilen
        </button>
      </section>

      {/* ── Look ── */}
      <section className={`${card} p-5`}>
        <p className="font-semibold">Aussehen</p>
        <p className="mt-0.5 text-sm text-stone-600">Das Blatt bleibt weiß. Ihre Farbe setzt Akzente (Linien, Titel), so druckt es auch auf dem Bürodrucker sauber.</p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={template === t.id}
              onClick={() => setTemplate(t.id)}
              className={`p-2 text-left ring-2 ${template === t.id ? "ring-stone-900" : "ring-transparent hover:ring-stone-200"}`}
            >
              <Thumb template={t.id} accent={chosen} />
              <p className="mt-1.5 text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-stone-500">{t.blurb}</p>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium">Farbe</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              title={venueColor && c === venueColor.toUpperCase() ? "Farbe Ihrer digitalen Karte" : c}
              aria-label={`Farbe ${c}`}
              aria-pressed={chosen === c}
              onClick={() => setChosen(c)}
              className={`h-10 w-10 border ${chosen === c ? "ring-2 ring-stone-900 ring-offset-2" : "border-stone-300"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {follows && <p className="mt-1 text-xs text-stone-500">Das ist die Farbe Ihrer digitalen Karte. Ändern Sie sie dort, ändert sich der Druck mit.</p>}

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="h-5 w-5" />
            QR-Code zur Online-Karte unten auf jedem Blatt
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={showAbout} onChange={(e) => setShowAbout(e.target.checked)} className="h-5 w-5" />
            Ihren Text unter dem Logo auf dem ersten Blatt
          </label>
        </div>

        <p className="mt-4 text-xs text-stone-500">Das Logo steht oben in der Mitte, wie in Ihrer digitalen Karte. Eine Änderung am Aussehen betrifft alle Blätter: Sie gelten danach als geändert.</p>
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() => run(() => saveDesign(slug, { template, accent: follows ? null : chosen, showQr, showAbout }), "Gespeichert.")}
          className={`${btnDark} mt-3`}
        >
          Aussehen speichern
        </button>
      </section>

      {message && <p role="status" className="text-sm text-stone-700">{message}</p>}
    </div>
  );
}
