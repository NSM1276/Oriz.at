"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("sent");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-4xl text-onyx">ORIZ</h1>
      <div className="hairline w-16 my-6" />
      <p className="font-sans text-xs tracking-regal uppercase text-onyx/60">
        Restaurant log-in
      </p>

      {state === "sent" ? (
        <p className="font-display italic text-lg text-onyx/80 mt-10 max-w-md text-center">
          A link has been sent to {email}. Open it on this device to continue.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 w-full max-w-sm">
          <label className="block">
            <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
              Email
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
            disabled={state === "sending"}
            className="mt-8 w-full font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx py-3 hover:bg-onyx hover:text-parchment transition disabled:opacity-50"
          >
            {state === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {errorMsg && (
            <p className="font-sans text-sm text-red-700 mt-4">{errorMsg}</p>
          )}
        </form>
      )}
    </main>
  );
}
