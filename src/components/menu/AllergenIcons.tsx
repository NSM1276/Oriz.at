import { parseAllergenCodes, allergenIcon } from "@/lib/allergens";

type Props = {
  codes: string | null | undefined;
  variant?: "modal" | "inline";
};

/**
 * Renders parsed allergen codes as elegant icon + label chips.
 * Colors strictly via CSS vars set on the menu root, so it adapts
 * to light and dark venue themes. Renders nothing if no known codes.
 */
export function AllergenIcons({ codes, variant = "modal" }: Props) {
  const parsed = parseAllergenCodes(codes);
  if (parsed.length === 0) return null;

  const wrapStyle =
    variant === "modal"
      ? { marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border, rgba(10,10,10,0.10))" }
      : undefined;

  return (
    <div style={wrapStyle}>
      <span
        className="font-sans text-[10px] tracking-regal uppercase block mb-2"
        style={{ color: "var(--color-muted)" }}
      >
        Allergene
      </span>
      <div className="flex flex-wrap gap-1.5">
        {parsed.map(({ code, label }) => (
          <span
            key={code}
            className="inline-flex items-center gap-1.5 font-sans text-[11px] px-2 py-1 rounded-md"
            style={{
              color: "var(--color-dim)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="shrink-0 opacity-80" aria-hidden>
              {allergenIcon(code)}
            </span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
