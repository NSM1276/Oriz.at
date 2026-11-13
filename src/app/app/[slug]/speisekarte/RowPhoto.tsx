"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { preparePhoto } from "@/lib/image-resize";

// The photo square of a dish in the menu list. An empty one is a button: one tap opens the phone's
// own chooser (camera or gallery) and the photo lands on the dish without leaving the list — the
// owner walks down the menu and adds them one after another. A dish that already has a photo
// opens its page instead, where the photo can be replaced or removed.

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13.2" r="3.3" />
    </svg>
  );
}

const tile = "h-16 w-16 shrink-0 overflow-hidden rounded-xl";

export function RowPhoto({ itemId, name, url, href, onUploaded }: { itemId: string; name: string; url: string | null; href: string; onUploaded: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { full, thumb } = await preparePhoto(file);
      const form = new FormData();
      form.append("target", "carta-item");
      form.append("id", itemId);
      form.append("file", full, "photo");
      form.append("thumb", thumb, "thumb");
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.url !== "string") throw new Error(typeof body.error === "string" ? body.error : "Das Foto konnte nicht gespeichert werden.");
      onUploaded(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das Foto konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (url) {
    return (
      <Link href={href} aria-label={`${name}: Foto ändern`} className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </Link>
    );
  }

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        aria-label={`${name}: Foto hinzufügen`}
        className={`${tile} flex flex-col items-center justify-center gap-0.5 border-2 border-dashed text-[11px] font-semibold transition active:scale-95 ${error ? "border-red-400 text-red-700" : "border-[#7A5C14]/45 text-[#7A5C14]"}`}
      >
        {busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A5C14]/30 border-t-[#7A5C14]" aria-hidden /> : <CameraIcon />}
        {busy ? "lädt" : error ? "nochmal" : "Foto"}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" onChange={pick} className="hidden" />
      {error && (
        <span role="alert" className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg bg-red-700 px-2.5 py-1.5 text-xs text-white shadow">
          {error}
        </span>
      )}
    </span>
  );
}
