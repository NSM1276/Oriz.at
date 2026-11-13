"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://oriz.at/admin/reset-password",
    });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="font-display text-4xl text-onyx">ORIZ</h1>
        <div className="hairline w-16 my-6" />
        <p className="text-lg text-onyx/75 mt-8 max-w-sm text-center leading-relaxed">
          Wenn ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen
          Link zum Zurücksetzen geschickt.
        </p>
        <p className="text-base text-onyx/70 mt-8">
          Bitte prüfen Sie auch Ihren Spam-Ordner.
        </p>
        <Link
          href="/admin/login"
          className="mt-10 inline-flex min-h-12 items-center rounded-xl px-5 text-base font-medium text-onyx ring-1 ring-onyx/25 transition hover:ring-onyx"
        >
          ← Zur Anmeldung
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-4xl text-onyx">ORIZ</h1>
      <div className="hairline w-16 my-6" />
      <p className="text-xl font-medium text-onyx">
        Passwort zurücksetzen
      </p>

      <form onSubmit={onSubmit} className="mt-10 w-full max-w-sm">
        <label className="block">
          <span className="text-base font-medium text-onyx">
            E-Mail
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block min-h-12 w-full rounded-xl bg-white px-4 text-lg text-onyx outline-none ring-1 ring-onyx/20 focus:ring-2 focus:ring-onyx"
          />
        </label>

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-8 min-h-14 w-full rounded-xl bg-onyx text-lg font-semibold text-parchment transition hover:opacity-90 disabled:opacity-50"
        >
          {state === "loading" ? "Senden…" : "Reset-Link senden"}
        </button>

        {errorMsg && (
          <p className="text-base font-medium text-red-700 mt-4">{errorMsg}</p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-base font-medium text-onyx underline underline-offset-4"
          >
            ← Zurück zur Anmeldung
          </Link>
        </div>
      </form>
    </main>
  );
}
