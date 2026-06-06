"use client";

import { useRef, useState } from "react";
import { resizeToWebP } from "@/lib/image-resize";

type Target =
  | "carta-item"
  | "carta-venue-cover"
  | "casa-cover"
  | "casa-block"
  | "carta-venue-logo"
  | "casa-property-logo";

type Props = {
  target: Target;
  id: string;
  currentUrl: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  /** Aspect of the preview thumbnail. "square" for items, "wide" for covers. */
  aspect?: "square" | "wide" | "tall";
};

// Single-shot photo uploader: pick → resize → upload → reflect URL.
// Used everywhere a photo can be attached (Carta items, Casa cover, Casa blocks).
export function PhotoUploader({
  target,
  id,
  currentUrl,
  onChange,
  label,
  aspect = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const isSvg =
        file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
      const form = new FormData();
      form.append("target", target);
      form.append("id", id);
      if (isSvg) {
        // SVG passes through untouched — server normalizes (sanitize + currentColor).
        form.append("file", file, file.name || "logo.svg");
      } else {
        const webp = await resizeToWebP(file);
        form.append("file", webp, "photo.webp");
      }
      const res = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      onChange(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm("Foto entfernen?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/upload-photo?target=${target}&id=${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      onChange(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const aspectClass =
    aspect === "wide" ? "aspect-[16/9]" : aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="inline-flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/svg+xml"
        onChange={handlePick}
        disabled={busy}
        className="hidden"
      />

      {currentUrl ? (
        <div className="flex items-start gap-3">
          <div
            className={`${aspectClass} w-32 overflow-hidden bg-onyx/5 border border-onyx/10`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Vorschau"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-onyx/20 px-3 py-2 hover:border-onyx hover:text-onyx transition disabled:opacity-50"
            >
              {busy ? "…" : "Ersetzen"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="font-sans text-[10px] tracking-regal uppercase text-red-700/70 border border-red-700/30 px-3 py-2 hover:bg-red-700 hover:text-white transition disabled:opacity-50"
            >
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-dashed border-onyx/30 px-4 py-3 hover:border-onyx hover:text-onyx transition disabled:opacity-50"
        >
          {busy ? "Wird hochgeladen…" : (label ?? "+ Foto hinzufügen")}
        </button>
      )}

      {error && (
        <p className="font-sans text-[10px] text-red-700 leading-snug max-w-[220px]">
          {error}
        </p>
      )}
    </div>
  );
}
