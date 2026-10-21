"use client";

// Small pieces every look shares: price (with size variants), allergen letters,
// diet badges, the "not available" badge and dish media.

import type { CSSProperties, SyntheticEvent } from "react";
import { formatPrice } from "@/lib/format";
import type { GuestItem } from "@/lib/guest-menu";
import { isVideoUrl } from "@/lib/media";
import { ui } from "@/lib/menu-i18n";

export function Price({
  item,
  currency,
  locale,
  className,
  style,
  compact = false,
}: {
  item: GuestItem;
  currency: string;
  locale: string;
  className?: string;
  style?: CSSProperties;
  /** One line ("ab 3,90 €") instead of the stacked list of sizes. */
  compact?: boolean;
}) {
  if (item.variants.length === 0) {
    // 0 means "no price" on the owner's side (sauces, "ask the staff" rows) — print nothing.
    if (item.priceCents === 0) return null;
    return <span className={`tabular-nums ${className ?? ""}`} style={style}>{formatPrice(item.priceCents, currency)}</span>;
  }
  if (compact || item.variants.length === 1) {
    const min = Math.min(...item.variants.map((v) => v.priceCents));
    const label = item.variants.length === 1 ? `${item.variants[0].label} ` : `${ui(locale).from} `;
    return (
      <span className={`tabular-nums ${className ?? ""}`} style={style}>
        <span style={{ opacity: 0.7, fontSize: "0.85em" }}>{label}</span>
        {formatPrice(min, currency)}
      </span>
    );
  }
  return (
    <span className={`inline-grid gap-x-2 gap-y-0.5 text-right ${className ?? ""}`} style={{ gridTemplateColumns: "auto auto", ...style }}>
      {item.variants.map((v) => (
        <span key={v.label} className="contents">
          <span style={{ opacity: 0.65, fontSize: "0.8em", alignSelf: "baseline" }}>{v.label}</span>
          <span className="tabular-nums">{formatPrice(v.priceCents, currency)}</span>
        </span>
      ))}
    </span>
  );
}

/** "A · C · G" — Austrian menus print the letters, the legend explains them. */
export function AllergenLetters({ item, style }: { item: GuestItem; style?: CSSProperties }) {
  if (!item.allergens || item.allergens.length === 0) return null;
  return (
    <p className="mt-1 font-sans text-[11px] tracking-wide" style={{ color: "var(--color-muted)", ...style }}>
      {item.allergens.join(" · ")}
    </p>
  );
}

export function DietBadges({ item, locale }: { item: GuestItem; locale: string }) {
  if (item.diet.size === 0) return null;
  const t = ui(locale);
  const label = item.diet.has("vegan") ? t.vegan : t.vegetarian;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider"
      style={{ color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)" }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16Zm0 0 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}

export function UnavailableBadge({ locale }: { locale: string }) {
  return (
    <span
      className="shrink-0 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-regal"
      style={{ color: "var(--color-dim)", border: "1px solid var(--color-border)" }}
    >
      {ui(locale).notAvailable}
    </span>
  );
}

/** A dish photo, or a muted looping clip when the owner uploaded a video. Hides itself on error. */
export function DishMedia({
  src,
  alt,
  className,
  style,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  onError?: () => void;
}) {
  const hide = (e: SyntheticEvent<HTMLElement>) => {
    if (onError) onError();
    else (e.currentTarget.parentElement as HTMLElement).style.display = "none";
  };
  if (isVideoUrl(src)) {
    return <video src={src} aria-label={alt || undefined} autoPlay muted loop playsInline preload="metadata" className={className} style={style} onError={hide} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} style={style} onError={hide} />;
}
