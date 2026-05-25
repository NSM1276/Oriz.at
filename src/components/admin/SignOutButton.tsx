"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
      }}
      className="font-sans text-[11px] tracking-regal uppercase px-3 py-2 transition-opacity hover:opacity-70"
      style={{
        border: "1px solid var(--accent, #C69B3C)",
        color: "var(--accent, #C69B3C)",
      }}
    >
      Abmelden
    </button>
  );
}
