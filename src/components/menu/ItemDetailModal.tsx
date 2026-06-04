"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

type Theme = "classic" | "modern" | "visual";

type Props = {
  item: Item | null;
  currency: string;
  onClose: () => void;
  theme?: Theme;
  accent?: string;
};

// ── Classic modal ───────────────────────────────────────────────
function ModalClassic({ item, currency, onClose, accent }: Omit<Props, "theme"> & { item: Item; accent: string }) {
  return (
    <>
      <motion.div
        key="backdrop-classic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(10,10,10,0.65)" }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          key="modal-classic"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[520px] pointer-events-auto overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg, #F5F0EC)",
            maxHeight: "90dvh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {item.image_url && (
            <div className="w-full overflow-hidden shrink-0"
              style={{ backgroundColor: "var(--color-bg, #F5F0EC)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name}
                className="kenburns w-full block object-contain"
                style={{ maxHeight: "45dvh" }}
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />
            </div>
          )}
          <div className="overflow-y-auto px-7 pt-6 pb-8 relative">
            <button onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-50"
              style={{ color: "var(--color-dim, rgba(10,10,10,0.5))" }} aria-label="Schließen">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-baseline justify-between gap-4 pr-8 mb-3">
              <h2 className="font-display text-3xl font-light leading-tight shimmer-heading">
                {item.name}
              </h2>
              <span className="font-sans text-lg tabular-nums whitespace-nowrap shrink-0" style={{ color: accent }}>
                {formatPrice(item.price_cents, currency)}
              </span>
            </div>
            <div className="w-8 h-px mb-5" style={{ backgroundColor: accent, opacity: 0.7 }} />
            {item.ai_caption ? (
              <>
                <p className="font-display text-lg italic leading-relaxed mb-4" style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}>
                  {item.ai_caption}
                </p>
                {item.description && (
                  <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--color-muted, rgba(10,10,10,0.40))" }}>
                    {item.description}
                  </p>
                )}
              </>
            ) : item.description ? (
              <p className="font-display text-xl italic leading-relaxed mb-4" style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}>
                {item.description}
              </p>
            ) : null}
            {item.allergens?.trim() && (
              <p className="font-sans text-[11px] tracking-wide mt-4 pt-4"
                style={{ color: "var(--color-muted, rgba(10,10,10,0.35))", borderTop: "1px solid var(--color-border, rgba(10,10,10,0.10))" }}>
                Allergene: {item.allergens}
              </p>
            )}
            {!item.is_active && (
              <div className="mt-5 font-sans text-[11px] tracking-regal uppercase px-3 py-1.5 inline-block"
                style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                Derzeit nicht verfügbar
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Visual modal — dark, immersive, bottom sheet ────────────────
function ModalVisual({ item, currency, onClose, accent }: Omit<Props, "theme"> & { item: Item; accent: string }) {
  return (
    <>
      <motion.div
        key="backdrop-visual"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(10,10,10,0.80)" }}
      />
      {/* Bottom sheet */}
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        <motion.div
          key="modal-visual"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 38, mass: 0.9 }}
          className="w-full max-w-lg pointer-events-auto overflow-hidden"
          style={{
            backgroundColor: "#1C1208",
            borderRadius: "16px 16px 0 0",
            maxHeight: "92dvh",
            display: "flex",
            flexDirection: "column",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(245,240,236,0.2)" }} />
          </div>

          {/* Photo — full, no crop, max 45dvh */}
          {item.image_url ? (
            <div className="relative overflow-hidden shrink-0"
              style={{ backgroundColor: "#1C1208" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name}
                className="kenburns w-full block object-contain"
                style={{ maxHeight: "45dvh" }}
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />
              {/* Gradient overlay bottom */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to top, #1C1208 0%, rgba(28,18,8,0.5) 40%, transparent 70%)" }} />
              {/* Price badge over photo */}
              <div className="absolute bottom-4 right-4 font-sans text-base tabular-nums px-3 py-1.5"
                style={{ backgroundColor: "rgba(28,18,8,0.8)", color: accent, backdropFilter: "blur(8px)", border: `1px solid ${accent}33` }}>
                {formatPrice(item.price_cents, currency)}
              </div>
            </div>
          ) : (
            /* No photo — show price prominently */
            <div className="px-7 pt-4 pb-2 flex items-center justify-between shrink-0">
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(245,240,236,0.1)" }} />
              <span className="font-display text-2xl mx-4 tabular-nums" style={{ color: accent }}>
                {formatPrice(item.price_cents, currency)}
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(245,240,236,0.1)" }} />
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto px-7 pt-5 pb-10 relative">
            <button onClick={onClose}
              className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-50"
              style={{ color: "rgba(245,240,236,0.4)" }} aria-label="Schließen">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <h2 className="font-display font-light leading-tight mb-3 pr-8 shimmer-heading"
              style={{ fontSize: "clamp(1.7rem, 5vw, 2.2rem)" }}>
              {item.name}
            </h2>

            <div className="w-12 h-px mb-4" style={{ backgroundColor: accent, opacity: 0.6 }} />

            {item.ai_caption ? (
              <>
                <p className="font-display italic leading-relaxed mb-3"
                  style={{ fontSize: "1.05rem", color: "rgba(245,240,236,0.65)" }}>
                  {item.ai_caption}
                </p>
                {item.description && (
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(245,240,236,0.38)" }}>
                    {item.description}
                  </p>
                )}
              </>
            ) : item.description ? (
              <p className="font-display italic leading-relaxed"
                style={{ fontSize: "1.05rem", color: "rgba(245,240,236,0.65)" }}>
                {item.description}
              </p>
            ) : null}

            {item.allergens?.trim() && (
              <p className="font-sans text-[11px] tracking-wide uppercase mt-5 pt-4"
                style={{ color: "rgba(245,240,236,0.25)", borderTop: "1px solid rgba(245,240,236,0.08)" }}>
                {item.allergens}
              </p>
            )}

            {!item.is_active && (
              <div className="mt-4 font-sans text-[11px] tracking-regal uppercase px-3 py-1.5 inline-block"
                style={{ color: "rgba(245,240,236,0.3)", border: "1px solid rgba(245,240,236,0.12)" }}>
                Derzeit nicht verfügbar
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Modern modal — clean side panel, slides from right ──────────
function ModalModern({ item, currency, onClose, accent }: Omit<Props, "theme"> & { item: Item; accent: string }) {
  return (
    <>
      <motion.div
        key="backdrop-modern"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(10,10,10,0.45)" }}
      />
      {/* Right drawer */}
      <div className="fixed inset-0 z-50 flex items-stretch justify-end pointer-events-none">
        <motion.div
          key="modal-modern"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
          className="pointer-events-auto overflow-hidden flex flex-col"
          style={{
            width: "min(420px, 100vw)",
            backgroundColor: "var(--color-bg, #F5F0EC)",
            borderLeft: `1px solid var(--color-border, rgba(10,10,10,0.08))`,
            maxHeight: "100dvh",
          }}
        >
          {/* Header row */}
          <div className="flex items-start justify-between px-8 pt-10 pb-6 shrink-0"
            style={{ borderBottom: "1px solid var(--color-border, rgba(10,10,10,0.08))" }}>
            <div className="flex-1 pr-4">
              {/* Price above name */}
              <span className="font-sans text-[11px] tracking-regal uppercase block mb-2"
                style={{ color: accent }}>
                {formatPrice(item.price_cents, currency)}
              </span>
              <h2 className="font-display font-light leading-tight shimmer-heading"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)" }}>
                {item.name}
              </h2>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center shrink-0 mt-1 transition-opacity hover:opacity-40"
              style={{ color: "var(--color-muted, rgba(10,10,10,0.3))" }} aria-label="Schließen">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Photo — full, no crop, max 45dvh */}
          {item.image_url && (
            <div className="overflow-hidden shrink-0"
              style={{ backgroundColor: "var(--color-bg, #F5F0EC)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name}
                className="kenburns w-full block object-contain"
                style={{ maxHeight: "45dvh" }}
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />
            </div>
          )}

          {/* Body */}
          <div className="overflow-y-auto px-8 py-7 flex-1">
            {item.ai_caption ? (
              <>
                <p className="font-display italic leading-relaxed mb-4"
                  style={{ fontSize: "1.1rem", color: "var(--color-dim, rgba(10,10,10,0.65))" }}>
                  {item.ai_caption}
                </p>
                {item.description && (
                  <p className="font-sans text-sm leading-relaxed"
                    style={{ color: "var(--color-muted, rgba(10,10,10,0.4))" }}>
                    {item.description}
                  </p>
                )}
              </>
            ) : item.description ? (
              <p className="font-sans text-base leading-relaxed"
                style={{ color: "var(--color-dim, rgba(10,10,10,0.65))" }}>
                {item.description}
              </p>
            ) : (
              <p className="font-sans text-sm italic" style={{ color: "var(--color-muted, rgba(10,10,10,0.3))" }}>
                Keine Beschreibung verfügbar.
              </p>
            )}

            {item.allergens?.trim() && (
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--color-border, rgba(10,10,10,0.08))" }}>
                <span className="font-sans text-[10px] tracking-regal uppercase block mb-1"
                  style={{ color: "var(--color-muted, rgba(10,10,10,0.3))" }}>
                  Allergene
                </span>
                <p className="font-sans text-sm" style={{ color: "var(--color-dim, rgba(10,10,10,0.55))" }}>
                  {item.allergens}
                </p>
              </div>
            )}

            {!item.is_active && (
              <div className="mt-6 font-sans text-[11px] tracking-regal uppercase px-3 py-1.5 inline-block"
                style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                Derzeit nicht verfügbar
              </div>
            )}
          </div>

          {/* Gold accent line at bottom */}
          <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent, opacity: 0.4 }} />
        </motion.div>
      </div>
    </>
  );
}

// ── Main export ─────────────────────────────────────────────────
export function ItemDetailModal({ item, currency, onClose, theme = "classic", accent = "#C69B3C" }: Props) {
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
    <AnimatePresence>
      {item && (
        theme === "visual" ? (
          <ModalVisual key="v" item={item} currency={currency} onClose={onClose} accent={accent} />
        ) : theme === "modern" ? (
          <ModalModern key="m" item={item} currency={currency} onClose={onClose} accent={accent} />
        ) : (
          <ModalClassic key="c" item={item} currency={currency} onClose={onClose} accent={accent} />
        )
      )}
    </AnimatePresence>
  );
}
