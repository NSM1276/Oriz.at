"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimPairing } from "./actions";

export function PairForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await claimPairing(token, name);
          if (res.ok) router.replace("/service");
          else setError(res.error);
        });
      }}
      className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200"
    >
      <label className="block">
        <span className="text-sm font-medium">Ihr Name oder der des Geräts</span>
        <input
          required
          maxLength={40}
          autoFocus
          placeholder="z. B. Anna oder Bar-Tablet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900"
        />
        <span className="mt-1 block text-xs text-stone-500">Kolleginnen sehen, wer einen Ruf übernommen hat.</span>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Wird verbunden…" : "Verbinden"}
      </button>
    </form>
  );
}
