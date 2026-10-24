"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ALLERGEN_LABELS, allergenIcon } from "@/lib/allergens";
import type { AllergenCode, DietTag, FilterOptions, MenuFilter } from "@/lib/guest-menu";
import { allergenName, count, ui } from "@/lib/menu-i18n";
import { useSheet } from "./SectionsSheet";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 font-sans text-[13px] transition-colors"
      style={{
        color: active ? "var(--color-bg)" : "var(--color-text)",
        backgroundColor: active ? "var(--accent)" : "transparent",
        boxShadow: active ? "none" : "inset 0 0 0 1px var(--color-border)",
      }}
    >
      {children}
    </button>
  );
}

export function FilterSheet({
  open,
  options,
  filter,
  matched,
  locale,
  onChange,
  onClose,
}: {
  open: boolean;
  options: FilterOptions;
  filter: MenuFilter;
  matched: number;
  locale: string;
  onChange: (f: MenuFilter) => void;
  onClose: () => void;
}) {
  const t = ui(locale);
  useSheet(open, onClose);

  function toggleDiet(tag: DietTag) {
    const diet = new Set(filter.diet);
    if (diet.has(tag)) diet.delete(tag); else diet.add(tag);
    onChange({ ...filter, diet });
  }
  function toggleAvoid(code: AllergenCode) {
    const avoid = new Set(filter.avoid);
    if (avoid.has(code)) avoid.delete(code); else avoid.add(code);
    onChange({ ...filter, avoid });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={t.filter}>
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
            <div className="overflow-y-auto px-6 pb-4 pt-5">
              <p className="font-sans text-lg font-semibold">{t.filter}</p>

              {options.diet.length > 0 && (
                <section className="mt-5">
                  <p className="mb-2 font-sans text-[11px] uppercase tracking-regal" style={{ color: "var(--color-muted)" }}>{t.diet}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.diet.map(({ tag, count }) => (
                      <Chip key={tag} active={filter.diet.has(tag)} onClick={() => toggleDiet(tag)}>
                        {tag === "vegan" ? t.vegan : t.vegetarian}
                        <span style={{ opacity: 0.6 }}>{count}</span>
                      </Chip>
                    ))}
                  </div>
                </section>
              )}

              {options.avoid.length > 0 && (
                <section className="mt-6">
                  <p className="font-sans text-[11px] uppercase tracking-regal" style={{ color: "var(--color-muted)" }}>{t.avoid}</p>
                  <p className="mb-2 mt-0.5 font-sans text-sm" style={{ color: "var(--color-dim)" }}>{t.avoidHint}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.avoid.map((code) => (
                      <Chip key={code} active={filter.avoid.has(code)} onClick={() => toggleAvoid(code)}>
                        <span aria-hidden className="opacity-80">{allergenIcon(code)}</span>
                        {allergenName(code, locale, ALLERGEN_LABELS[code])}
                      </Chip>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center gap-3 border-t px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
              <button
                type="button"
                onClick={() => onChange({ ...filter, diet: new Set(), avoid: new Set(), includeUnknown: false })}
                className="rounded-full px-4 py-3 font-sans text-sm"
                style={{ color: "var(--color-dim)" }}
              >
                {t.reset}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full py-3 font-sans text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "var(--color-bg)" }}
              >
                {matched > 0 ? count(t.results, matched) : t.noResults}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
