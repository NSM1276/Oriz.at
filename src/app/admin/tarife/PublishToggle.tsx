"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPublished } from "./actions";

export function PublishToggle({ venueId, published }: { venueId: string; published: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(published);
  const [pending, start] = useTransition();
  return (
    <label className="mt-2 flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          if (!next && !confirm("Karte offline nehmen? Gäste sehen dann „nicht gefunden“.")) return;
          setOn(next);
          start(async () => {
            const res = await setPublished(venueId, next);
            if (!res.ok) setOn(!next);
            router.refresh();
          });
        }}
        className="h-4 w-4 accent-stone-900"
      />
      {on ? "Öffentlich — Gäste sehen die Karte" : "Nicht öffentlich — nur das Team und wir"}
    </label>
  );
}
