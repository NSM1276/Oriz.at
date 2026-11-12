"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ALLERGEN_LABELS, allergenIcon } from "@/lib/allergens";
import { formatPrice } from "@/lib/format";
import type { GuestItem } from "@/lib/guest-menu";
import { allergenName, ui } from "@/lib/menu-i18n";
import { DietBadges, DishMedia } from "./parts";

// One detail sheet for every look: a bottom sheet on phones, a card on wider
// screens. Colours come from the menu's CSS variables, so light and dark
// venues both read well.

function Allergens({ item, locale }: { item: GuestItem; locale: string }) {
  const t = ui(locale);
  return (
    <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
      <span className="mb-2 block font-sans text-[10px] uppercase tracking-regal" style={{ color: "var(--color-muted)" }}>
        {t.allergens}
      </span>
      {item.allergens === null ? (
        <p className="font-sans text-sm" style={{ color: "var(--color-dim)" }}>{t.allergenUnknown}</p>
      ) : item.allergens.length === 0 ? (
        <p className="font-sans text-sm" style={{ color: "var(--color-dim)" }}>{t.allergenNone}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {item.allergens.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-sans text-[12px]"
              style={{ color: "var(--color-dim)", border: "1px solid var(--color-border)" }}
            >
              <span className="shrink-0 opacity-80" aria-hidden>{allergenIcon(code)}</span>
              <span>
                <span className="font-semibold">{code}</span> {allergenName(code, locale, ALLERGEN_LABELS[code])}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RoundButton({ label, onClick, plain, children }: { label: string; onClick: () => void; plain?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity active:opacity-70"
      style={plain ? { color: "var(--color-dim)" } : { backgroundColor: "rgba(255,255,255,0.92)", color: "#0A0A0A", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}
    >
      {children}
    </button>
  );
}

const CloseGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const ShareGlyph = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);

/** The menu link with the dish name — "look what I'm having". Falls back to copying the link. */
async function shareDish(name: string) {
  const url = window.location.href.split("#")[0];
  try {
    if (navigator.share) await navigator.share({ title: name, text: name, url });
    else await navigator.clipboard?.writeText(url);
  } catch { /* cancelled */ }
}

export function DishSheet({
  item,
  currency,
  locale,
  titleClass,
  onClose,
}: {
  item: GuestItem | null;
  currency: string;
  locale: string;
  titleClass: string;
  onClose: () => void;
}) {
  const t = ui(locale);
  const open = item !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={item.name}>
          <motion.button
            type="button"
            aria-label={t.close}
            className="absolute inset-0 cursor-default"
            style={{ backgroundColor: "rgba(10,10,10,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
            style={{ backgroundColor: "var(--color-bg)", maxHeight: "92dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
          >
            {/* Photo first and large, like the dish pages of FineDine and me&u; buttons float on it. */}
            {item.imageUrl ? (
              <div className="relative shrink-0 overflow-hidden" style={{ backgroundColor: "#111", aspectRatio: "4 / 3", maxHeight: "48dvh" }}>
                <DishMedia src={item.imageUrl} alt={item.name} sizes="100vw" className="kenburns absolute inset-0 block h-full w-full object-cover" />
                <div className="absolute inset-x-0 top-0 flex justify-center pt-2 sm:hidden">
                  <div className="h-1 w-10 rounded-full bg-white/70" />
                </div>
                <div className="absolute inset-x-0 top-0 flex justify-between p-3">
                  <RoundButton label={t.share} onClick={() => shareDish(item.name)}><ShareGlyph /></RoundButton>
                  <RoundButton label={t.close} onClick={onClose}><CloseGlyph /></RoundButton>
                </div>
              </div>
            ) : (
              <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
                <RoundButton label={t.share} onClick={() => shareDish(item.name)} plain><ShareGlyph /></RoundButton>
                <div className="h-1 w-10 rounded-full sm:hidden" style={{ backgroundColor: "var(--color-border)" }} />
                <RoundButton label={t.close} onClick={onClose} plain><CloseGlyph /></RoundButton>
              </div>
            )}

            <div className={`relative overflow-y-auto px-7 pb-8 ${item.imageUrl ? "-mt-5 rounded-t-3xl pt-6" : "pt-2"}`} style={{ backgroundColor: "var(--color-bg)" }}>

              <h2 className={`leading-tight ${titleClass}`} style={{ fontSize: "clamp(1.6rem, 5vw, 2rem)", color: "var(--color-text)" }}>
                {item.name}
              </h2>

              {item.variants.length > 1 ? (
                <table className="mt-3 w-full font-sans text-base">
                  <tbody>
                    {item.variants.map((v) => (
                      <tr key={v.label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td className="py-1.5" style={{ color: "var(--color-dim)" }}>{v.label}</td>
                        <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--accent)" }}>{formatPrice(v.priceCents, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (item.variants[0]?.priceCents ?? item.priceCents) > 0 && (
                <p className="mt-2 font-sans text-lg tabular-nums" style={{ color: "var(--accent)" }}>
                  {item.variants.length === 1 && <span style={{ color: "var(--color-dim)" }}>{item.variants[0].label} · </span>}
                  {formatPrice(item.variants[0]?.priceCents ?? item.priceCents, currency)}
                </p>
              )}

              <div className="mb-4 mt-4 h-px w-8" style={{ backgroundColor: "var(--accent)", opacity: 0.7 }} />

              {item.diet.size > 0 && <div className="mb-3"><DietBadges item={item} locale={locale} /></div>}

              {item.text && (
                <p className="font-display text-lg italic leading-relaxed" style={{ color: "var(--color-dim)" }}>{item.text}</p>
              )}
              {item.story && (
                <p className="mt-3 font-sans text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>{item.story}</p>
              )}

              <Allergens item={item} locale={locale} />

              {!item.available && (
                <div className="mt-5 inline-block px-3 py-1.5 font-sans text-[11px] uppercase tracking-regal" style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                  {t.currentlyNotAvailable}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
