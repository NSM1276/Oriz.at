"use client";

type Props = {
  sections: { id: string; name: string }[];
  topOffset?: number;
};

export function SectionNav({ sections, topOffset = 0 }: Props) {
  function jump(id: string) {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    // offset for the sticky nav bar itself (~52px)
    const top = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    // The bleed must match the page container's padding (px-4 sm:px-6),
    // otherwise the bar pokes past the viewport and the phone scrolls sideways.
    <div
      className="-mx-4 sm:-mx-6 pl-4 sm:pl-6 pr-2"
      style={{
        position: "sticky",
        top: topOffset,
        zIndex: 30,
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "inline-flex", gap: 0, padding: "14px 0" }}>
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text)",
              opacity: 0.75,
              padding: "6px 14px",
              whiteSpace: "nowrap",
              borderRight: i < sections.length - 1
                ? "1px solid var(--color-border)"
                : "none",
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
