"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item;
  currency: string;
};

async function patchDemo(itemId: string, field: string, value: unknown) {
  return fetch("/api/demo/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, field, value }),
  });
}

export function DemoItemEditor({ item: initial, currency }: Props) {
  const [item, setItem] = useState(initial);
  const [priceInput, setPriceInput] = useState((initial.price_cents / 100).toFixed(2));
  const [allergensInput, setAllergensInput] = useState(initial.allergens ?? "");
  const [captionInput, setCaptionInput] = useState(initial.ai_caption ?? "");

  const [priceFocused, setPriceFocused] = useState(false);
  const [allergensFocused, setAllergensFocused] = useState(false);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDraft, setModalDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (captionModalOpen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
      setTimeout(() => modalTextareaRef.current?.focus(), 80);
    }
  }, [captionModalOpen]);

  function commitPrice() {
    const parsed = Number(priceInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceInput((item.price_cents / 100).toFixed(2));
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents === item.price_cents) return;
    const prev = item;
    setItem({ ...item, price_cents: cents });
    setPriceInput((cents / 100).toFixed(2));
    startTransition(async () => {
      const res = await patchDemo(item.id, "price_cents", cents);
      if (!res.ok) {
        setItem(prev);
        setPriceInput((prev.price_cents / 100).toFixed(2));
        setError("Fehler beim Speichern.");
      } else setError(null);
    });
  }

  function commitAllergens() {
    const val = allergensInput.trim() || null;
    if (val === (item.allergens ?? null)) return;
    const prev = item;
    setItem({ ...item, allergens: val });
    startTransition(async () => {
      const res = await patchDemo(item.id, "allergens", val);
      if (!res.ok) {
        setItem(prev);
        setAllergensInput(prev.allergens ?? "");
        setError("Fehler beim Speichern.");
      } else setError(null);
    });
  }

  function openCaptionModal() {
    setModalDraft(captionInput);
    setModalVisible(false);
    setCaptionModalOpen(true);
  }

  function closeCaptionModal() {
    setModalVisible(false);
    setTimeout(() => setCaptionModalOpen(false), 180);
  }

  function saveCaptionModal() {
    const val = modalDraft.trim() || null;
    setCaptionInput(modalDraft);
    closeCaptionModal();
    if (val === (item.ai_caption ?? null)) return;
    const prev = item;
    setItem({ ...item, ai_caption: val });
    startTransition(async () => {
      const res = await patchDemo(item.id, "ai_caption", val);
      if (!res.ok) {
        setItem(prev);
        setCaptionInput(prev.ai_caption ?? "");
        setError("Fehler beim Speichern.");
      } else setError(null);
    });
  }

  function toggleActive() {
    const next = !item.is_active;
    const prev = item;
    setItem({ ...item, is_active: next });
    startTransition(async () => {
      const res = await patchDemo(item.id, "is_active", next);
      if (!res.ok) setItem(prev);
    });
  }

  const modal = (
    <>
      <div
        onClick={closeCaptionModal}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          backgroundColor: "rgba(10,10,10,0.70)",
          opacity: modalVisible ? 1 : 0,
          pointerEvents: modalVisible ? "auto" : "none",
          transition: "opacity 180ms",
        }}
      />
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%", maxWidth: 560,
            backgroundColor: "var(--color-bg, #F5F0EC)",
            opacity: modalVisible ? 1 : 0,
            transform: modalVisible ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 180ms, transform 180ms",
            pointerEvents: "auto",
            maxHeight: "90dvh",
            display: "flex", flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{ fontFamily: "var(--font-inter, sans-serif)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", margin: 0 }}>
                Story
              </p>
              <p style={{ fontFamily: "var(--font-garamond, serif)", fontSize: 20, color: "var(--color-text)", margin: "2px 0 0" }}>
                {item.name}
              </p>
            </div>
            <button
              onClick={closeCaptionModal}
              style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", color: "var(--color-dim)",
                flexShrink: 0,
              }}
              aria-label="Schließen"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <textarea
              ref={modalTextareaRef}
              value={modalDraft}
              onChange={(e) => setModalDraft(e.target.value)}
              maxLength={280}
              placeholder="Eine elegante Beschreibung für dieses Gericht…"
              style={{
                width: "100%", minHeight: 180, resize: "none",
                background: "transparent", border: "none", outline: "none",
                fontFamily: "var(--font-garamond, serif)", fontStyle: "italic",
                fontSize: 18, lineHeight: 1.65,
                color: "var(--color-text)",
                boxSizing: "border-box",
              }}
              rows={8}
            />
            <div style={{ textAlign: "right", fontFamily: "var(--font-inter, sans-serif)", fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>
              {modalDraft.length} / 280
            </div>
          </div>

          <div
            style={{
              padding: "12px 20px calc(16px + env(safe-area-inset-bottom))",
              borderTop: "1px solid var(--color-border)", flexShrink: 0,
            }}
          >
            <button
              type="button"
              disabled
              title="KI-Generierung im Demo nicht verfügbar"
              style={{
                width: "100%", marginBottom: 10,
                fontFamily: "var(--font-inter, sans-serif)", fontSize: 11, letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "11px 16px", cursor: "not-allowed",
                border: "1px solid var(--accent)", color: "var(--accent)", background: "none",
                opacity: 0.3,
              }}
            >
              ✦ Generieren
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={closeCaptionModal}
                style={{
                  flex: 1,
                  fontFamily: "var(--font-inter, sans-serif)", fontSize: 11, letterSpacing: "0.1em",
                  textTransform: "uppercase", padding: "11px 16px", cursor: "pointer",
                  border: "1px solid var(--color-border)", color: "var(--color-dim)", background: "none",
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveCaptionModal}
                style={{
                  flex: 1,
                  fontFamily: "var(--font-inter, sans-serif)", fontSize: 11, letterSpacing: "0.1em",
                  textTransform: "uppercase", padding: "11px 16px", cursor: "pointer",
                  border: "none", backgroundColor: "var(--accent)", color: "#fff",
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
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Row 1: Name + description */}
        <div className="mb-3">
          <div className="font-display text-lg leading-tight" style={{ color: "var(--color-text)" }}>
            {item.name}
          </div>
          {item.description && (
            <div className="font-sans text-xs mt-0.5" style={{ color: "var(--color-dim)" }}>
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
              className="w-24 text-right bg-transparent outline-none font-sans tabular-nums text-base py-2"
              style={{
                borderBottom: `1px solid ${priceFocused ? "var(--accent)" : "var(--color-dim)"}`,
                color: "var(--color-text)",
              }}
            />
            <span className="font-sans text-xs" style={{ color: "var(--color-dim)" }}>{currency}</span>
          </label>

          <button
            onClick={toggleActive}
            className="font-sans text-xs tracking-regal uppercase px-4 py-3 transition shrink-0"
            style={item.is_active
              ? { border: "1px solid var(--color-dim)", color: "var(--color-text)" }
              : { border: "1px solid var(--accent)", color: "var(--accent)" }
            }
          >
            {item.is_active ? "Verfügbar" : "Ausverkauft"}
          </button>
        </div>

        {/* Row 3: Foto (disabled in demo) */}
        <div className="mt-3 flex items-start gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0 pt-1"
            style={{ color: "var(--color-muted)" }}
          >
            Foto
          </span>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              disabled
              title="Foto-Upload im Demo nicht verfügbar"
              className="font-sans text-xs tracking-regal uppercase px-4 py-3"
              style={{
                border: "1px solid var(--color-border)", color: "var(--color-dim)",
                opacity: 0.35, cursor: "not-allowed",
              }}
            >
              Foto hinzufügen
            </button>
          </div>
        </div>

        {/* Row 4: Story */}
        <div className="mt-3 flex items-center gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0"
            style={{ color: "var(--color-muted)" }}
          >
            Story
          </span>
          <div className="flex-1 min-w-0">
            {captionInput ? (
              <p className="font-display italic text-sm leading-snug truncate" style={{ color: "var(--color-dim)" }}>
                {captionInput}
              </p>
            ) : (
              <p className="font-sans text-xs" style={{ color: "var(--color-muted)" }}>
                Noch keine Story
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openCaptionModal}
            className="shrink-0 font-sans text-xs tracking-regal uppercase px-4 py-3 transition"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-dim)" }}
          >
            Bearbeiten
          </button>
        </div>

        {/* Row 5: Allergens */}
        <div className="mt-3 flex items-center gap-3">
          <span
            className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0"
            style={{ color: "var(--color-muted)" }}
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
              borderBottom: `1px solid ${allergensFocused ? "var(--accent)" : "var(--color-border)"}`,
              color: "var(--color-dim)",
            }}
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-700 font-sans">{error}</p>}
      </li>

      {captionModalOpen && createPortal(modal, document.body)}
    </>
  );
}
