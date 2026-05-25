"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  // Only allow internal relative paths (defense against open-redirect).
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState("error");
      setErrorMsg("Incorrect email or password.");
    } else {
      router.push(safeNext);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-4xl text-onyx">ORIZ</h1>
      <div className="hairline w-16 my-6" />
      <p className="font-sans text-xs tracking-regal uppercase text-onyx/60">
        Restaurant log-in
      </p>

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

        <label className="block mt-6">
          <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
            Password
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
          />
        </label>

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-8 w-full font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx py-3 hover:bg-onyx hover:text-parchment transition disabled:opacity-50"
        >
          {state === "loading" ? "Signing in…" : "Sign in"}
        </button>

        {errorMsg && (
          <p className="font-sans text-sm text-red-700 mt-4">{errorMsg}</p>
        )}
      </form>
    </main>
  );
}
