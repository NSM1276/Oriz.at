"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/contact-info";
import { addLead, createInvite, updateLead, type InviteResult } from "./actions";

const field = "mt-1 w-full rounded-xl border border-onyx/20 bg-white px-3 py-2.5 text-base outline-none focus:border-onyx";

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
    return <button type="button" onClick={() => setOpen(true)} className="mt-4 w-full rounded-xl bg-onyx py-3 font-medium text-white">+ Neuer Kontakt</button>;
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
      <label className="block text-sm"><span className="font-medium">Lokal</span>
        <input required autoFocus value={v.business} onChange={(e) => setV({ ...v, business: e.target.value })} className={field} />
      </label>
      <label className="block text-sm"><span className="text-onyx/70">Name</span>
        <input value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} autoComplete="off" className={field} />
      </label>
      <label className="block text-sm"><span className="text-onyx/70">Telefon / WhatsApp</span>
        <input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} type="tel" autoComplete="off" className={field} />
      </label>
      <label className="block text-sm"><span className="text-onyx/70">Notiz</span>
        <textarea rows={2} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} className={field} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-onyx px-5 py-2.5 font-medium text-white disabled:opacity-50">{pending ? "Speichert…" : "Speichern"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-5 py-2.5 ring-1 ring-onyx/20">Abbrechen</button>
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
    <div className="mt-3 space-y-3 border-t border-onyx/10 pt-3">
      <div className="flex flex-wrap gap-1.5">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            aria-pressed={s === status}
            onClick={() => s !== status && save({ status: s })}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 disabled:opacity-60 ${s === status ? "bg-onyx text-white ring-onyx" : "bg-white text-onyx/80 ring-onyx/20"}`}
          >
            {LEAD_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <span className="text-onyx/70">Wieder melden am</span>
        <input type="date" defaultValue={followUpOn ?? ""} onChange={(e) => save({ followUpOn: e.target.value || null })} className="rounded-xl border border-onyx/20 bg-white px-3 py-1.5" />
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

const INVITE_LABEL: Record<string, string> = { open: "Einladung offen", used: "Konto angelegt", expired: "Einladung abgelaufen" };

/** Makes the personal sign-up link for a contact and offers it for WhatsApp or the clipboard. */
export function InviteButton({ leadId, state }: { leadId: string; state: "open" | "used" | "expired" | null }) {
  const [pending, start] = useTransition();
  const [invite, setInvite] = useState<Extract<InviteResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function make() {
    setError(null);
    start(async () => {
      const res = await createInvite(leadId);
      if (res.ok) setInvite(res);
      else setError(res.error);
    });
  }

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.message);
      setCopied(true);
    } catch {
      setError("Kopieren nicht möglich. Bitte den Link markieren und kopieren.");
    }
  }

  if (state === "used") return <p className="mt-3 text-sm font-medium text-emerald-700">{INVITE_LABEL.used}</p>;

  return (
    <div className="mt-3">
      {!invite && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={make} disabled={pending} className="min-h-11 rounded-xl bg-onyx px-4 text-sm font-semibold text-white disabled:opacity-50">
            {pending ? "Erstellt…" : state ? "Neuen Einladungslink erstellen" : "Einladungslink erstellen"}
          </button>
          {state && <span className="text-sm text-onyx/70">{INVITE_LABEL[state]}</span>}
        </div>
      )}
      {invite && (
        <div className="rounded-xl bg-onyx/[0.03] p-4 ring-1 ring-onyx/10">
          <p className="text-sm font-medium">Persönlicher Link, gültig bis {new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long" }).format(new Date(invite.expires))}</p>
          <p className="mt-1 break-all text-sm text-onyx/80">{invite.url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {invite.whatsapp && (
              <a href={invite.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-onyx px-4 text-sm font-semibold text-white">
                Per WhatsApp senden
              </a>
            )}
            <button type="button" onClick={copy} className="min-h-11 rounded-xl px-4 text-sm font-medium ring-1 ring-onyx/20">
              {copied ? "Kopiert" : "Nachricht kopieren"}
            </button>
          </div>
          {!invite.whatsapp && <p className="mt-2 text-xs text-onyx/60">Keine Telefonnummer eingetragen: Nachricht kopieren und selbst senden.</p>}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
