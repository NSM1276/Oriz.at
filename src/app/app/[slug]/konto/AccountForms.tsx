"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_MIN = 8;
const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";

export function AccountForms({ email, showVenues }: { email: string; showVenues: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) { setError(`Mindestens ${PASSWORD_MIN} Zeichen.`); return; }
    setState("busy");
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) { setState("idle"); setError("Das Passwort konnte nicht geändert werden. Bitte ein längeres wählen."); return; }
    setPassword("");
    setState("saved");
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Angemeldet als</p>
        <p className="mt-1 font-medium">{email}</p>
        {showVenues && <Link href="/app" className="mt-2 inline-block text-sm text-stone-600 underline">Anderes Lokal wählen</Link>}
      </section>

      <form onSubmit={changePassword} className={card}>
        <p className="font-semibold">Passwort ändern</p>
        <input
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setState("idle"); }}
          placeholder={`Neues Passwort, mindestens ${PASSWORD_MIN} Zeichen`}
          className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-stone-900"
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {state === "saved" && <p className="mt-2 text-sm text-emerald-700">Passwort geändert.</p>}
        <button type="submit" disabled={state === "busy" || !password} className="mt-3 rounded-xl bg-stone-900 px-5 py-2.5 font-medium text-white disabled:opacity-40">
          {state === "busy" ? "Wird gespeichert…" : "Passwort speichern"}
        </button>
      </form>

      <button type="button" onClick={signOut} className="w-full rounded-2xl bg-white py-3 font-medium text-red-700 shadow-sm ring-1 ring-stone-200">
        Abmelden
      </button>
    </div>
  );
}
