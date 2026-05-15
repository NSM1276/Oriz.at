"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUploadError, uploadItemImage, extractStoragePath } from "@/lib/imageUpload";
import type { Item } from "@/lib/supabase/types";

type Props = {
  initial: Item;
  /** Tells the editor whether a "Generate AI text" call would be allowed. */
  canUseAi?: boolean;
};

export function ItemEditor({ initial, canUseAi = true }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [item, setItem] = useState<Item>(initial);
  const [priceInput, setPriceInput] = useState((initial.price_cents / 100).toFixed(2));
  const [allergensInput, setAllergensInput] = useState(initial.allergens ?? "");
  const [captionInput, setCaptionInput] = useState(initial.ai_caption ?? "");

  const [error, setError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [, startTransition] = useTransition();

  // ── price ──────────────────────────────────────────────────────────────
  async function commitPrice() {
    const parsed = Number(priceInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceInput((item.price_cents / 100).toFixed(2));
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents === item.price_cents) return;
    const prev = item;
    const next = { ...item, price_cents: cents };
    setItem(next);
    setPriceInput((cents / 100).toFixed(2));
    startTransition(async () => {
      const { error } = await supabase.from("items").update({ price_cents: cents }).eq("id", item.id);
      if (error) {
        setItem(prev);
        setPriceInput((prev.price_cents / 100).toFixed(2));
        setError(error.message);
      } else setError(null);
    });
  }

  // ── allergens ──────────────────────────────────────────────────────────
  async function commitAllergens() {
    const val = allergensInput.trim() || null;
    if (val === (item.allergens ?? null)) return;
    const prev = item;
    setItem({ ...item, allergens: val });
    startTransition(async () => {
      const { error } = await supabase.from("items").update({ allergens: val }).eq("id", item.id);
      if (error) {
        setItem(prev);
        setAllergensInput(prev.allergens ?? "");
        setError(error.message);
      } else setError(null);
    });
  }

  // ── ai_caption (manual edit) ───────────────────────────────────────────
  async function commitCaption() {
    const val = captionInput.trim() || null;
    if (val === (item.ai_caption ?? null)) return;
    const prev = item;
    setItem({ ...item, ai_caption: val });
    startTransition(async () => {
      const { error } = await supabase.from("items").update({ ai_caption: val }).eq("id", item.id);
      if (error) {
        setItem(prev);
        setCaptionInput(prev.ai_caption ?? "");
        setError(error.message);
      } else setError(null);
    });
  }

  // ── availability toggle ────────────────────────────────────────────────
  async function toggleActive() {
    const prev = item;
    const next = { ...item, is_active: !item.is_active };
    setItem(next);
    startTransition(async () => {
      const { error } = await supabase.from("items").update({ is_active: next.is_active }).eq("id", item.id);
      if (error) {
        setItem(prev);
        setError(error.message);
      } else setError(null);
    });
  }

  // ── photo upload ───────────────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPhotoBusy(true);
    try {
      const url = await uploadItemImage({
        supabase,
        file,
        venueId: item.venue_id,
        itemId: item.id,
        previousUrl: item.image_url,
      });
      const { error: dbErr } = await supabase
        .from("items")
        .update({ image_url: url })
        .eq("id", item.id);
      if (dbErr) throw new ImageUploadError(dbErr.message);
      setItem({ ...item, image_url: url });
    } catch (err) {
      const msg = err instanceof ImageUploadError ? err.message : "Upload fehlgeschlagen.";
      setError(msg);
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    if (!item.image_url) return;
    setError(null);
    setPhotoBusy(true);
    const previousUrl = item.image_url;
    try {
      const { error: dbErr } = await supabase
        .from("items")
        .update({ image_url: null })
        .eq("id", item.id);
      if (dbErr) throw new ImageUploadError(dbErr.message);
      setItem({ ...item, image_url: null });
      const path = extractStoragePath(previousUrl);
      if (path) {
        supabase.storage.from("item-images").remove([path]).catch(() => { /* ignore */ });
      }
    } catch (err) {
      const msg = err instanceof ImageUploadError ? err.message : "Löschen fehlgeschlagen.";
      setError(msg);
    } finally {
      setPhotoBusy(false);
    }
  }

  // ── AI caption generation ──────────────────────────────────────────────
  async function generateCaption() {
    setError(null);
    setAiBusy(true);
    try {
      const res = await fetch("/api/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "AI-Generierung fehlgeschlagen.");
        return;
      }
      setItem({ ...item, ai_caption: json.caption });
      setCaptionInput(json.caption);
      // Refresh server data so the page-level credit counter updates.
      router.refresh();
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <li className={`py-6 border-b border-onyx/10 ${item.is_active ? "" : "opacity-60"}`}>
      <div className="grid grid-cols-[88px_1fr_auto_auto] items-start gap-4">
        {/* Photo */}
        <div className="relative w-[88px] h-[88px] bg-onyx/5 border border-onyx/10 overflow-hidden group">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-onyx/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/>
                <path d="M3 17l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photoBusy}
            className="absolute inset-0 bg-onyx/70 text-parchment text-[10px] tracking-regal uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-100 disabled:bg-onyx/50"
            aria-label="Foto hochladen"
          >
            {photoBusy ? "…" : item.image_url ? "Ersetzen" : "Hochladen"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Name + meta */}
        <div className="min-w-0">
          <div className="font-display text-xl text-onyx leading-tight">{item.name}</div>
          {item.description && (
            <div className="font-sans text-xs text-onyx/60 mt-0.5 truncate">{item.description}</div>
          )}
          {item.image_url && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={photoBusy}
              className="mt-2 font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-onyx underline-offset-4 hover:underline disabled:opacity-50"
            >
              Foto entfernen
            </button>
          )}
        </div>

        {/* Price */}
        <label className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-24 text-right bg-transparent border-b border-onyx/40 focus:border-gold outline-none font-sans tabular-nums py-1"
          />
          <span className="font-sans text-xs text-onyx/60">€</span>
        </label>

        {/* Active toggle */}
        <button
          onClick={toggleActive}
          className={`font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 border transition ${
            item.is_active
              ? "border-onyx/30 text-onyx hover:border-onyx"
              : "border-gold text-gold hover:bg-gold hover:text-parchment"
          }`}
        >
          {item.is_active ? "Verfügbar" : "Ausverkauft"}
        </button>
      </div>

      {/* AI caption */}
      <div className="mt-3 ml-[104px] flex items-start gap-3">
        <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 w-20 shrink-0 pt-2">
          Story
        </span>
        <textarea
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          onBlur={commitCaption}
          rows={2}
          maxLength={280}
          placeholder="Eine elegante Beschreibung — oder per Klick generieren."
          className="flex-1 resize-none bg-transparent border border-onyx/15 focus:border-gold outline-none font-display italic text-sm text-onyx/80 px-3 py-2 leading-relaxed placeholder:not-italic placeholder:font-sans placeholder:text-onyx/30 placeholder:text-xs"
        />
        <button
          type="button"
          onClick={generateCaption}
          disabled={aiBusy || !canUseAi}
          title={!canUseAi ? "Monatliches AI-Limit erreicht" : "Text generieren"}
          className="shrink-0 font-sans text-[10px] tracking-regal uppercase border border-gold text-gold px-3 py-2 hover:bg-gold hover:text-parchment transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          {aiBusy ? "Generiert…" : "Generieren"}
        </button>
      </div>

      {/* Allergens */}
      <div className="mt-3 ml-[104px] flex items-center gap-3">
        <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 w-20 shrink-0">
          Allergene
        </span>
        <input
          type="text"
          value={allergensInput}
          onChange={(e) => setAllergensInput(e.target.value)}
          onBlur={commitAllergens}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="z.B. A, C, G, L"
          className="flex-1 bg-transparent border-b border-onyx/15 focus:border-gold outline-none font-sans text-xs text-onyx/70 py-1"
        />
      </div>

      {error && <p className="mt-2 ml-[104px] text-xs text-red-700 font-sans">{error}</p>}
    </li>
  );
}
