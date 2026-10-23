"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/contact-info";
import { addLead, updateLead } from "./actions";

const field = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900";

export function AddLeadForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ business: "", contact: "", phone: "", note: "" });
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await addLead(v);
      if (!res.ok) { setError(res.error); return; }
      setV({ business: "", contact: "", phone: "", note: "" });
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-4 w-full rounded-xl bg-stone-900 py-3 font-medium text-white">+ Neuer Kontakt</button>;
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <label className="block text-sm"><span className="font-medium">Lokal</span>
        <input required autoFocus value={v.business} onChange={(e) => setV({ ...v, business: e.target.value })} className={field} />
      </label>
      <label className="block text-sm"><span className="text-stone-600">Name</span>
        <input value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} autoComplete="off" className={field} />
      </label>
      <label className="block text-sm"><span className="text-stone-600">Telefon / WhatsApp</span>
        <input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} type="tel" autoComplete="off" className={field} />
      </label>
      <label className="block text-sm"><span className="text-stone-600">Notiz</span>
        <textarea rows={2} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} className={field} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-stone-900 px-5 py-2.5 font-medium text-white disabled:opacity-50">{pending ? "Speichert…" : "Speichern"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-5 py-2.5 ring-1 ring-stone-300">Abbrechen</button>
      </div>
    </form>
  );
}

/** Status, follow-up date and note of one lead; every change is saved right away. */
export function LeadEdit({ id, status, followUpOn, note }: { id: string; status: LeadStatus; followUpOn: string | null; note: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(note);
  const [error, setError] = useState<string | null>(null);

  function save(patch: { status?: string; followUpOn?: string | null; note?: string }) {
    setError(null);
    start(async () => {
      const res = await updateLead(id, patch);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-3 border-t border-stone-100 pt-3">
      <div className="flex flex-wrap gap-1.5">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            aria-pressed={s === status}
            onClick={() => s !== status && save({ status: s })}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 disabled:opacity-60 ${s === status ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-700 ring-stone-300"}`}
          >
            {LEAD_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <span className="text-stone-600">Wieder melden am</span>
        <input type="date" defaultValue={followUpOn ?? ""} onChange={(e) => save({ followUpOn: e.target.value || null })} className="rounded-xl border border-stone-300 bg-white px-3 py-1.5" />
      </label>
      <textarea
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() !== note.trim() && save({ note: draft })}
        placeholder="Notiz"
        className={field}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
