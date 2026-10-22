"use client";

import { useEffect, useState } from "react";

type Info = { mode: "fal" | "test" | "off"; styles: { id: string; label: string }[]; hasOriginal: boolean };

// New background and light around the owner's dish (api/dish-photo). The dish
// itself stays exactly as photographed; the original can always be restored.
export function DishPhotoStudio({ itemId, onChange }: { itemId: string; onChange: (url: string) => void }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/dish-photo?itemId=${itemId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Info | null) => live && setInfo(j))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [itemId]);

  if (!info || info.mode === "off") return null;

  async function run(method: "POST" | "DELETE", style?: string) {
    setBusy(style ?? "original");
    setError(null);
    try {
      const res =
        method === "POST"
          ? await fetch("/api/dish-photo", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId, style }),
            })
          : await fetch(`/api/dish-photo?itemId=${itemId}`, { method });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      onChange(j.url);
      setInfo((i) => i && { ...i, hasOriginal: method === "POST" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-1 max-w-sm rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-stone-900">
          ✨ Hintergrund verschönern
        </button>
      ) : (
        <>
          <p className="text-sm font-medium text-stone-900">Hintergrund &amp; Licht</p>
          <p className="mt-0.5 text-xs text-stone-500">
            Nur der Hintergrund wird neu gestaltet. Ihr Gericht bleibt genau so, wie Sie es fotografiert haben.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {info.styles.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!!busy}
                onClick={() => run("POST", s.id)}
                className="rounded-full bg-white px-3.5 py-2 text-sm text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-50"
              >
                {busy === s.id ? "Wird erstellt…" : s.label}
              </button>
            ))}
          </div>
          {info.hasOriginal && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run("DELETE")}
              className="mt-3 text-xs font-medium text-stone-600 underline disabled:opacity-50"
            >
              {busy === "original" ? "…" : "Originalfoto wiederherstellen"}
            </button>
          )}
          {info.mode === "test" && (
            <p className="mt-2 text-xs text-amber-700">Testmodus: einfacher Hintergrund ohne KI, keine Kosten.</p>
          )}
        </>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
