"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item | null;
  currency: string;
  canUseAi?: boolean;
  onClose: () => void;
  onItemChange: (updated: Item) => void;
};

async function patchItem(
  itemId: string,
  updates: Record<string, unknown>,
): Promise<string | null> {
  const res = await fetch("/api/admin/item-update", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ itemId, updates }),
  });
  if (res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? "Fehler beim Speichern.";
}

// ── Inner sheet (rendered when item is not null) ────────────────
function Sheet({
  item: initial,
  currency,
  canUseAi,
  onClose,
  onItemChange,
}: {
  item: Item;
  currency: string;
  canUseAi: boolean;
  onClose: () => void;
  onItemChange: (updated: Item) => void;
}) {
  const [item, setItem] = useState<Item>(initial);
  const [visible, setVisible] = useState(false);
  const [priceInput, setPriceInput] = useState(
    (initial.price_cents / 100).toFixed(2),
  );
  const [allergensInput, setAllergensInput] = useState(
    initial.allergens ?? "",
  );
  const [captionDraft, setCaptionDraft] = useState(initial.ai_caption ?? "");
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [priceFocused, setPriceFocused] = useState(false);
  const [allergensFocused, setAllergensFocused] = useState(false);
  const [, startTransition] = useTransition();
  const captionRef = useRef<HTMLTextAreaElement>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 260);
  }

  function update(patch: Partial<Item>) {
    const next = { ...item, ...patch };
    setItem(next);
    onItemChange(next);
    return next;
  }

  // ── Price ──────────────────────────────────────────────────────
  async function commitPrice() {
    const parsed = Number(priceInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceInput((item.price_cents / 100).toFixed(2));
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents === item.price_cents) return;
    const prev = item;
    update({ price_cents: cents });
    setPriceInput((cents / 100).toFixed(2));
    startTransition(async () => {
      const err = await patchItem(item.id, { price_cents: cents });
      if (err) {
        setItem(prev);
        onItemChange(prev);
        setPriceInput((prev.price_cents / 100).toFixed(2));
        setError(err);
      } else setError(null);
    });
  }

  // ── Allergens ──────────────────────────────────────────────────
  async function commitAllergens() {
    const val = allergensInput.trim() || null;
    if (val === (item.allergens ?? null)) return;
    const prev = item;
    update({ allergens: val });
    startTransition(async () => {
      const err = await patchItem(item.id, { allergens: val });
      if (err) {
        setItem(prev);
        onItemChange(prev);
        setAllergensInput(prev.allergens ?? "");
        setError(err);
      } else setError(null);
    });
  }

  // ── Caption ────────────────────────────────────────────────────
  async function commitCaption() {
    const val = captionDraft.trim() || null;
    if (val === (item.ai_caption ?? null)) return;
    const prev = item;
    update({ ai_caption: val });
    startTransition(async () => {
      const err = await patchItem(item.id, { ai_caption: val });
      if (err) {
        setItem(prev);
        onItemChange(prev);
        setCaptionDraft(prev.ai_caption ?? "");
        setError(err);
      } else setError(null);
    });
  }

  // ── AI generate ────────────────────────────────────────────────
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
      setCaptionDraft(json.caption);
      update({ ai_caption: json.caption });
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setAiBusy(false);
    }
  }

  // ── Availability ───────────────────────────────────────────────
  async function toggleActive() {
    const prev = item;
    const next = update({ is_active: !item.is_active });
    startTransition(async () => {
      const err = await patchItem(item.id, { is_active: next.is_active });
      if (err) {
        setItem(prev);
        onItemChange(prev);
        setError(err);
      } else setError(null);
    });
  }

  const accent = "var(--accent, #C69B3C)";
  const bg = "var(--color-bg, #F5F0EC)";
  const textColor = "var(--color-text, #0A0A0A)";
  const dimColor = "var(--color-dim, rgba(10,10,10,0.55))";
  const mutedColor = "var(--color-muted, rgba(10,10,10,0.30))";
  const borderColor = "var(--color-border, rgba(10,10,10,0.10))";

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          backgroundColor: "rgba(10,10,10,0.65)",
          opacity: visible ? 1 : 0,
          transition: "opacity 260ms",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            backgroundColor: bg,
            borderRadius: "16px 16px 0 0",
            maxHeight: "92dvh",
            display: "flex",
            flexDirection: "column",
            pointerEvents: "auto",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(48px)",
            transition: "opacity 260ms ease, transform 260ms ease",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: borderColor }} />
          </div>

          {/* Header: item name + price + close */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "12px 24px 16px",
              borderBottom: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor, margin: 0 }}>
                Bearbeiten
              </p>
              <h2 style={{ fontFamily: "var(--font-garamond, serif)", fontSize: 22, color: textColor, margin: "4px 0 0", lineHeight: 1.2 }}>
                {item.name}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 16, color: accent, tabularNums: true } as React.CSSProperties}>
                {formatPrice(item.price_cents, currency)}
              </span>
              <button
                onClick={handleClose}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: mutedColor }}
                aria-label="Schließen"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px 32px" }}>

            {/* ── Photo ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 8 }}>
                Foto
              </label>
              <PhotoUploader
                target="carta-item"
                id={item.id}
                currentUrl={item.image_url}
                onChange={(url) => update({ image_url: url })}
                aspect="wide"
              />
            </div>

            {/* Separator */}
            <div style={{ height: 1, backgroundColor: borderColor, margin: "20px 0" }} />

            {/* ── Price + Availability ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 6 }}>
                  Preis
                </label>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onFocus={() => setPriceFocused(true)}
                    onBlur={() => { setPriceFocused(false); commitPrice(); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    style={{
                      width: 96,
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${priceFocused ? accent : dimColor}`,
                      outline: "none",
                      fontFamily: "var(--font-inter, sans-serif)",
                      fontSize: 20,
                      color: textColor,
                      textAlign: "right",
                      padding: "4px 0",
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 14, color: dimColor }}>€</span>
                </div>
              </div>

              <button
                onClick={toggleActive}
                style={{
                  fontFamily: "var(--font-inter, sans-serif)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "10px 20px",
                  cursor: "pointer",
                  border: item.is_active ? `1px solid ${borderColor}` : `1px solid ${accent}`,
                  color: item.is_active ? textColor : accent,
                  background: "none",
                }}
              >
                {item.is_active ? "Verfügbar" : "Ausverkauft"}
              </button>
            </div>

            {/* Separator */}
            <div style={{ height: 1, backgroundColor: borderColor, margin: "20px 0" }} />

            {/* ── Story (ai_caption) ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor }}>
                  Story
                </label>
                <button
                  onClick={generateCaption}
                  disabled={aiBusy || !canUseAi}
                  title={!canUseAi ? "Monatliches AI-Limit erreicht" : "Text generieren"}
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    cursor: (aiBusy || !canUseAi) ? "not-allowed" : "pointer",
                    border: `1px solid ${accent}`,
                    color: accent,
                    background: "none",
                    opacity: (aiBusy || !canUseAi) ? 0.35 : 1,
                  }}
                >
                  {aiBusy ? "…" : "✦ KI"}
                </button>
              </div>
              <textarea
                ref={captionRef}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                onBlur={commitCaption}
                maxLength={280}
                rows={4}
                placeholder="Eine elegante Beschreibung für dieses Gericht…"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${borderColor}`,
                  outline: "none",
                  fontFamily: "var(--font-garamond, serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                  lineHeight: 1.65,
                  color: textColor,
                  padding: "10px 12px",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ textAlign: "right", fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, color: mutedColor, marginTop: 4 }}>
                {captionDraft.length} / 280
              </div>
            </div>

            {/* ── Allergens ── */}
            <div>
              <label style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor, display: "block", marginBottom: 8 }}>
                Allergene
              </label>
              <input
                type="text"
                value={allergensInput}
                onChange={(e) => setAllergensInput(e.target.value)}
                onFocus={() => setAllergensFocused(true)}
                onBlur={() => { setAllergensFocused(false); commitAllergens(); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                placeholder="z.B. Gluten, Milch, Ei"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: `1px solid ${allergensFocused ? accent : borderColor}`,
                  outline: "none",
                  fontFamily: "var(--font-inter, sans-serif)",
                  fontSize: 14,
                  color: dimColor,
                  padding: "6px 0",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ marginTop: 16, fontFamily: "var(--font-inter, sans-serif)", fontSize: 12, color: "#DC2626" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ── Export ──────────────────────────────────────────────────────
export function ItemEditSheet({
  item,
  currency,
  canUseAi = true,
  onClose,
  onItemChange,
}: Props) {
  if (!item) return null;
  return (
    <Sheet
      item={item}
      currency={currency}
      canUseAi={canUseAi}
      onClose={onClose}
      onItemChange={onItemChange}
    />
  );
}
