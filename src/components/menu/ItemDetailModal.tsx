"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item | null;
  currency: string;
  onClose: () => void;
};

export function ItemDetailModal({ item, currency, onClose }: Props) {
  const isOpen = item !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(10,10,10,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Sheet — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-400 ease-out"
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          maxHeight: "90dvh",
          overflowY: "auto",
          backgroundColor: "var(--color-bg, #F5F0EC)",
        }}
      >
        {item && (
          <>
            {/* Photo */}
            {item.image_url && (
              <div className="w-full aspect-[4/3] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* gradient overlay so text below is readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="px-6 pt-7 pb-10 max-w-xl mx-auto">
              {/* Close pill */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-60"
                style={{ backgroundColor: "var(--color-border, rgba(10,10,10,0.10))" }}
                aria-label="Schließen"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="var(--color-text,#0A0A0A)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Name + price row */}
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2
                  className="font-display text-3xl md:text-4xl font-light leading-tight"
                  style={{ color: "var(--color-text, #0A0A0A)" }}
                >
                  {item.name}
                </h2>
                <span
                  className="font-sans text-xl tabular-nums whitespace-nowrap"
                  style={{ color: "var(--accent, #C69B3C)" }}
                >
                  {formatPrice(item.price_cents, currency)}
                </span>
              </div>

              {/* Gold hairline */}
              <div className="w-10 h-px mb-5" style={{ backgroundColor: "var(--accent, #C69B3C)", opacity: 0.6 }} />

              {/* Story / ai_caption */}
              {item.ai_caption && (
                <p
                  className="font-display text-lg md:text-xl italic leading-relaxed mb-5"
                  style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}
                >
                  {item.ai_caption}
                </p>
              )}

              {/* Short description (ingredient note) */}
              {item.description && (
                <p
                  className="font-sans text-sm leading-relaxed mb-4"
                  style={{ color: "var(--color-dim, rgba(10,10,10,0.60))" }}
                >
                  {item.description}
                </p>
              )}

              {/* Allergens */}
              {item.allergens && (
                <p
                  className="font-sans text-[11px] tracking-wide mt-4 pt-4"
                  style={{
                    color: "var(--color-muted, rgba(10,10,10,0.35))",
                    borderTop: "1px solid var(--color-border, rgba(10,10,10,0.10))",
                  }}
                >
                  Allergene: {item.allergens}
                </p>
              )}

              {!item.is_active && (
                <div
                  className="mt-5 font-sans text-[11px] tracking-regal uppercase px-3 py-1.5 inline-block"
                  style={{
                    color: "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Derzeit nicht verfügbar
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
