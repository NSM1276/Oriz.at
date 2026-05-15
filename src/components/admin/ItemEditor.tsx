"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const [priceFocused, setPriceFocused] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [allergensFocused, setAllergensFocused] = useState(false);
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
      router.refresh();
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
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

      {/* AI caption */}
      <div className="mt-3 ml-0 flex items-start gap-3">
        <span
          className="font-sans text-[10px] tracking-regal uppercase w-20 shrink-0 pt-2"
          style={{ color: 'var(--color-muted)' }}
        >
          Story
        </span>
        <textarea
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          onFocus={() => setCaptionFocused(true)}
          onBlur={() => { setCaptionFocused(false); commitCaption(); }}
          rows={2}
          maxLength={280}
          placeholder="Eine elegante Beschreibung — oder per Klick generieren."
          className="flex-1 resize-none bg-transparent outline-none font-display italic text-sm px-3 py-2 leading-relaxed placeholder:not-italic placeholder:font-sans placeholder:text-xs"
          style={{
            border: `1px solid ${captionFocused ? 'var(--accent)' : 'var(--color-border)'}`,
            color: 'var(--color-text)',
          }}
        />
        <button
          type="button"
          onClick={generateCaption}
          disabled={aiBusy || !canUseAi}
          title={!canUseAi ? "Monatliches AI-Limit erreicht" : "Text generieren"}
          className="shrink-0 font-sans text-[10px] tracking-regal uppercase px-3 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
        >
          {aiBusy ? "Generiert…" : "Generieren"}
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
  );
}
