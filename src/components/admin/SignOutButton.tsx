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
      className="font-sans text-[11px] tracking-regal uppercase text-onyx/60 hover:text-onyx"
    >
      Sign out
    </button>
  );
}
