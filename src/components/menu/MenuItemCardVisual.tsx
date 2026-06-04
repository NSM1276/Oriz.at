"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

interface Props {
  item: Item;
  currency: string;
  onClick: (item: Item) => void;
}

const hasDetail = (item: Item) =>
  !!(item.description || item.image_url || item.ai_caption);

export function MenuItemCardVisual({ item, currency, onClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const dim = !item.is_active;
  const clickable = hasDetail(item);
  const hasPhoto = !!item.image_url && !imgError;

  if (hasPhoto) {
    return (
      <article
        onClick={clickable ? () => onClick(item) : undefined}
        className="group relative overflow-hidden card-shimmer"
        style={{
          cursor: clickable ? "pointer" : "default",
          borderRadius: 10,
          opacity: dim ? 0.4 : 1,
          height: "clamp(155px, 44vw, 210px)",
        }}
      >
        {/* Photo — always visible, no opacity tricks */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url!}
          alt={item.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover kenburns transition-transform duration-700 group-active:scale-105"
          style={{ display: "block" }}
        />

        {/* Dark gradient over photo for text legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.05) 80%)",
            borderRadius: 10,
          }}
        />

        {/* Tap arrow — top right */}
        {clickable && !dim && (
          <div
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Text overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <div className="flex items-end gap-2">
            <h3
              className="font-display text-white flex-1 min-w-0"
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.2,
                textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {item.name}
            </h3>
            <span
              className="shrink-0 font-sans text-sm tabular-nums font-semibold"
              style={{ color: "var(--accent)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {formatPrice(item.price_cents, currency)}
            </span>
          </div>
        </div>

        {/* Sold-out overlay */}
        {dim && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10 }}
          >
            <span
              className="font-sans text-[10px] tracking-regal uppercase px-2 py-1"
              style={{ color: "rgba(245,240,236,0.7)", border: "1px solid rgba(245,240,236,0.3)" }}
            >
              Nicht verfügbar
            </span>
          </div>
        )}
      </article>
    );
  }

  /* ── Text-only fallback ── */
  return (
    <article
      onClick={clickable ? () => onClick(item) : undefined}
      className="group flex items-baseline gap-4 py-4"
      style={{
        borderBottom: "1px solid var(--color-border)",
        opacity: dim ? 0.4 : 1,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3
            className="font-display text-xl transition-opacity group-hover:opacity-60 group-active:opacity-60"
            style={{ color: "var(--color-text)" }}
          >
            {item.name}
          </h3>
          {clickable && !dim && (
            <span className="font-sans text-[10px] opacity-40" style={{ color: "var(--accent)" }} aria-hidden>›</span>
          )}
          {dim && (
            <span className="font-sans text-[10px] tracking-regal uppercase px-1.5 py-0.5"
              style={{ color: "var(--color-dim)", border: "1px solid var(--color-border)" }}>
              N/A
            </span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-sm mt-1 leading-relaxed" style={{ color: "var(--color-dim)" }}>
            {item.description}
          </p>
        )}
        {item.allergens?.trim() && (
          <p className="font-sans text-[11px] mt-1 tracking-wide" style={{ color: "var(--color-muted)" }}>
            {item.allergens}
          </p>
        )}
      </div>
      <div className="font-sans text-base tabular-nums shrink-0" style={{ color: "var(--color-text)" }}>
        {formatPrice(item.price_cents, currency)}
      </div>
    </article>
  );
}
