"use client";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  it: "IT",
  uk: "UA",
  fr: "FR",
  es: "ES",
  ru: "RU",
};

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
      className="flex items-center justify-center gap-1 flex-wrap"
      role="group"
      aria-label="Sprache"
    >
      {options.map((code) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            onClick={() => onChange(code)}
            style={{
              height: 28,
              minWidth: 40,
              padding: "0 10px",
              borderRadius: 14,
              border: `1px solid ${isActive ? accent : border}`,
              backgroundColor: isActive ? accent : "transparent",
              color: isActive ? "#0A0A0A" : text,
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 10,
              letterSpacing: "0.08em",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              opacity: isActive ? 1 : 0.6,
              transition: "all 150ms",
            }}
          >
            {LOCALE_LABELS[code] ?? code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
