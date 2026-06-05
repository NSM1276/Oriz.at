"use client";

import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item;
  currency: string;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function AdminItemRow({ item, currency, isFirst, isLast, onEdit, onMoveUp, onMoveDown }: Props) {
  return (
    <li
      className="flex items-center gap-3 py-4 group"
      style={{
        borderBottom: "1px solid var(--color-border)",
        opacity: item.is_active ? 1 : 0.45,
      }}
    >
      {/* ↑↓ reorder buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Nach oben"
          className="w-6 h-6 flex items-center justify-center transition-opacity disabled:opacity-0"
          style={{ color: "var(--color-muted)", background: "none", border: "none", cursor: isFirst ? "default" : "pointer", padding: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Nach unten"
          className="w-6 h-6 flex items-center justify-center transition-opacity disabled:opacity-0"
          style={{ color: "var(--color-muted)", background: "none", border: "none", cursor: isLast ? "default" : "pointer", padding: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 3v6M9 6l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Name + description — clickable for edit */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3
            className="font-display text-xl leading-tight transition-opacity group-hover:opacity-70"
            style={{ color: "var(--color-text)" }}
          >
            {item.name}
          </h3>
          {!item.is_active && (
            <span
              className="font-sans text-[10px] tracking-regal uppercase px-1.5 py-0.5 shrink-0"
              style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
            >
              N/A
            </span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-sm mt-0.5 leading-snug" style={{ color: "var(--color-dim)" }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Thumbnail */}
      {item.image_url && (
        <div className="shrink-0 overflow-hidden" style={{ width: 56, height: 56, borderRadius: 4 }}>
          {/\.(mp4|webm|mov)(\?|$)/i.test(item.image_url) ? (
            <video src={item.image_url} muted autoPlay loop playsInline className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
          )}
        </div>
      )}

      {/* Price */}
      <span className="font-sans tabular-nums shrink-0 text-base" style={{ color: "var(--color-text)" }}>
        {formatPrice(item.price_cents, currency)}
      </span>

      {/* Edit pencil */}
      <div onClick={onEdit} className="shrink-0 w-7 h-7 flex items-center justify-center opacity-30 group-hover:opacity-70 transition-opacity cursor-pointer" style={{ color: "var(--accent)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
    </li>
  );
}
