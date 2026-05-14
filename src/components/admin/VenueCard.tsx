type Props = {
  name: string;
  slug: string;
  colorBg: string | null;
  colorPrimary: string | null;
  plan: string;
  itemCount: number;
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

export function VenueCard({ name, slug, colorBg, colorPrimary, plan, itemCount }: Props) {
  const bg = colorBg ?? "#1a1a1a";
  const accent = colorPrimary ?? "#C69B3C";
  const textColor = "#F5F0EC";

  return (
    <a
      href={`/${slug}`}
      target="_blank"
      rel="noreferrer"
      className="block rounded-none overflow-hidden border border-onyx/10 hover:border-onyx/30 transition group"
      style={{ textDecoration: "none" }}
    >
      {/* Color band */}
      <div
        className="h-24 w-full flex items-end px-4 pb-3"
        style={{ backgroundColor: bg }}
      >
        <span
          className="font-display text-xl leading-tight"
          style={{ color: textColor }}
        >
          {name}
        </span>
      </div>

      {/* Info */}
      <div className="bg-parchment px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: planDot[plan] ?? "#94a3b8" }}
          />
          <span className="font-sans text-[11px] tracking-regal uppercase text-onyx/60">
            {planLabel[plan] ?? plan}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-sans text-[11px] text-onyx/40">
            {itemCount} items
          </span>
          <span
            className="font-sans text-[10px] tracking-regal uppercase opacity-0 group-hover:opacity-100 transition"
            style={{ color: accent }}
          >
            Open ↗
          </span>
        </div>
      </div>
    </a>
  );
}
