import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

export function ItemRow({ item, currency }: { item: Item; currency: string }) {
  const dim = !item.is_active;
  return (
    <li
      className="flex items-baseline gap-4 py-4 transition-opacity"
      style={{
        borderBottom: '1px solid var(--color-border)',
        opacity: dim ? 0.4 : 1,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-xl md:text-2xl" style={{ color: 'var(--color-text)' }}>
            {item.name}
          </h3>
          {dim && (
            <span
              className="font-sans text-[10px] tracking-regal uppercase px-1.5 py-0.5"
              style={{ color: 'var(--color-dim)', border: '1px solid var(--color-border)' }}
            >
              Nicht verfügbar
            </span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-dim)' }}>
            {item.description}
          </p>
        )}
        {item.allergens && (
          <p className="font-sans text-[11px] mt-1.5 tracking-wide" style={{ color: 'var(--color-muted)' }}>
            Allergene: {item.allergens}
          </p>
        )}
      </div>
      <div className="font-sans text-base md:text-lg tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
        {formatPrice(item.price_cents, currency)}
      </div>
    </li>
  );
}
