// Shown when the guest's filter chips leave no dishes — a way back instead of a blank page.
export function FilterEmptyState({
  message,
  resetLabel,
  onReset,
  text,
  accent,
}: {
  message: string;
  resetLabel: string;
  onReset: () => void;
  text: string;
  accent: string;
}) {
  return (
    <div style={{ padding: "56px 8px", textAlign: "center" }}>
      <p
        style={{
          color: text,
          opacity: 0.7,
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 14,
          lineHeight: 1.5,
          margin: "0 0 20px",
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          minHeight: 44,
          padding: "0 20px",
          borderRadius: 22,
          border: `1px solid ${accent}`,
          background: "transparent",
          color: accent,
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {resetLabel}
      </button>
    </div>
  );
}
