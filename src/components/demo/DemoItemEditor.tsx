"use client";

import { useState, useTransition } from "react";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item;
  currency: string;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

async function patchDemo(itemId: string, field: string, value: unknown) {
  await fetch("/api/demo/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, field, value }),
  });
}

export function DemoItemEditor({ item: initial, currency }: Props) {
  const [item, setItem] = useState(initial);
  const [priceInput, setPriceInput] = useState((initial.price_cents / 100).toFixed(2));
  const [descInput, setDescInput] = useState(initial.description ?? "");
  const [, startTransition] = useTransition();

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
      const res = await fetch("/api/demo/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, field: "price_cents", value: cents }),
      });
      if (!res.ok) {
        setItem(prev);
        setPriceInput((prev.price_cents / 100).toFixed(2));
      }
    });
  }

  function commitDesc() {
    const val = descInput.trim();
    if (val === (item.description ?? "")) return;
    const prev = item;
    setItem({ ...item, description: val });
    startTransition(async () => {
      const res = await fetch("/api/demo/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, field: "description", value: val }),
      });
      if (!res.ok) {
        setItem(prev);
        setDescInput(prev.description ?? "");
      }
    });
  }

  function toggleActive() {
    const next = !item.is_active;
    setItem({ ...item, is_active: next });
    startTransition(() => patchDemo(item.id, "is_active", next));
  }

  const dimmedStyle = !item.is_active ? { opacity: 0.4 } : {};

  return (
    <li
      style={{
        listStyle: "none",
        borderBottom: "1px solid var(--color-border)",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...dimmedStyle,
      }}
    >
      {/* Row 1: name + price + toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Active toggle */}
        <button
          onClick={toggleActive}
          title={item.is_active ? "Ausblenden" : "Einblenden"}
          style={{
            flexShrink: 0,
            width: 36,
            height: 20,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            backgroundColor: item.is_active ? "var(--accent)" : "var(--color-muted)",
            position: "relative",
            transition: "background-color 200ms",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: item.is_active ? 18 : 3,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#fff",
              transition: "left 200ms",
            }}
          />
        </button>

        {/* Name */}
        <span
          className="font-display"
          style={{
            flex: 1,
            fontSize: 16,
            color: "var(--color-text)",
            minWidth: 0,
          }}
        >
          {item.name}
        </span>

        {/* Price input */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            style={{
              width: 72,
              textAlign: "right",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--color-text)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "6px 8px",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--color-muted)", fontFamily: "var(--font-inter, sans-serif)" }}>
            {currency}
          </span>
        </div>
      </div>

      {/* Row 2: description */}
      <input
        type="text"
        value={descInput}
        onChange={(e) => setDescInput(e.target.value)}
        onBlur={commitDesc}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder="Beschreibung…"
        style={{
          width: "100%",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 12,
          color: "var(--color-dim)",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--color-border)",
          padding: "4px 0",
          outline: "none",
        }}
      />
    </li>
  );
}
