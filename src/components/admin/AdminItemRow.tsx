"use client";

import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/supabase/types";

type Props = {
  item: Item;
  currency: string;
  onEdit: () => void;
};

export function AdminItemRow({ item, currency, onEdit }: Props) {
  return (
    <li
      onClick={onEdit}
      className="flex items-center gap-3 py-4 cursor-pointer group"
      style={{
        borderBottom: "1px solid var(--color-border)",
        opacity: item.is_active ? 1 : 0.45,
      }}
    >
      {/* Name + description */}
      <div className="flex-1 min-w-0">
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
              style={{
                color: "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              N/A
            </span>
          )}
        </div>
        {item.description && (
          <p
            className="font-sans text-sm mt-0.5 leading-snug"
            style={{ color: "var(--color-dim)" }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Thumbnail */}
      {item.image_url && (
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: 56, height: 56, borderRadius: 4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Price */}
      <span
        className="font-sans tabular-nums shrink-0 text-base"
        style={{ color: "var(--color-text)" }}
      >
        {formatPrice(item.price_cents, currency)}
      </span>

      {/* Edit pencil */}
      <div
        className="shrink-0 w-7 h-7 flex items-center justify-center opacity-30 group-hover:opacity-70 transition-opacity"
        style={{ color: "var(--accent)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
    </li>
  );
}
