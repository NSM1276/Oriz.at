import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

const hasDetail = (item: Item) => !!(item.image_url || item.ai_caption);

export function ItemRow({
  item,
  currency,
  onClick,
}: {
  item: Item;
  currency: string;
  onClick: (item: Item) => void;
}) {
  const dim = !item.is_active;
  const clickable = hasDetail(item);

  return (
    <li
      onClick={clickable ? () => onClick(item) : undefined}
      className="flex items-baseline gap-4 py-4 transition-opacity group"
      style={{
        borderBottom: '1px solid var(--color-border)',
        opacity: dim ? 0.4 : 1,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3
            className={`font-display text-xl md:text-2xl transition-colors ${clickable ? 'group-hover:opacity-70' : ''}`}
            style={{ color: 'var(--color-text)' }}
          >
            {item.name}
          </h3>
          {clickable && (
            <span
              className="font-sans text-[9px] tracking-regal uppercase px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent)', border: '1px solid var(--accent)', opacity: undefined }}
            >
              mehr
            </span>
          )}
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

      <div className="flex items-center gap-2 shrink-0">
        {clickable && item.image_url && (
          <div
            className="w-10 h-10 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="font-sans text-base md:text-lg tabular-nums" style={{ color: 'var(--color-text)' }}>
          {formatPrice(item.price_cents, currency)}
        </div>
      </div>
    </li>
  );
}
