"use client";

import { useMemo, useState } from "react";
import { parseMenuText, linesToSections, type ParsedLine } from "@/lib/menu-parser";

// Paste a menu, check what the parser understood, fix rows by hand, save.
// Super admin only — the endpoint enforces that too.

type Props = { venueId: string; venueName: string; slug: string };

type Row = { kind: ParsedLine["kind"]; text: string; price: string; raw: string };

function toRows(lines: ParsedLine[]): Row[] {
  return lines.map((l) =>
    l.kind === "item"
      ? { kind: "item" as const, text: l.name, price: (l.priceCents / 100).toFixed(2).replace(".", ","), raw: l.raw }
      : l.kind === "section"
        ? { kind: "section" as const, text: l.name, price: "", raw: l.raw }
        : { kind: "description" as const, text: l.text, price: "", raw: l.raw },
  );
}

function rowsToLines(rows: Row[]): ParsedLine[] {
  return rows.flatMap((r): ParsedLine[] => {
    if (r.kind === "item") {
      const cents = Math.round(Number(r.price.replace(",", ".")) * 100);
      if (!Number.isFinite(cents) || cents < 0) return [];
      return [{ kind: "item", name: r.text, priceCents: cents, raw: r.raw }];
    }
    if (r.kind === "section") return [{ kind: "section", name: r.text, raw: r.raw }];
    return [{ kind: "description", text: r.text, raw: r.raw }];
  });
}

const KINDS: { id: ParsedLine["kind"]; label: string }[] = [
  { id: "section", label: "Bereich" },
  { id: "item", label: "Gericht" },
  { id: "description", label: "Beschreibung" },
];

export function MenuImport({ venueId, venueName, slug }: Props) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const sections = useMemo(() => (rows ? linesToSections(rowsToLines(rows)) : []), [rows]);
  const itemCount = sections.reduce((n, s) => n + s.items.length, 0);

  function analyse() {
    setRows(toRows(parseMenuText(text)));
    setStatus("idle");
    setMessage("");
  }

  function patch(i: number, next: Partial<Row>) {
    setRows((prev) => (prev ? prev.map((r, k) => (k === i ? { ...r, ...next } : r)) : prev));
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/menu-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ venueId, sections }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setStatus("done");
      setMessage(`${json.createdItems} Gerichte in ${json.createdSections} neuen Bereichen angelegt.`);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Fehler beim Speichern.");
    }
  }

  const input =
    "w-full border border-onyx/15 bg-transparent px-3 py-2 font-sans text-sm outline-none focus:border-gold transition-colors";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Menü importieren</h1>
        <p className="font-sans text-sm mt-2 text-onyx/50">
          {venueName} · fügt hinzu, löscht nie. Fotos und Übersetzungen bleiben unberührt.
        </p>
      </div>

      <div>
        <label className="font-sans text-[10px] tracking-regal uppercase text-onyx/40">
          Menütext einfügen
        </label>
        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"VORSPEISEN\nRindsuppe mit Frittaten 4,90\nSUPPEN\n…"}
          className={input + " mt-2 resize-y leading-relaxed font-mono"}
        />
        <div className="flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={analyse}
            disabled={text.trim() === ""}
            className="font-sans text-[11px] tracking-regal uppercase px-5 py-3 bg-onyx text-parchment disabled:opacity-30"
          >
            Analysieren
          </button>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[10px] tracking-regal uppercase text-onyx/45 hover:text-gold"
          >
            Aktuelles Menü ansehen ↗
          </a>
        </div>
      </div>

      {rows && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="font-sans text-sm tracking-regal uppercase text-gold">Prüfen</h2>
            <span className="font-sans text-xs text-onyx/45">
              {sections.length} Bereiche · {itemCount} Gerichte
            </span>
          </div>

          <ul className="border border-onyx/10 divide-y divide-onyx/10">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2 flex-wrap">
                <select
                  value={r.kind}
                  onChange={(e) => patch(i, { kind: e.target.value as ParsedLine["kind"] })}
                  className="border border-onyx/15 bg-transparent px-2 py-1.5 font-sans text-xs outline-none shrink-0"
                >
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={r.text}
                  onChange={(e) => patch(i, { text: e.target.value })}
                  className={input + " flex-1 min-w-[200px] py-1.5"}
                  style={r.kind === "section" ? { fontWeight: 600 } : undefined}
                />
                {r.kind === "item" && (
                  <input
                    type="text"
                    value={r.price}
                    onChange={(e) => patch(i, { price: e.target.value })}
                    className={input + " w-24 py-1.5 text-right tabular-nums"}
                    aria-label="Preis"
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={save}
              disabled={status === "saving" || itemCount === 0}
              className="font-sans text-[11px] tracking-regal uppercase px-5 py-3 bg-gold text-onyx disabled:opacity-30"
            >
              {status === "saving" ? "Wird gespeichert …" : `${itemCount} Gerichte übernehmen`}
            </button>
            {message && (
              <span
                className="font-sans text-sm"
                style={{ color: status === "error" ? "#B3261E" : "#1D6E3A" }}
              >
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
