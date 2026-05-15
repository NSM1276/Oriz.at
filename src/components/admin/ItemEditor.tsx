"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadItemImage, extractStoragePath, ImageUploadError } from "@/lib/imageUpload";
import type { Item } from "@/lib/supabase/types";

type Props = {
  initial: Item;
  canUseAi?: boolean;
};

export function ItemEditor({ initial, canUseAi = true }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<Item>(initial);
  const [priceInput, setPriceInput] = useState((initial.price_cents / 100).toFixed(2));
  const [allergensInput, setAllergensInput] = useState(initial.allergens ?? "");
  const [captionInput, setCaptionInput] = useState(initial.ai_caption ?? "");

  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [priceFocused, setPriceFocused] = useState(false);
  const [allergensFocused, setAllergensFocused] = useState(false);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState("");
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!captionModalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCaptionModal(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [captionModalOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (captionModalOpen) {
      setTimeout(() => modalTextareaRef.current?.focus(), 50);
    }
  }, [captionModalOpen]);

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

  // ── ai_caption ────────────────────────────────────────────────────────
  function openCaptionModal() {
    setModalDraft(captionInput);
    setCaptionModalOpen(true);
  }

  function closeCaptionModal() {
    setCaptionModalOpen(false);
  }

  async function saveCaptionModal() {
    const val = modalDraft.trim() || null;
    setCaptionInput(modalDraft);
    setCaptionModalOpen(false);
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

  // ── photo upload / remove ──────────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
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
      const { error: dbErr } = await supabase.from("items").update({ image_url: url }).eq("id", item.id);
      if (dbErr) throw new ImageUploadError(dbErr.message);
      setItem({ ...item, image_url: url });
    } catch (err) {
      setError(err instanceof ImageUploadError ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!item.image_url) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const path = extractStoragePath(item.image_url);
      if (path) await supabase.storage.from("item-images").remove([path]);
      const { error: dbErr } = await supabase.from("items").update({ image_url: null }).eq("id", item.id);
      if (dbErr) throw new Error(dbErr.message);
      setItem({ ...item, image_url: null });
    } catch {
      setError("Foto konnte nicht gelöscht werden.");
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
      // update modal draft too if modal is open
      setModalDraft(json.caption);
      router.refresh();
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setAiBusy(false);
    }
  }

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCaptionModal}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          backgroundColor: "rgba(10,10,10,0.70)",
          opacity: captionModalOpen ? 1 : 0,
          pointerEvents: captionModalOpen ? "auto" : "none",
          transition: 'opacity 200ms',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 560,
            backgroundColor: "var(--color-bg, #F5F0EC)",
            opacity: captionModalOpen ? 1 : 0,
            transform: captionModalOpen ? "translateY(0)" : "translateY(32px)",
            transition: 'opacity 200ms, transform 200ms',
            pointerEvents: captionModalOpen ? 'auto' : 'none',
            maxHeight: '90dvh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Modal header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-inter, sans-serif)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', margin: 0 }}>
                Story
              </p>
              <p style={{ fontFamily: 'var(--font-garamond, serif)', fontSize: 20, color: 'var(--color-text)', margin: '2px 0 0' }}>
                {item.name}
              </p>
            </div>
            <button
              onClick={closeCaptionModal}
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-dim)',
                flexShrink: 0,
              }}
              aria-label="Schließen"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <textarea
              ref={modalTextareaRef}
              value={modalDraft}
              onChange={(e) => setModalDraft(e.target.value)}
              maxLength={280}
              placeholder="Eine elegante Beschreibung für dieses Gericht…"
              style={{
                width: '100%', minHeight: 180, resize: 'none',
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'var(--font-garamond, serif)', fontStyle: 'italic',
                fontSize: 18, lineHeight: 1.65,
                color: 'var(--color-text)',
                boxSizing: 'border-box',
              }}
              rows={8}
            />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-inter, sans-serif)', fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              {modalDraft.length} / 280
            </div>
          </div>

          {/* Modal footer */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '16px 24px', borderTop: '1px solid var(--color-border)', flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={generateCaption}
              disabled={aiBusy || !canUseAi}
              title={!canUseAi ? "Monatliches AI-Limit erreicht" : "Text generieren"}
              style={{
                fontFamily: 'var(--font-inter, sans-serif)', fontSize: 11, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '10px 16px', cursor: 'pointer',
                border: '1px solid var(--accent)', color: 'var(--accent)', background: 'none',
                opacity: (aiBusy || !canUseAi) ? 0.3 : 1,
              }}
            >
              {aiBusy ? "Generiert…" : "✦ Generieren"}
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={closeCaptionModal}
                style={{
                  fontFamily: 'var(--font-inter, sans-serif)', fontSize: 11, letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '10px 16px', cursor: 'pointer',
                  border: '1px solid var(--color-border)', color: 'var(--color-dim)', background: 'none',
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveCaptionModal}
                style={{
                  fontFamily: 'var(--font-inter, sans-serif)', fontSize: 11, letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '10px 16px', cursor: 'pointer',
                  border: 'none', backgroundColor: 'var(--accent)', color: '#fff',
                }}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <li
        className={`py-5 ${item.is_active ? "" : "opacity-60"}`}
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {/* Row 1: Name + description */}
        <div className="mb-3">
          <div className="font-display text-lg leading-tight" style={{ color: 'var(--color-text)' }}>
            {item.name}
          </div>
          {item.description && (
            <div className="font-sans text-xs mt-0.5" style={{ color: 'var(--color-dim)' }}>
              {item.description}
            </div>
          )}
        </div>

        {/* Row 2: Price + Toggle */}
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onFocus={() => setPriceFocused(true)}
              onBlur={() => { setPriceFocused(false); commitPrice(); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="w-24 text-right bg-transparent outline-none font-sans tabular-nums py-1"
              style={{
                borderBottom: `1px solid ${priceFocused ? 'var(--accent)' : 'var(--color-dim)'}`,
                color: 'var(--color-text)',
              }}
            />
            <span className="font-sans text-xs" style={{ color: 'var(--color-dim)' }}>€</span>
          </label>

          <button
            onClick={toggleActive}
            className="font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 transition shrink-0"
            style={item.is_active
              ? { border: '1px solid var(--color-dim)', color: 'var(--color-text)' }
              : { border: '1px solid var(--accent)', color: 'var(--accent)' }
            }
          >
            {item.is_active ? "Verfügbar" : "Ausverkauft"}
          </button>
        </div>

        {/* Photo */}
        <div className="mt-3 ml-0 flex items-start gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0 pt-1"
            style={{ color: 'var(--color-muted)' }}
          >
            Foto
          </span>
          <div className="flex-1 min-w-0">
            {item.image_url ? (
              <div className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full object-cover"
                  style={{ maxHeight: 160, maxWidth: 280 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={photoBusy}
                    className="font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 transition disabled:opacity-30"
                    style={{ border: '1px solid var(--color-dim)', color: 'var(--color-dim)' }}
                  >
                    {photoBusy ? "Lädt hoch…" : "Ändern"}
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoBusy}
                    className="font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 transition disabled:opacity-30"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    {photoBusy ? "Löscht…" : "Entfernen"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 transition disabled:opacity-30"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-dim)' }}
              >
                {photoBusy ? "Lädt hoch…" : "Foto hinzufügen"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Story — compact preview row */}
        <div className="mt-3 ml-0 flex items-center gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0"
            style={{ color: 'var(--color-muted)' }}
          >
            Story
          </span>
          <div className="flex-1 min-w-0">
            {captionInput ? (
              <p
                className="font-display italic text-sm leading-snug truncate"
                style={{ color: 'var(--color-dim)' }}
              >
                {captionInput}
              </p>
            ) : (
              <p className="font-sans text-xs" style={{ color: 'var(--color-muted)' }}>
                Noch keine Story
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openCaptionModal}
            className="shrink-0 font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 transition"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-dim)' }}
          >
            Bearbeiten
          </button>
        </div>

        {/* Allergens */}
        <div className="mt-3 ml-0 flex items-center gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0"
            style={{ color: 'var(--color-muted)' }}
          >
            Allergene
          </span>
          <input
            type="text"
            value={allergensInput}
            onChange={(e) => setAllergensInput(e.target.value)}
            onFocus={() => setAllergensFocused(true)}
            onBlur={() => { setAllergensFocused(false); commitAllergens(); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder="z.B. A, C, G, L"
            className="flex-1 bg-transparent outline-none font-sans text-xs py-1"
            style={{
              borderBottom: `1px solid ${allergensFocused ? 'var(--accent)' : 'var(--color-border)'}`,
              color: 'var(--color-dim)',
            }}
          />
        </div>

        {error && <p className="mt-2 ml-0 text-xs text-red-700 font-sans">{error}</p>}
      </li>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
