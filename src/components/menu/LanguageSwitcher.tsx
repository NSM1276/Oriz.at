"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LOCALE_NATIVE, localeShort } from "@/lib/locales";
import { ui } from "@/lib/menu-i18n";

// Up to four languages: a row of pills. More: one pill with the current language that
// opens a list with every language in its own script (DE, EN, 中文 … "20+ Sprachen").
const PILLS_MAX = 4;

export function LanguageSwitcher({
  enabledLocales,
  locale,
  onChange,
  accent,
  text,
  border,
}: {
  enabledLocales: string[];
  locale: string;
  onChange: (locale: string) => void;
  accent: string;
  text: string;
  border: string;
}) {
  const options = ["de", ...enabledLocales.filter((l) => l !== "de")];
  const [open, setOpen] = useState(false);
  const t = ui(locale);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (options.length <= 1) return null;

  const pill = (active: boolean): React.CSSProperties => ({
    height: 36,
    minWidth: 44,
    padding: "0 12px",
    borderRadius: 18,
    border: `1px solid ${active ? accent : border}`,
    backgroundColor: active ? accent : "transparent",
    color: active ? "#0A0A0A" : text,
    fontFamily: "var(--font-inter, sans-serif)",
    fontSize: 11,
    letterSpacing: "0.08em",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    opacity: active ? 1 : 0.7,
    transition: "all 150ms",
    flexShrink: 0,
  });

  if (options.length <= PILLS_MAX) {
    return (
      <div style={{ display: "inline-flex", gap: 6, flexShrink: 0 }} role="group" aria-label={t.language}>
        {options.map((code) => (
          <button key={code} type="button" onClick={() => onChange(code)} aria-pressed={code === locale} style={pill(code === locale)}>
            {localeShort(code)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t.language} style={{ ...pill(true), display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" strokeLinecap="round" />
        </svg>
        <span style={{ letterSpacing: "0.02em", fontSize: 12 }}>{LOCALE_NATIVE[locale] ?? localeShort(locale)}</span>
      </button>

      {/* Into <body>: the menu around the button can be zoomed (larger text), which would scale the sheet too. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={t.language}>
          <button type="button" aria-label={t.close} className="absolute inset-0 cursor-default" style={{ backgroundColor: "rgba(10,10,10,0.5)" }} onClick={() => setOpen(false)} />
          <div
            className="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
            <div className="overflow-y-auto px-4 pb-6 pt-2">
              <p className="px-2 font-sans text-lg font-semibold">{t.language}</p>
              <ul className="mt-2 grid grid-cols-2 gap-1">
                {options.map((code) => {
                  const active = code === locale;
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => { onChange(code); setOpen(false); }}
                        aria-pressed={active}
                        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-sans text-base"
                        style={{ backgroundColor: active ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent", fontWeight: active ? 600 : 400 }}
                      >
                        <span className="w-9 shrink-0 text-[11px] uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>{localeShort(code)}</span>
                        <span className="min-w-0 flex-1 truncate">{LOCALE_NATIVE[code] ?? code}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
