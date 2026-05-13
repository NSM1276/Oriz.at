import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

export function ItemRow({ item, currency }: { item: Item; currency: string }) {
  const dim = !item.is_active;
  return (
    <li
      className={`flex items-baseline gap-4 py-4 border-b border-onyx/10 transition-opacity ${
        dim ? "opacity-40" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-xl md:text-2xl text-onyx">
            {item.name}
          </h3>
          {dim && (
            <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/60 border border-onyx/30 px-1.5 py-0.5">
              Nicht verfügbar
            </span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-sm text-onyx/65 mt-1 leading-relaxed">
            {item.description}
          </p>
        )}
        {item.allergens && (
          <p className="font-sans text-[11px] text-onyx/40 mt-1.5 tracking-wide">
            Allergene: {item.allergens}
          </p>
        )}
      </div>
      <div className="font-sans text-base md:text-lg text-onyx tabular-nums whitespace-nowrap">
        {formatPrice(item.price_cents, currency)}
      </div>
    </li>
  );
}
