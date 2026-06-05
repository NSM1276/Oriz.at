"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Supabase password reset flow:
// 1. User clicks link in email → Supabase exchanges token → session set in cookies
// 2. This page detects an active session and allows new password input
// 3. updateUser({ password }) saves it, then redirect to /admin

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<
    "checking" | "ready" | "no-session" | "saving" | "done" | "error"
  >("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // PKCE flow: Supabase redirects with ?code= in URL — must exchange for session
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setState("no-session");
        else setState("ready");
      });
      return;
    }

    // Implicit flow fallback: hash-based token (#access_token=...&type=recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setState("ready");
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setState((prev) => prev === "checking" ? "ready" : prev);
      else setState((prev) => prev === "checking" ? "no-session" : prev);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Mindestens 8 Zeichen.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwörter stimmen nicht überein.");
      return;
    }
    setState("saving");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("done");
      setTimeout(() => router.push("/admin"), 1500);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-4xl text-onyx">ORIZ</h1>
      <div className="hairline w-16 my-6" />
      <p className="font-sans text-xs tracking-regal uppercase text-onyx/60">
        Neues Passwort setzen
      </p>

      {state === "checking" && (
        <p className="font-display italic text-onyx/40 mt-8">
          Einen Moment …
        </p>
      )}

      {state === "no-session" && (
        <div className="mt-8 max-w-sm text-center">
          <p className="font-display italic text-onyx/60 leading-relaxed">
            Der Reset-Link ist ungültig oder abgelaufen.
          </p>
          <Link
            href="/admin/forgot-password"
            className="mt-8 inline-block font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx px-5 py-2.5 hover:bg-onyx hover:text-parchment transition"
          >
            Neuen Link anfordern
          </Link>
        </div>
      )}

      {(state === "ready" || state === "saving" || state === "error") && (
        <form onSubmit={onSubmit} className="mt-10 w-full max-w-sm">
          <label className="block">
            <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
              Neues Passwort
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
            />
          </label>

          <label className="block mt-6">
            <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
              Bestätigen
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
            />
          </label>

          <button
            type="submit"
            disabled={state === "saving"}
            className="mt-8 w-full font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx py-3 hover:bg-onyx hover:text-parchment transition disabled:opacity-50"
          >
            {state === "saving" ? "Speichern…" : "Passwort speichern"}
          </button>

          {errorMsg && (
            <p className="font-sans text-sm text-red-700 mt-4">{errorMsg}</p>
          )}
        </form>
      )}

      {state === "done" && (
        <p className="font-display italic text-onyx/60 mt-8">
          Passwort gespeichert. Sie werden weitergeleitet …
        </p>
      )}
    </main>
  );
}
