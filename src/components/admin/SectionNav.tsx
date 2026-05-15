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
    <div
      style={{
        position: "sticky",
        top: topOffset,
        zIndex: 30,
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        marginLeft: -24,
        marginRight: -24,
        paddingLeft: 24,
        paddingRight: 8,
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
              color: "var(--accent)",
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
