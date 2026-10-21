import { tableDisplayName } from "@/lib/tables";

// Thin strip above the menu when the guest came in through a table sticker.
// It is the anchor for the waiter-call button that comes next.
export function TableBanner({ label, bg, accent }: { label: string; bg: string | null; accent: string | null }) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 font-sans text-xs font-medium uppercase tracking-[0.18em]"
      style={{
        backgroundColor: bg ?? "#F5F0EC",
        color: accent ?? "#C69B3C",
        borderBottom: `1px solid color-mix(in srgb, ${accent ?? "#C69B3C"} 30%, transparent)`,
        paddingTop: "max(env(safe-area-inset-top), 8px)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 9h18M5 9v11M19 9v11M8 9V5h8v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{tableDisplayName(label)}</span>
    </div>
  );
}
