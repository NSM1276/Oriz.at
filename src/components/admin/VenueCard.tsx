type Props = {
  id: string;
  name: string;
  slug: string;
  colorBg: string | null;
  colorPrimary: string | null;
  plan: string;
  itemCount: number;
  onEdit: () => void;
  onQR: () => void;
};

const planLabel: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  pro: "Pro",
};

const planDot: Record<string, string> = {
  trial: "#94a3b8",
  starter: "#C69B3C",
  pro: "#22c55e",
};

function isLight(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export function VenueCard({ name, slug, colorBg, colorPrimary, plan, itemCount, onEdit, onQR }: Props) {
  const bg = colorBg ?? "#1a1a1a";
  const accent = colorPrimary ?? "#C69B3C";
  const light = isLight(bg);
  const badgeBg = light ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)";
  const nameColor = light ? "#0A0A0A" : "#F5F0EC";

  return (
    <div className="overflow-hidden border border-onyx/10 hover:border-onyx/25 transition-colors">
      {/* Color band — clicking opens the menu */}
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="block h-36 w-full relative"
        style={{ backgroundColor: bg }}
        aria-label={`Open ${name} menu`}
      >
        {/* Plan badge top-right */}
        <span
          className="absolute top-3 right-3 font-sans text-[10px] tracking-regal uppercase px-2 py-0.5"
          style={{
            backgroundColor: badgeBg,
            color: planDot[plan] ?? "#94a3b8",
          }}
        >
          {planLabel[plan] ?? plan}
        </span>

        {/* Color accent strip at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: accent }}
        />

        {/* Venue name bottom-left */}
        <span
          className="absolute bottom-4 left-4 font-display text-xl leading-tight drop-shadow"
          style={{ color: nameColor }}
        >
          {name}
        </span>
      </a>

      {/* Info row */}
      <div className="bg-parchment px-4 py-3 flex items-center justify-between">
        <span className="font-sans text-[11px] text-onyx/50">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={onQR} title="QR Code" className="text-onyx/30 hover:text-onyx/70 transition-colors">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="1" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="2.5" y="2.5" width="2" height="2" fill="currentColor"/>
              <rect x="10.5" y="2.5" width="2" height="2" fill="currentColor"/>
              <rect x="2.5" y="10.5" width="2" height="2" fill="currentColor"/>
              <path d="M9 9h2v2H9zM11 11h2v2h-2zM9 13h2M13 9v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={onEdit}
            title="Settings (colors, plan, social)"
            className="text-onyx/30 hover:text-onyx/70 transition-colors"
            aria-label="Edit settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
          <a
            href={`/admin/carta/${slug}`}
            className="font-sans text-[11px] tracking-regal uppercase transition-colors"
            style={{ color: accent }}
          >
            Inhalt →
          </a>
        </div>
      </div>
    </div>
  );
}
