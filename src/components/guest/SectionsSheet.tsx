"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GuestSection } from "@/lib/guest-menu";
import { count, ui } from "@/lib/menu-i18n";

/** Escape closes the sheet; the page behind it does not scroll while it is open. */
export function useSheet(open: boolean, onClose: () => void) {
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
}

// All sections at a glance, for long menus: tap one and the page jumps there.
// Same bottom-sheet shell as the filter, so the two feel like one thing.

export function SectionsSheet({
  open,
  sections,
  activeId,
  locale,
  onJump,
  onClose,
}: {
  open: boolean;
  sections: GuestSection[];
  activeId: string | null;
  locale: string;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const t = ui(locale);
  useSheet(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={t.sections}>
          <motion.button
            type="button"
            aria-label={t.close}
            className="absolute inset-0 cursor-default"
            style={{ backgroundColor: "rgba(10,10,10,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="overflow-y-auto px-4 pb-6 pt-2">
              <p className="px-2 font-sans text-lg font-semibold">{t.sections}</p>
              <ul className="mt-2">
                {sections.map((s) => {
                  const active = s.id === activeId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => { onJump(s.id); onClose(); }}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-sans text-base"
                        style={{ backgroundColor: active ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent", color: "var(--color-text)" }}
                      >
                        <span className="min-w-0 flex-1 truncate" style={{ fontWeight: active ? 600 : 400 }}>{s.name}</span>
                        <span className="shrink-0 text-sm tabular-nums" style={{ color: "var(--color-muted)" }}>{count(t.results, s.items.length)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
