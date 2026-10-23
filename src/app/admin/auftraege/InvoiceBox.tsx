"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "./actions";

const input = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900";

/** Invoice of one order: the PDF link once it exists, otherwise a small form to create it. */
export function InvoiceBox({
  orderId,
  number,
  canCreate,
  defaultName,
  defaultAddress,
}: {
  orderId: string;
  number: string | null;
  canCreate: boolean;
  defaultName: string;
  defaultAddress: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState(defaultAddress);
  const [error, setError] = useState<string | null>(null);

  if (number) {
    return (
      <p className="mt-4 border-t border-stone-100 pt-4 text-sm">
        <span className="text-stone-500">Rechnung </span>
        <a className="font-medium underline" href={`/api/invoice/${number}`} target="_blank" rel="noreferrer">{number} (PDF)</a>
      </p>
    );
  }
  if (!canCreate) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Rechnung erstellen? Die Rechnungsnummer ist danach vergeben und die Rechnung kann nicht mehr geändert werden.")) return;
    setError(null);
    start(async () => {
      const res = await createInvoice(orderId, name, address);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-stone-100 pt-4 text-sm">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-xl px-4 py-2 font-medium ring-1 ring-stone-300">Rechnung erstellen</button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-stone-600">Rechnung an (Firmenname)</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className="text-stone-600">Adresse (Straße, PLZ Ort)</span>
            <textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={input} />
          </label>
          {error && <p className="text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded-xl bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-50">{pending ? "Wird erstellt…" : "Erstellen"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 ring-1 ring-stone-300">Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
}
