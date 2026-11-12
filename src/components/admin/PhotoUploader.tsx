"use client";

import { useRef, useState } from "react";
import { preparePhoto, resizeToWebP } from "@/lib/image-resize";
import { DishPhotoStudio } from "@/components/photo/DishPhotoStudio";

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
      } else if (target === "carta-venue-logo" || target === "casa-property-logo") {
        form.append("file", await resizeToWebP(file), "logo");
      } else {
        // Photos also get a small copy, which the guest menu lists load instead.
        const { full, thumb } = await preparePhoto(file);
        form.append("file", full, "photo");
        form.append("thumb", thumb, "thumb");
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
            className={`${aspectClass} w-32 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Vorschau"
              className={`w-full h-full ${target.endsWith("-logo") ? "object-contain p-1" : "object-cover"}`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 font-sans text-sm font-medium text-stone-800 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-50"
            >
              {busy ? "…" : "Ersetzen"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 font-sans text-sm font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-50"
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
          className="rounded-xl border-2 border-dashed border-stone-300 px-5 py-4 font-sans text-sm font-medium text-stone-700 transition hover:border-stone-500 disabled:opacity-50"
        >
          {busy ? "Wird hochgeladen…" : (label ?? "+ Foto hinzufügen")}
        </button>
      )}

      {error && (
        <p className="max-w-[260px] font-sans text-sm leading-snug text-red-700">
          {error}
        </p>
      )}

      {target === "carta-item" && currentUrl && !busy && (
        <DishPhotoStudio itemId={id} onChange={onChange} />
      )}
    </div>
  );
}
