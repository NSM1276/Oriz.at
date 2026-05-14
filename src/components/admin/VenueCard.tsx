type Props = {
  id: string;
  name: string;
  slug: string;
  colorBg: string | null;
  colorPrimary: string | null;
  plan: string;
  itemCount: number;
  onEdit: () => void;
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

export function VenueCard({ name, slug, colorBg, colorPrimary, plan, itemCount, onEdit }: Props) {
  const bg = colorBg ?? "#1a1a1a";
  const accent = colorPrimary ?? "#C69B3C";

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
            backgroundColor: "rgba(0,0,0,0.35)",
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
          className="absolute bottom-4 left-4 font-display text-xl leading-tight text-parchment drop-shadow"
        >
          {name}
        </span>
      </a>

      {/* Info row */}
      <div className="bg-parchment px-4 py-3 flex items-center justify-between">
        <span className="font-sans text-[11px] text-onyx/50">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <button
          onClick={onEdit}
          className="font-sans text-[11px] tracking-regal uppercase text-onyx/60 hover:text-onyx transition-colors"
          style={{ color: accent }}
        >
          Edit →
        </button>
      </div>
    </div>
  );
}
