"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanId, SubStatus } from "@/lib/entitlements";
import { setSubscription } from "./actions";

const STATUS_LABEL: Record<SubStatus, string> = {
  trialing: "Testphase",
  active: "Aktiv (bezahlt)",
  comped: "Kostenlos (von uns)",
  past_due: "Zahlung offen",
  canceled: "Beendet",
};

const field = "rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm";

export function TarifRow({ venueId, plan: initialPlan, status: initialStatus, trialEnd }: { venueId: string; plan: PlanId; status: SubStatus; trialEnd: string | null }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [status, setStatus] = useState<SubStatus>(initialStatus);
  const [end, setEnd] = useState(trialEnd ? trialEnd.slice(0, 10) : "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = plan !== initialPlan || status !== initialStatus || (status === "trialing" && end !== (trialEnd ? trialEnd.slice(0, 10) : ""));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select className={field} value={plan} onChange={(e) => setPlan(e.target.value as PlanId)} aria-label="Tarif">
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
      </select>
      <select className={field} value={status} onChange={(e) => setStatus(e.target.value as SubStatus)} aria-label="Status">
        {(Object.keys(STATUS_LABEL) as SubStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
      {status === "trialing" && <input type="date" className={field} value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Testphase bis" />}
      <button
        type="button"
        disabled={pending || !dirty}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await setSubscription(venueId, plan, status, status === "trialing" && end ? `${end}T23:59:59Z` : null);
            setMsg(res.ok ? "Gespeichert." : res.error);
            if (res.ok) router.refresh();
          })
        }
        className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Speichern
      </button>
      {msg && <span className="text-sm text-stone-600">{msg}</span>}
    </div>
  );
}
