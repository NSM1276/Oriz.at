"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { createClient } from "@/lib/supabase/client";
import { signUpWithInvite } from "./actions";

const PASSWORD_MIN = 8;
const input = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900";

/** The sign-up form behind a personal invitation link; the restaurant's name comes with the link. */
export function SignupForm({ token, venueName }: { token: string; venueName: string }) {
  const router = useRouter();
  const [company, setCompany] = useState(venueName);
  const [isBusiness, setIsBusiness] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) {
      setError(`Das Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.`);
      return;
    }
    if (!company.trim() || !isBusiness) {
      setError("Bitte Firmenname angeben und bestätigen, dass Sie als Unternehmer handeln.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await signUpWithInvite({ token, company, email, password, business: isBusiness });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    // Counts completed sign-ups; the event carries no e-mail or other data.
    track("signup", { ref: "einladung" });
    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      // The account exists; only the automatic sign-in did not work.
      router.push("/admin/login?next=/app/neu");
      return;
    }
    router.push("/app/neu");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <label className="block">
        <span className="text-sm font-medium">Firmenname</span>
        <input type="text" required autoComplete="organization" maxLength={200} value={company} onChange={(e) => setCompany(e.target.value)} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">E-Mail</span>
        <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Passwort</span>
        <input type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        <span className="mt-1 block text-xs text-stone-500">Mindestens {PASSWORD_MIN} Zeichen.</span>
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" required checked={isBusiness} onChange={(e) => setIsBusiness(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span className="text-sm text-stone-700">Ich bin Unternehmer und schließe den Vertrag im Rahmen meiner gewerblichen Tätigkeit.</span>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={busy} className="w-full rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50">
        {busy ? "Wird angelegt…" : "Kostenlos starten"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Schon registriert?{" "}
        <Link href="/admin/login?next=/app" className="font-medium text-stone-900 underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
