"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setState("loading");
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("done");
      setTimeout(() => { setOpen(false); setState("idle"); setPassword(""); setConfirm(""); }, 1500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-sans text-[11px] tracking-regal uppercase px-3 py-2 transition-opacity hover:opacity-70"
        style={{
          border: "1px solid var(--color-muted, rgba(10,10,10,0.3))",
          color: "var(--color-text, #0A0A0A)",
        }}
      >
        Passwort ändern
      </button>

      {open && (
        <div className="fixed inset-0 bg-onyx/40 flex items-center justify-center z-50 px-6">
          <div className="bg-parchment p-8 w-full max-w-sm">
            <h2 className="font-display text-2xl text-onyx mb-6">Change password</h2>

            {state === "done" ? (
              <p className="font-sans text-sm text-green-700">Password updated successfully.</p>
            ) : (
              <form onSubmit={onSubmit}>
                <label className="block">
                  <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">New password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
                  />
                </label>
                <label className="block mt-5">
                  <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">Confirm password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="mt-2 w-full bg-transparent border-b border-onyx/40 focus:border-gold outline-none py-2 font-sans text-onyx"
                  />
                </label>
                {errorMsg && <p className="font-sans text-sm text-red-700 mt-3">{errorMsg}</p>}
                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="flex-1 font-sans text-[11px] tracking-regal uppercase text-onyx border border-onyx py-3 hover:bg-onyx hover:text-parchment transition disabled:opacity-50"
                  >
                    {state === "loading" ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setPassword(""); setConfirm(""); setState("idle"); setErrorMsg(null); }}
                    className="flex-1 font-sans text-[11px] tracking-regal uppercase text-onyx/50 border border-onyx/30 py-3 hover:border-onyx hover:text-onyx transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
