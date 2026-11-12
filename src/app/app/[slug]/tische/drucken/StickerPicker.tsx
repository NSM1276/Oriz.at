"use client";

import { useMemo, useState } from "react";
import { tableDisplayName } from "@/lib/tables";

// Which table stickers to print, how many of each, and how big. What is shown under the
// controls is exactly what comes out of the printer: whole A4 sheets, one per page.

export type StickerTable = { id: string; label: string; zone: string | null; svg: string };

const SIZES = [
  { id: "klein", name: "Klein", hint: "12 pro Blatt", cols: 3, rows: 4, qr: 34, label: 5 },
  { id: "standard", name: "Standard", hint: "6 pro Blatt", cols: 2, rows: 3, qr: 50, label: 7 },
  { id: "gross", name: "Groß", hint: "2 pro Blatt", cols: 1, rows: 2, qr: 82, label: 11 },
] as const;
type Size = (typeof SIZES)[number];

const MAX_COPIES = 20;

export function StickerPicker({ venueName, tables, initialId }: { venueName: string; tables: StickerTable[]; initialId: string | null }) {
  // 0 = not printed. Opened from one table's "QR-Code drucken": just that one; else all.
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(tables.map((t) => [t.id, initialId ? (t.id === initialId ? 1 : 0) : 1])),
  );
  const [sizeId, setSizeId] = useState<Size["id"]>("standard");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const size = SIZES.find((s) => s.id === sizeId)!;

  const zones = useMemo(() => [...new Set(tables.map((t) => t.zone ?? ""))], [tables]);
  const stickers = useMemo(() => tables.flatMap((t) => Array.from({ length: counts[t.id] ?? 0 }, () => t)), [tables, counts]);
  const perSheet = size.cols * size.rows;
  const sheets = useMemo(() => {
    const out: StickerTable[][] = [];
    for (let i = 0; i < stickers.length; i += perSheet) out.push(stickers.slice(i, i + perSheet));
    return out;
  }, [stickers, perSheet]);
  const selected = tables.filter((t) => (counts[t.id] ?? 0) > 0).length;

  const set = (id: string, n: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(MAX_COPIES, n)) }));
  const setAll = (n: number) => setCounts(Object.fromEntries(tables.map((t) => [t.id, n])));
  const copiesForSelected = (delta: number) =>
    setCounts((c) => Object.fromEntries(tables.map((t) => [t.id, c[t.id] > 0 ? Math.max(1, Math.min(MAX_COPIES, c[t.id] + delta)) : 0])));

  // "Tisch 3 bis 12": numbers only; named tables (Bar, Terrasse) are picked by hand.
  const lo = parseInt(from, 10);
  const hi = parseInt(to, 10);
  const rangeOk = Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi;
  function pickRange() {
    if (!rangeOk) return;
    setCounts(
      Object.fromEntries(
        tables.map((t) => {
          const n = parseInt(t.label, 10);
          return [t.id, /^\d+[a-z]?$/i.test(t.label) && n >= lo && n <= hi ? Math.max(1, counts[t.id] ?? 0) : 0];
        }),
      ),
    );
  }

  const chip = (active: boolean) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-stone-900 text-white" : "bg-white text-stone-800 ring-1 ring-stone-300"}`;

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 0; }
        .sheet { width: 210mm; height: 297mm; padding: 10mm; box-sizing: border-box; background: #fff; }
        @media screen {
          .sheet { zoom: 0.42; box-shadow: 0 2px 14px rgba(0,0,0,0.12); border-radius: 6px; }
          @media (min-width: 640px) { .sheet { zoom: 0.6; } }
        }
        @media print {
          html, body { background: #fff !important; }
          main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .sheet { break-after: page; }
          .sheet:last-child { break-after: auto; }
          .sheets { display: block !important; gap: 0 !important; margin: 0 !important; }
        }
      `}</style>

      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div>
            <p className="font-semibold">
              {stickers.length} Aufkleber · {sheets.length} {sheets.length === 1 ? "Blatt" : "Blätter"} A4
            </p>
            <p className="text-sm text-stone-600">
              {selected} von {tables.length} {tables.length === 1 ? "Tisch" : "Tischen"} ausgewählt
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={stickers.length === 0}
            className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Drucken
          </button>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Größe</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIZES.map((s) => (
              <button key={s.id} type="button" onClick={() => setSizeId(s.id)} className={`${chip(s.id === sizeId)} flex flex-col items-center py-2.5`}>
                <span>{s.name}</span>
                <span className={`text-xs font-normal ${s.id === sizeId ? "text-white/70" : "text-stone-500"}`}>{s.hint}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-widest text-stone-500">Auswahl</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setAll(1)} className={chip(false)}>Alle</button>
            <button type="button" onClick={() => setAll(0)} className={chip(false)}>Keine</button>
            <span className="ml-1 flex items-center gap-1.5 text-sm text-stone-600">
              Tisch
              <input value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="1" aria-label="Von Tisch" className="h-10 w-14 rounded-lg px-2 text-center ring-1 ring-stone-300" />
              bis
              <input value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="10" aria-label="Bis Tisch" className="h-10 w-14 rounded-lg px-2 text-center ring-1 ring-stone-300" />
              <button type="button" onClick={pickRange} disabled={!rangeOk} className={`${chip(false)} disabled:opacity-40`}>Wählen</button>
            </span>
          </div>
          {selected > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-600">
              Stück für alle ausgewählten:
              <Stepper onMinus={() => copiesForSelected(-1)} onPlus={() => copiesForSelected(1)} />
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-stone-200">
          {zones.map((zone) => (
            <div key={zone || "-"}>
              {zones.length > 1 && (
                <p className="border-b border-stone-100 px-4 pb-2 pt-4 text-xs font-medium uppercase tracking-widest text-stone-500">{zone || "Ohne Bereich"}</p>
              )}
              <ul className="divide-y divide-stone-100">
                {tables
                  .filter((t) => (t.zone ?? "") === zone)
                  .map((t) => {
                    const n = counts[t.id] ?? 0;
                    return (
                      <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                        <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                          <input type="checkbox" checked={n > 0} onChange={(e) => set(t.id, e.target.checked ? 1 : 0)} className="h-5 w-5 accent-stone-900" />
                          <span className={`font-medium ${n > 0 ? "" : "text-stone-400"}`}>{tableDisplayName(t.label)}</span>
                        </label>
                        <Stepper value={n} onMinus={() => set(t.id, n - 1)} onPlus={() => set(t.id, n + 1)} />
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>

        {sheets.length > 0 && <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Vorschau — so wird gedruckt</p>}
      </div>

      <div className="sheets mt-3 flex flex-wrap gap-4">
        {sheets.map((page, i) => (
          <div key={i} className="sheet">
            <div
              className="grid h-full"
              style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)`, gridTemplateRows: `repeat(${size.rows}, 1fr)`, gap: "5mm" }}
            >
              {page.map((t, j) => (
                <article
                  key={`${t.id}-${j}`}
                  className="flex flex-col items-center justify-center text-center text-black"
                  style={{ border: "0.3mm solid #c8c4bf", borderRadius: "4mm", padding: "4mm", overflow: "hidden" }}
                >
                  <p style={{ fontSize: `${size.label * 0.42}mm`, letterSpacing: "0.2em" }} className="font-medium uppercase text-stone-500">
                    {venueName}
                  </p>
                  <div style={{ width: `${size.qr}mm`, marginTop: "2mm" }} className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: t.svg }} />
                  <p style={{ fontSize: `${size.label}mm`, marginTop: "1.5mm", lineHeight: 1.1 }} className="font-semibold">
                    {tableDisplayName(t.label)}
                  </p>
                  <p style={{ fontSize: `${size.label * 0.38}mm`, marginTop: "1mm" }} className="text-stone-600">
                    Speisekarte &amp; Service · Menu &amp; service
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stepper({ value, onMinus, onPlus }: { value?: number; onMinus: () => void; onPlus: () => void }) {
  const btn = "grid h-10 w-10 place-items-center rounded-lg text-lg font-medium ring-1 ring-stone-300 active:bg-stone-100";
  return (
    <span className="flex items-center gap-1.5">
      <button type="button" onClick={onMinus} aria-label="Weniger" className={btn}>−</button>
      {value !== undefined && <span className="w-7 text-center tabular-nums">{value}</span>}
      <button type="button" onClick={onPlus} aria-label="Mehr" className={btn}>+</button>
    </span>
  );
}
