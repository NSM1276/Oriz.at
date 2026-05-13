"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item } from "@/lib/supabase/types";

export function ItemEditor({ initial }: { initial: Item }) {
  const [item, setItem] = useState<Item>(initial);
  const [priceInput, setPriceInput] = useState(
    (initial.price_cents / 100).toFixed(2),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const supabase = createClient();

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
      const { error } = await supabase
        .from("items")
        .update({ price_cents: cents })
        .eq("id", item.id);
      if (error) {
        setItem(prev);
        setPriceInput((prev.price_cents / 100).toFixed(2));
        setError(error.message);
      } else {
        setError(null);
      }
    });
  }

  async function toggleActive() {
    const prev = item;
    const next = { ...item, is_active: !item.is_active };
    setItem(next);
    startTransition(async () => {
      const { error } = await supabase
        .from("items")
        .update({ is_active: next.is_active })
        .eq("id", item.id);
      if (error) {
        setItem(prev);
        setError(error.message);
      } else {
        setError(null);
      }
    });
  }

  return (
    <li
      className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4 border-b border-onyx/10 ${
        item.is_active ? "" : "opacity-50"
      }`}
    >
      <div className="min-w-0">
        <div className="font-display text-xl text-onyx truncate">{item.name}</div>
        {item.description && (
          <div className="font-sans text-xs text-onyx/60 truncate">
            {item.description}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-24 text-right bg-transparent border-b border-onyx/40 focus:border-gold outline-none font-sans tabular-nums py-1"
        />
        <span className="font-sans text-xs text-onyx/60">€</span>
      </label>

      <button
        onClick={toggleActive}
        className={`font-sans text-[10px] tracking-regal uppercase px-3 py-1.5 border transition ${
          item.is_active
            ? "border-onyx/30 text-onyx hover:border-onyx"
            : "border-gold text-gold hover:bg-gold hover:text-parchment"
        }`}
      >
        {item.is_active ? "Available" : "Sold out"}
      </button>

      {error && (
        <p className="col-span-3 text-xs text-red-700 font-sans">{error}</p>
      )}
    </li>
  );
}
