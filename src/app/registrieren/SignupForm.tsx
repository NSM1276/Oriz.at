"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_MIN = 8;

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) {
      setError(`Das Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.`);
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/neu` },
    });
    setBusy(false);

    if (err) {
      setError(
        err.status === 429
          ? "Zu viele Versuche. Bitte in einigen Minuten erneut versuchen."
          : /password/i.test(err.message)
            ? "Dieses Passwort ist zu schwach. Bitte ein längeres wählen."
            : "Registrierung fehlgeschlagen. Bitte die E-Mail-Adresse prüfen.",
      );
      return;
    }
    // Without email confirmation Supabase signs the user in right away.
    if (data.session) {
      router.push("/app/neu");
      return;
    }
    // Same message whether or not the address already had an account, so the
    // form does not reveal who is registered.
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <p className="font-semibold">Bitte E-Mail bestätigen</p>
        <p className="mt-1 text-sm text-stone-600">
          Wir haben einen Link an <span className="font-medium text-stone-900">{sentTo}</span> geschickt.
          Nach dem Klick richten Sie Ihr Lokal in wenigen Minuten ein.
        </p>
        <p className="mt-4 text-xs text-stone-500">
          Keine E-Mail da? Bitte auch im Spam-Ordner nachsehen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <label className="block">
        <span className="text-sm font-medium">E-Mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Passwort</span>
        <input
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900"
        />
        <span className="mt-1 block text-xs text-stone-500">Mindestens {PASSWORD_MIN} Zeichen.</span>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-stone-900 py-3 font-medium text-white disabled:opacity-50"
      >
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
