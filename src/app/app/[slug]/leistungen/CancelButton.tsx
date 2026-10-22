"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "./actions";

export function CancelButton({ slug, orderId }: { slug: string; orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Auftrag stornieren?")) return;
        start(async () => {
          const res = await cancelOrder(slug, orderId);
          if (!res.ok) alert(res.error);
          router.refresh();
        });
      }}
      className="text-sm text-stone-500 underline disabled:opacity-50"
    >
      Auftrag stornieren
    </button>
  );
}
