"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { canMove, type OrderStatus } from "@/lib/services";
import { saveAdminNote, setOrderStatus } from "./actions";

const MOVES: { to: OrderStatus; label: string; primary?: boolean }[] = [
  { to: "bezahlt", label: "Als bezahlt markieren", primary: true },
  { to: "in_arbeit", label: "In Arbeit" },
  { to: "fertig", label: "Fertig", primary: true },
  { to: "storniert", label: "Stornieren" },
  { to: "neu", label: "Wieder öffnen" },
];

export function OrderControls({ orderId, status, note, hasEmail }: { orderId: string; status: OrderStatus; note: string; hasEmail: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notify, setNotify] = useState(true);
  const [draft, setDraft] = useState(note);
  const [message, setMessage] = useState<string | null>(null);

  function move(to: OrderStatus) {
    if (to === "storniert" && !confirm("Auftrag stornieren?")) return;
    setMessage(null);
    start(async () => {
      const res = await setOrderStatus(orderId, to, notify);
      if (!res.ok) setMessage(res.error);
      // The card moves to another group and remounts, so a failed email needs an alert, not inline text.
      else if (notify && hasEmail && !res.emailed && ["bezahlt", "in_arbeit", "fertig"].includes(to)) {
        alert("Status gespeichert, aber die E-Mail ging nicht raus — bitte Kunden selbst informieren.");
      }
      router.refresh();
    });
  }

  const moves = MOVES.filter((m) => canMove(status, m.to));

  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      {moves.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {moves.map((m) => (
            <button
              key={m.to}
              type="button"
              disabled={pending}
              onClick={() => move(m.to)}
              className={`rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 ${m.primary ? "bg-stone-900 text-white" : m.to === "storniert" ? "text-red-700 ring-1 ring-red-200" : "ring-1 ring-stone-300"}`}
            >
              {m.label}
            </button>
          ))}
          {hasEmail && (
            <label className="ml-auto flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Kunden informieren
            </label>
          )}
        </div>
      )}
      {message && <p className="mt-2 text-sm text-stone-700">{message}</p>}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveAdminNote(orderId, draft);
            setMessage(res.ok ? "Notiz gespeichert." : res.error);
          });
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Interne Notiz (z. B. Überweisung am …)" className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900" />
        <button type="submit" disabled={pending} className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-stone-300 disabled:opacity-50">Speichern</button>
      </form>
    </div>
  );
}
