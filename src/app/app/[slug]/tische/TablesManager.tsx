"use client";

import { useState, useTransition } from "react";
import { tableDisplayName } from "@/lib/tables";
import {
  addNamedTable,
  addTables,
  deleteTable,
  renewTableCode,
  updateTable,
  type ActionResult,
} from "./actions";

export type TableRow = {
  id: string;
  label: string;
  zone: string | null;
  code: string;
  is_active: boolean;
  position: number;
};

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-stone-200";
const input =
  "w-full rounded-xl border-0 bg-stone-100 px-3 py-2.5 text-base text-stone-900 outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-stone-900";
const primaryBtn =
  "rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const ghostBtn =
  "rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium text-stone-800 ring-1 ring-stone-200 disabled:opacity-50";

export function TablesManager({ slug, tables }: { slug: string; tables: TableRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) after?.();
      else setError(res.error);
    });
  }

  const zones = Array.from(new Set(tables.map((t) => t.zone ?? "")));
  const activeCount = tables.filter((t) => t.is_active).length;

  return (
    <div className="space-y-4">
      <AddTables slug={slug} empty={tables.length === 0} pending={pending} run={run} />

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {tables.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            {tables.length} {tables.length === 1 ? "Tisch" : "Tische"}
            {activeCount < tables.length && ` · ${tables.length - activeCount} ausgeschaltet`}
          </p>
          <a href={`/app/${slug}/tische/drucken`} target="_blank" rel="noreferrer" className={primaryBtn}>
            Alle QR-Codes drucken
          </a>
        </div>
      )}

      {zones.map((zone) => (
        <section key={zone || "-"}>
          {zones.length > 1 && (
            <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-widest text-stone-500">
              {zone || "Ohne Bereich"}
            </h2>
          )}
          <ul className={`${card} divide-y divide-stone-100 overflow-hidden`}>
            {tables
              .filter((t) => (t.zone ?? "") === zone)
              .map((t) => (
                <TableItem
                  key={t.id}
                  slug={slug}
                  table={t}
                  open={openId === t.id}
                  onToggle={() => setOpenId(openId === t.id ? null : t.id)}
                  pending={pending}
                  run={run}
                />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

type Run = (action: () => Promise<ActionResult>, after?: () => void) => void;

function AddTables({ slug, empty, pending, run }: { slug: string; empty: boolean; pending: boolean; run: Run }) {
  const [mode, setMode] = useState<"count" | "named">("count");
  const [count, setCount] = useState(empty ? "10" : "1");
  const [label, setLabel] = useState("");
  const [zone, setZone] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "count") {
      run(() => addTables(slug, { count: Number(count), zone }), () => setCount("1"));
    } else {
      run(() => addNamedTable(slug, { label, zone }), () => setLabel(""));
    }
  }

  return (
    <form onSubmit={submit} className={`${card} p-5`}>
      <p className="font-semibold">{empty ? "Wie viele Tische haben Sie?" : "Tische hinzufügen"}</p>
      {empty && (
        <p className="mt-1 text-sm text-stone-600">
          Jeder Tisch bekommt einen eigenen QR-Code. Die Nummern können Sie danach umbenennen.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {mode === "count" ? (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Anzahl</span>
            <input
              className={input}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Name</span>
            <input
              className={input}
              value={label}
              maxLength={40}
              placeholder="z. B. Bar oder 12a"
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Bereich (optional)</span>
          <input
            className={input}
            value={zone}
            maxLength={40}
            placeholder="z. B. Terrasse"
            onChange={(e) => setZone(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Speichern…" : "Anlegen"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "count" ? "named" : "count")}
          className="text-sm font-medium text-stone-600 underline underline-offset-4"
        >
          {mode === "count" ? "Einen Tisch mit Namen anlegen" : "Mehrere nummerierte Tische anlegen"}
        </button>
      </div>
    </form>
  );
}

function TableItem({
  slug,
  table,
  open,
  onToggle,
  pending,
  run,
}: {
  slug: string;
  table: TableRow;
  open: boolean;
  onToggle: () => void;
  pending: boolean;
  run: Run;
}) {
  const [label, setLabel] = useState(table.label);
  const [zone, setZone] = useState(table.zone ?? "");
  const dirty = label !== table.label || zone !== (table.zone ?? "");

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-stone-50"
      >
        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-stone-100 px-2 text-base font-semibold tabular-nums">
          {table.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{tableDisplayName(table.label)}</span>
          <span className="block text-xs text-stone-500">
            {table.is_active ? `Code ${table.code}` : "Ausgeschaltet – QR-Code öffnet keine Tischansicht"}
          </span>
        </span>
        <span aria-hidden className={`text-stone-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-stone-100 bg-stone-50 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Name</span>
              <input className={input} value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Bereich</span>
              <input className={input} value={zone} maxLength={40} onChange={(e) => setZone(e.target.value)} />
            </label>
          </div>
          {dirty && (
            <button
              type="button"
              disabled={pending}
              className={primaryBtn}
              onClick={() => run(() => updateTable(slug, table.id, { label, zone }))}
            >
              Speichern
            </button>
          )}

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="block font-medium">Aktiv</span>
              <span className="block text-stone-500">Ausgeschaltete Tische können nichts mehr auslösen.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="h-6 w-11 shrink-0 cursor-pointer accent-stone-900"
              checked={table.is_active}
              disabled={pending}
              onChange={(e) => run(() => updateTable(slug, table.id, { isActive: e.target.checked }))}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/app/${slug}/tische/drucken?id=${table.id}`}
              target="_blank"
              rel="noreferrer"
              className={ghostBtn}
            >
              QR-Code drucken
            </a>
            <button
              type="button"
              disabled={pending}
              className={ghostBtn}
              onClick={() => {
                if (confirm(`Neuer Code für ${tableDisplayName(table.label)}? Der alte Aufkleber funktioniert dann nicht mehr.`)) {
                  run(() => renewTableCode(slug, table.id));
                }
              }}
            >
              Neuer Code
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-xl px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
              onClick={() => {
                if (confirm(`${tableDisplayName(table.label)} löschen?`)) run(() => deleteTable(slug, table.id));
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
