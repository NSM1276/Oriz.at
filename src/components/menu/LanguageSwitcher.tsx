"use client";

import { ui } from "@/lib/menu-i18n";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  it: "IT",
  uk: "UA",
  fr: "FR",
  es: "ES",
  ru: "RU",
};

/**
 * Compact pill row, styled identically to the diet-filter chips so both can
 * live in the same horizontal row without looking like two different widgets.
 */
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
  if (options.length <= 1) return null;

  return (
    <div
      style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}
      role="group"
      aria-label={ui(locale).language}
    >
      {options.map((code) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            onClick={() => onChange(code)}
            aria-pressed={isActive}
            style={{
              height: 36,
              minWidth: 44,
              padding: "0 10px",
              borderRadius: 18,
              border: `1px solid ${isActive ? accent : border}`,
              backgroundColor: isActive ? accent : "transparent",
              color: isActive ? "#0A0A0A" : text,
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              opacity: isActive ? 1 : 0.7,
              transition: "all 150ms",
              flexShrink: 0,
            }}
          >
            {LOCALE_LABELS[code] ?? code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
