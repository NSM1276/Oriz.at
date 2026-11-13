"use client";

import { useState } from "react";
import { InviteClientModal } from "@/components/admin/InviteClientModal";
import { createClient } from "@/lib/supabase/client";

const row = "flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left text-[17px] font-medium active:bg-onyx/5";

/** "Lokal für Kunden anlegen" (we set it up, the owner gets an e-mail) and signing out. */
export function MoreActions() {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <>
      <button type="button" className={row} onClick={() => setInviteOpen(true)}>
        <span>
          Lokal für Kunden anlegen
          <span className="block text-sm font-normal text-onyx/60">Wir richten ein, der Kunde bekommt eine E-Mail zum Passwort</span>
        </span>
        <span aria-hidden className="text-xl text-onyx/40">›</span>
      </button>
      <button
        type="button"
        className={`${row} text-red-700`}
        onClick={async () => {
          await createClient().auth.signOut();
          window.location.href = "/admin/login";
        }}
      >
        Abmelden
      </button>
      <InviteClientModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
