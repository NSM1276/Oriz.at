"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-redirect";

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
  // Only paths on this site (defense against open-redirect).
  const safeNext = safeNextPath(searchParams.get("next"));
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
      setErrorMsg("E-Mail oder Passwort stimmt nicht.");
    } else {
      router.push(safeNext);
    }
  }

  const field = "mt-2 block min-h-12 w-full rounded-xl bg-white px-4 text-lg text-onyx outline-none ring-1 ring-onyx/20 focus:ring-2 focus:ring-onyx";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/oriz-horizontal.svg" alt="ORIZ" className="h-9 w-auto" />
      <h1 className="mt-8 font-display text-4xl font-medium text-onyx">Anmelden</h1>
      <p className="mt-2 text-center text-lg text-onyx/70">Für Ihr Lokal bei ORIZ.</p>

      <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm">
        <label className="block">
          <span className="text-base font-medium text-onyx">E-Mail</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>

        <label className="mt-5 block">
          <span className="text-base font-medium text-onyx">Passwort</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>

        {errorMsg && <p role="alert" className="mt-4 text-base font-medium text-red-700">{errorMsg}</p>}

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-6 min-h-14 w-full rounded-xl bg-onyx text-lg font-semibold text-parchment transition hover:opacity-90 disabled:opacity-50"
        >
          {state === "loading" ? "Einen Moment…" : "Anmelden"}
        </button>

        <p className="mt-6 text-center text-base">
          <Link href="/admin/forgot-password" className="font-medium text-onyx underline underline-offset-4">
            Passwort vergessen?
          </Link>
        </p>
      </form>
    </main>
  );
}
