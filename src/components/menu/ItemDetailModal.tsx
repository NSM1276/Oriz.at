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
          backgroundColor: "rgba(10,10,10,0.65)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Centered modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
      >
        <div
          className="w-full max-w-[520px] pointer-events-auto transition-all duration-300 overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg, #F5F0EC)",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
            maxHeight: "90dvh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {item && (
            <>
              {/* Photo — only if set; hidden silently if URL is broken */}
              {item.image_url && (
                <div className="w-full overflow-hidden" style={{ maxHeight: 220 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="kenburns w-full object-cover"
                    style={{ maxHeight: 220 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              {/* Content — scrollable if text is long */}
              <div className="overflow-y-auto px-7 pt-6 pb-8 relative">

                {/* Close button — always visible, top-right of content area */}
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-50"
                  style={{ color: "var(--color-dim, rgba(10,10,10,0.5))" }}
                  aria-label="Schließen"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Name + price */}
                <div className="flex items-baseline justify-between gap-4 pr-8 mb-3">
                  <h2
                    className="font-display text-3xl font-light leading-tight"
                    style={{ color: "var(--color-text, #0A0A0A)" }}
                  >
                    {item.name}
                  </h2>
                  <span
                    className="font-sans text-lg tabular-nums whitespace-nowrap shrink-0"
                    style={{ color: "var(--accent, #C69B3C)" }}
                  >
                    {formatPrice(item.price_cents, currency)}
                  </span>
                </div>

                {/* Gold hairline */}
                <div className="w-8 h-px mb-5" style={{ backgroundColor: "var(--accent, #C69B3C)", opacity: 0.7 }} />

                {/* Story — AI caption if available, otherwise description promoted to story style */}
                {item.ai_caption ? (
                  <>
                    <p
                      className="font-display text-lg italic leading-relaxed mb-4"
                      style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}
                    >
                      {item.ai_caption}
                    </p>
                    {/* Description below story as ingredient line */}
                    {item.description && (
                      <p
                        className="font-sans text-sm leading-relaxed mb-3"
                        style={{ color: "var(--color-muted, rgba(10,10,10,0.40))" }}
                      >
                        {item.description}
                      </p>
                    )}
                  </>
                ) : item.description ? (
                  /* No AI caption — description takes the Story slot */
                  <p
                    className="font-display text-xl italic leading-relaxed mb-4"
                    style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}
                  >
                    {item.description}
                  </p>
                ) : null}

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
                    style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
                  >
                    Derzeit nicht verfügbar
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
