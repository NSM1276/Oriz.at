"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PRO_MAX_MENUS, lockedText, upgradeMailto } from "@/lib/entitlements";
import { formatSchedule } from "@/lib/menu-schedule";
import { DAY_KEYS, DAY_LABELS, MENU_NAME_MAX, type DayKey } from "@/lib/menus-edit";
import { createMenu, deleteMenu, moveMenu, updateMenu } from "./menus-actions";

export type MenuRow = { id: string; name: string; days: string[]; from: string | null; to: string | null; sections: number };

const card = "rounded-2xl bg-white ring-1 ring-onyx/10";
const field = "mt-1 w-full rounded-xl border border-onyx/20 bg-white px-3 py-2.5 text-base outline-none focus:border-onyx";
const btn = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-base font-medium";

function MenuForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; days: string[]; from: string | null; to: string | null };
  busy: boolean;
  onSubmit: (v: { name: string; days: string[]; from: string | null; to: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [timed, setTimed] = useState(initial.days.length > 0 || !!initial.from);
  const [days, setDays] = useState<string[]>(initial.days);
  const [from, setFrom] = useState(initial.from?.slice(0, 5) ?? "11:30");
  const [to, setTo] = useState(initial.to?.slice(0, 5) ?? "15:00");

  return (
    <form
      className="space-y-3 rounded-xl bg-onyx/[0.03] p-4 ring-1 ring-onyx/10"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(timed ? { name, days, from, to } : { name, days: [], from: null, to: null });
      }}
    >
      <label className="block">
        <span className="text-base font-medium">Name der Karte</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={MENU_NAME_MAX} required placeholder="z. B. Mittag, Abend, Getränke" className={field} />
      </label>

      <label className="flex items-center gap-3 text-base">
        <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-5 w-5" />
        Je nach Tag und Uhrzeit vorwählen
      </label>

      {timed && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Wochentage">
            {DAY_KEYS.map((d: DayKey) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]))}
                  className={`h-11 w-11 text-base font-medium ring-1 ${on ? "bg-onyx text-white ring-onyx" : "bg-white text-onyx/80 ring-onyx/20"}`}
                >
                  {DAY_LABELS[d]}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <label className="block flex-1">
              <span className="text-base text-onyx/70">Von</span>
              <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} required className={field} />
            </label>
            <label className="block flex-1">
              <span className="text-base text-onyx/70">Bis</span>
              <input type="time" value={to} onChange={(e) => setTo(e.target.value)} required className={field} />
            </label>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={busy || !name.trim()} className={`${btn} bg-onyx text-white disabled:opacity-40`}>Speichern</button>
        <button type="button" onClick={onCancel} className={`${btn} ring-1 ring-onyx/20`}>Abbrechen</button>
      </div>
    </form>
  );
}

export function MenusCard({ slug, venueName, maxMenus, menus }: { slug: string; venueName: string; maxMenus: number; menus: MenuRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Fehler.");
      else after?.();
      router.refresh();
    });
  }

  // Starter: one menu, no extra rows — explain instead of offering a button that would be refused.
  if (maxMenus <= 1 && menus.length === 0) {
    const t = lockedText("menus");
    return (
      <section className={`${card} p-5`}>
        <p className="font-semibold">Mehrere Karten <span className="ml-1 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">Abo</span></p>
        <p className="mt-0.5 text-base text-onyx/70">{t.body}</p>
        <a href={upgradeMailto(venueName)} className={`${btn} mt-3 ring-1 ring-onyx/20`}>Abo anfragen</a>
      </section>
    );
  }

  const full = menus.length >= maxMenus;
  return (
    <section className={`${card} p-5`}>
      <p className="font-semibold">Karten</p>
      <p className="mt-0.5 text-base text-onyx/70">
        Zum Beispiel Mittag, Abend und Getränke. Ab zwei Karten sehen Ihre Gäste oben die Auswahl; vorgewählt ist die Karte, die gerade zu Tag und Uhrzeit passt, sonst die erste.
        Welcher Bereich zu welcher Karte gehört, stellen Sie unten bei jedem Bereich ein.
      </p>

      {menus.length === 1 && <p className="mt-2 text-base text-amber-800">Mit nur einer Karte sehen Ihre Gäste keine Auswahl. Legen Sie eine zweite an.</p>}

      <ul className="mt-3 space-y-2">
        {menus.map((m, i) => (
          <li key={m.id}>
            {editing === m.id ? (
              <MenuForm
                initial={{ name: m.name, days: m.days, from: m.from, to: m.to }}
                busy={pending}
                onCancel={() => setEditing(null)}
                onSubmit={(v) => run(() => updateMenu(slug, m.id, v), () => setEditing(null))}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl p-3 ring-1 ring-onyx/10">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-sm text-onyx/60">
                    {formatSchedule({ id: m.id, name: m.name, position: i, active_days: m.days, time_from: m.from, time_to: m.to }) || "ohne Zeitplan"}
                    {" · "}
                    {m.sections} {m.sections === 1 ? "Bereich" : "Bereiche"}
                  </p>
                </div>
                <button type="button" aria-label="Karte nach oben" disabled={pending || i === 0} onClick={() => run(() => moveMenu(slug, m.id, -1))} className="h-9 w-9 rounded-lg text-onyx/60 hover:bg-onyx/5 disabled:opacity-30">↑</button>
                <button type="button" aria-label="Karte nach unten" disabled={pending || i === menus.length - 1} onClick={() => run(() => moveMenu(slug, m.id, 1))} className="h-9 w-9 rounded-lg text-onyx/60 hover:bg-onyx/5 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => setEditing(m.id)} className="rounded-lg px-3 py-2 text-base font-medium text-onyx/80 hover:bg-onyx/5">Bearbeiten</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => { if (confirm(`Karte „${m.name}“ löschen? Ihre Bereiche bleiben erhalten und erscheinen dann in allen Karten.`)) run(() => deleteMenu(slug, m.id)); }}
                  className="rounded-lg px-3 py-2 text-base font-medium text-red-700 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <div className="mt-3">
          <MenuForm initial={{ name: "", days: [], from: null, to: null }} busy={pending} onCancel={() => setEditing(null)} onSubmit={(v) => run(() => createMenu(slug, v), () => setEditing(null))} />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending || full} onClick={() => setEditing("new")} className={`${btn} bg-onyx text-white disabled:opacity-40`}>+ Karte</button>
          {full && (
            <span className="text-base text-onyx/60">
              {maxMenus <= 1 ? `Mehr Karten gibt es mit dem Abo (bis zu ${PRO_MAX_MENUS}).` : `Es sind höchstens ${maxMenus} Karten möglich.`}
            </span>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-base text-red-700">{error}</p>}
    </section>
  );
}
