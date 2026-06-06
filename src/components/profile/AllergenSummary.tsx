import type { ThemeTokens } from "@/components/profile/types";

// Map of allergen keys to German display names and emojis.
const ALLERGEN_MAP: Record<string, { label: string; emoji: string }> = {
  gluten:     { label: "Gluten",       emoji: "🌾" },
  milk:       { label: "Milch",        emoji: "🥛" },
  eggs:       { label: "Eier",         emoji: "🥚" },
  fish:       { label: "Fisch",        emoji: "🐟" },
  shellfish:  { label: "Schalentiere", emoji: "🦐" },
  nuts:       { label: "Nüsse",        emoji: "🌰" },
  peanuts:    { label: "Erdnüsse",     emoji: "🥜" },
  soy:        { label: "Soja",         emoji: "🫘" },
  sesame:     { label: "Sesam",        emoji: "🌿" },
  celery:     { label: "Sellerie",     emoji: "🥬" },
  mustard:    { label: "Senf",         emoji: "🌱" },
  lupin:      { label: "Lupinen",      emoji: "🌼" },
  molluscs:   { label: "Weichtiere",   emoji: "🐚" },
  sulphites:  { label: "Sulfite",      emoji: "🍷" },
};

interface AllergenSummaryProps {
  allergens: string[];
  t: ThemeTokens;
}

export function AllergenSummary({ allergens, t }: AllergenSummaryProps) {
  if (allergens.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-3 font-sans text-[11px] tracking-regal uppercase text-center"
        style={{ color: t.muted }}
      >
        Allergene
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {allergens.map((key) => {
          const info = ALLERGEN_MAP[key];
          const label = info?.label ?? key;
          const emoji = info?.emoji ?? "⚠️";
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[11px] tracking-wide"
              style={{
                color: t.dim,
                border: `1px solid ${t.border}`,
                backgroundColor: t.isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
              }}
            >
              <span aria-hidden>{emoji}</span>
              {label}
            </span>
          );
        })}
      </div>
      <p
        className="mt-3 text-center font-sans text-[10px]"
        style={{ color: t.muted }}
      >
        Allergene können in einzelnen Speisen enthalten sein. Bitte fragen Sie unser Personal.
      </p>
    </section>
  );
}
