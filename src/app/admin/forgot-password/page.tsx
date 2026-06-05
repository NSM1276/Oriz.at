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
        <p className="font-display italic text-onyx/60 mt-8 max-w-sm text-center leading-relaxed">
          Wenn ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen
          Link zum Zurücksetzen geschickt.
        </p>
        <p className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 mt-8">
          Bitte prüfen Sie auch Ihren Spam-Ordner.
        </p>
        <Link
          href="/admin/login"
          className="mt-10 font-sans text-[11px] tracking-regal uppercase text-onyx/60 border border-onyx/30 px-5 py-2.5 hover:border-onyx hover:text-onyx transition"
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
      <p className="font-sans text-xs tracking-regal uppercase text-onyx/60">
        Passwort zurücksetzen
      </p>

      <form onSubmit={onSubmit} className="mt-10 w-full max-w-sm">
        <label className="block">
          <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
            E-Mail
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
          />
        </label>

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-8 w-full font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx py-3 hover:bg-onyx hover:text-parchment transition disabled:opacity-50"
        >
          {state === "loading" ? "Senden…" : "Reset-Link senden"}
        </button>

        {errorMsg && (
          <p className="font-sans text-sm text-red-700 mt-4">{errorMsg}</p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-onyx transition"
          >
            ← Zurück zur Anmeldung
          </Link>
        </div>
      </form>
    </main>
  );
}
