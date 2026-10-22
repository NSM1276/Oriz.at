"use client";

// The three looks of the guest menu. They only decide how things look —
// data, search, filters and behaviour live in GuestMenu, the same for all.

import { useState, type ReactNode } from "react";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { GuestItem, GuestSection } from "@/lib/guest-menu";
import { ui } from "@/lib/menu-i18n";
import type { Venue } from "@/lib/supabase/types";
import { AllergenLetters, DietBadges, DishMedia, Price, UnavailableBadge } from "./parts";

export type LookName = "classic" | "modern" | "visual";

export type LookProps = {
  venue: Venue;
  about: string | null;
  isDark: boolean;
  text: string;
  locale: string;
};

export type ItemsProps = {
  section: GuestSection;
  sectionIndex: number;
  currency: string;
  locale: string;
  onOpen: (item: GuestItem) => void;
};

export type Look = {
  /** Page width and side padding. */
  main: string;
  /** Negative margin matching `main`'s padding, for full-bleed rows. */
  bleed: string;
  Header: (p: LookProps) => ReactNode;
  SectionTitle: (p: { section: GuestSection; index: number }) => ReactNode;
  Items: (p: ItemsProps) => ReactNode;
  tab: (active: boolean) => { className: string; style: React.CSSProperties };
  /** Typeface for the dish name in the detail sheet. */
  sheetTitle: string;
};

const clamp3 = {
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
} as React.CSSProperties;

function hasDetail(item: GuestItem) {
  return !!(item.text || item.story || item.imageUrl || item.allergens !== null || item.variants.length > 1);
}

function rowProps(item: GuestItem, onOpen: (i: GuestItem) => void, extra?: React.CSSProperties) {
  const clickable = hasDetail(item);
  return {
    onClick: clickable ? () => onOpen(item) : undefined,
    onKeyDown: clickable ? (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); } } : undefined,
    role: clickable ? "button" : undefined,
    tabIndex: clickable ? 0 : undefined,
    style: { cursor: clickable ? "pointer" : "default", opacity: item.available ? 1 : 0.4, ...extra } as React.CSSProperties,
  };
}

// ── Classic: centred, serif, like a printed card ─────────────────────────

const classic: Look = {
  main: "max-w-3xl px-6",
  bleed: "-mx-6 px-6",
  sheetTitle: "font-display font-light",
  Header: ({ venue, about, isDark, text }) => (
    <header className="text-center">
      <VenueLogo name={venue.name} svg={venue.logo_svg} url={venue.logo_url} bg={venue.color_bg} accent={venue.color_primary} color="auto" height={56} textColor={text} isDarkBg={isDark} />
      {about && (
        <p className="mx-auto mt-2 max-w-xs font-display text-base italic md:max-w-xl md:text-lg" style={{ color: "var(--color-dim)", ...clamp3 }}>
          {about}
        </p>
      )}
      <div className="mx-auto mt-4 h-px w-16" style={{ backgroundColor: "var(--accent)", opacity: 0.6 }} />
    </header>
  ),
  tab: (active) => ({
    className: "font-sans text-[11px] uppercase tracking-regal px-4 py-1.5 transition-opacity",
    style: { color: "var(--accent)", opacity: active ? 1 : 0.55, fontWeight: active ? 600 : 400 },
  }),
  SectionTitle: ({ section }) => (
    <header className="mb-5 flex items-center gap-4">
      <h2 className="shimmer-title font-sans text-[11px] uppercase tracking-regal">{section.name}</h2>
      <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
    </header>
  ),
  Items: ({ section, currency, locale, onOpen }) => (
    <ul>
      {section.items.map((item) => (
        <li key={item.id} {...rowProps(item, onOpen, { borderBottom: "1px solid var(--color-border)" })} className="group flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-display text-xl font-semibold transition-opacity group-hover:opacity-70 md:text-2xl" style={{ color: "var(--color-text)" }}>
                {item.name}
              </h3>
              <DietBadges item={item} locale={locale} />
              {!item.available && <UnavailableBadge locale={locale} />}
            </div>
            {item.text && <p className="mt-1 font-sans text-sm leading-relaxed" style={{ color: "var(--color-dim)" }}>{item.text}</p>}
            <AllergenLetters item={item} />
          </div>
          {item.imageUrl && (
            <div className="shrink-0 overflow-hidden" style={{ width: 72, height: 72, borderRadius: 4 }}>
              <DishMedia src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          )}
          <Price item={item} currency={currency} locale={locale} className="shrink-0 font-sans text-base md:text-lg" style={{ color: "var(--color-text)" }} />
        </li>
      ))}
    </ul>
  ),
};

// ── Modern: editorial, numbered, left-aligned ───────────────────────────

const modern: Look = {
  main: "max-w-2xl px-6",
  bleed: "-mx-6 px-6",
  sheetTitle: "font-display font-light",
  Header: ({ venue, about, isDark, text, locale }) => (
    <header>
      <VenueLogo name={venue.name} svg={venue.logo_svg} url={venue.logo_url} bg={venue.color_bg} accent={venue.color_primary} color="auto" height={60} textColor={text} isDarkBg={isDark} />
      {about && <p className="mt-3 max-w-md font-sans text-sm leading-relaxed" style={{ color: "var(--color-dim)", ...clamp3 }}>{about}</p>}
      <div className="mt-5 flex items-center gap-4">
        <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
        <span className="font-sans text-[10px] uppercase tracking-regal" style={{ color: "var(--color-muted)" }}>{ui(locale).menu}</span>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
      </div>
    </header>
  ),
  tab: (active) => ({
    className: "relative font-sans text-[11px] uppercase tracking-regal px-4 py-3 transition-colors",
    style: {
      color: active ? "var(--accent)" : "var(--color-muted)",
      boxShadow: active ? "inset 0 -2px 0 var(--accent)" : "none",
    },
  }),
  SectionTitle: ({ section, index }) => (
    <div className="mb-5 flex items-end gap-5">
      <span className="select-none font-display font-light leading-none" style={{ fontSize: "clamp(4rem, 12vw, 7rem)", color: "var(--accent)", opacity: 0.12, lineHeight: 0.85 }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="pb-1">
        <h2 className="shimmer-title font-display font-light" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)", letterSpacing: "-0.01em" }}>{section.name}</h2>
        <div className="mt-1.5 h-px w-10" style={{ backgroundColor: "var(--accent)" }} />
      </div>
    </div>
  ),
  Items: ({ section, currency, locale, onOpen }) => (
    <ul>
      {section.items.map((item, i) => (
        <li key={item.id} {...rowProps(item, onOpen, { borderBottom: "1px solid var(--color-border)" })} className="group relative flex items-center gap-3 py-4 sm:gap-4">
          <span className="w-10 shrink-0 select-none text-right font-display font-light tabular-nums" style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", color: "var(--accent)", opacity: 0.25, lineHeight: 1 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-sans font-medium leading-tight transition-opacity group-hover:opacity-60" style={{ fontSize: "clamp(1.05rem, 3vw, 1.25rem)", color: "var(--color-text)", letterSpacing: "-0.01em", overflowWrap: "anywhere", hyphens: "auto" }}>
                {item.name}
              </h3>
              <DietBadges item={item} locale={locale} />
              {!item.available && <UnavailableBadge locale={locale} />}
            </div>
            {item.text && <p className="mt-0.5 font-sans text-sm leading-snug" style={{ color: "var(--color-dim)", overflowWrap: "anywhere", hyphens: "auto" }}>{item.text}</p>}
            <AllergenLetters item={item} />
          </div>
          <Price item={item} currency={currency} locale={locale} className="shrink-0 font-sans font-medium" style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "var(--accent)" }} />
          {item.imageUrl && (
            <div className="shrink-0 overflow-hidden" style={{ width: 80, height: 80, borderRadius: 6 }}>
              <DishMedia src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-active:scale-110" />
            </div>
          )}
        </li>
      ))}
    </ul>
  ),
};

// ── Visual: photos first, two-column cards ──────────────────────────────

function PhotoCard({ item, currency, locale, onOpen }: { item: GuestItem; currency: string; locale: string; onOpen: (i: GuestItem) => void }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <TextRow item={item} currency={currency} locale={locale} onOpen={onOpen} />;
  return (
    <article {...rowProps(item, onOpen, { borderRadius: 10, aspectRatio: "4/3", backgroundColor: "#111" })} className="card-shimmer group relative overflow-hidden">
      <DishMedia src={item.imageUrl!} alt={item.name} sizes="100vw" onError={() => setBroken(true)} className="kenburns absolute inset-0 block h-full w-full object-contain transition-transform duration-700 group-active:scale-105" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.05) 80%)" }} />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 font-sans font-semibold text-white" style={{ fontSize: "0.95rem", lineHeight: 1.2, textShadow: "0 1px 8px rgba(0,0,0,0.95)", ...clamp3, WebkitLineClamp: 2 }}>
            {item.name}
          </h3>
          <Price item={item} currency={currency} locale={locale} compact className="shrink-0 font-sans text-sm font-semibold" style={{ color: "var(--accent)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }} />
        </div>
      </div>
      {!item.available && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <span className="px-2 py-1 font-sans text-[10px] uppercase tracking-regal" style={{ color: "rgba(245,240,236,0.8)", border: "1px solid rgba(245,240,236,0.3)" }}>
            {ui(locale).notAvailable}
          </span>
        </div>
      )}
    </article>
  );
}

function TextRow({ item, currency, locale, onOpen }: { item: GuestItem; currency: string; locale: string; onOpen: (i: GuestItem) => void }) {
  return (
    <article {...rowProps(item, onOpen, { borderBottom: "1px solid var(--color-border)" })} className="group flex items-baseline gap-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-sans text-lg font-medium transition-opacity group-hover:opacity-60" style={{ color: "var(--color-text)" }}>{item.name}</h3>
          <DietBadges item={item} locale={locale} />
          {!item.available && <UnavailableBadge locale={locale} />}
        </div>
        {item.text && <p className="mt-1 font-sans text-sm leading-relaxed" style={{ color: "var(--color-dim)" }}>{item.text}</p>}
        <AllergenLetters item={item} />
      </div>
      <Price item={item} currency={currency} locale={locale} className="shrink-0 font-sans text-base" style={{ color: "var(--color-text)" }} />
    </article>
  );
}

const visual: Look = {
  main: "max-w-2xl px-4",
  bleed: "-mx-4 px-4",
  sheetTitle: "font-display font-light",
  Header: ({ venue, about, isDark, text }) => (
    <header className="text-center">
      <VenueLogo name={venue.name} svg={venue.logo_svg} url={venue.logo_url} bg={venue.color_bg} accent={venue.color_primary} color="auto" height={52} textColor={text} isDarkBg={isDark} />
      {about && <p className="mx-auto mt-2 max-w-xs font-sans text-sm leading-snug" style={{ color: "var(--color-dim)", ...clamp3 }}>{about}</p>}
      <div className="mx-auto mt-3 h-px w-10" style={{ backgroundColor: "var(--accent)", opacity: 0.4 }} />
    </header>
  ),
  tab: (active) => ({
    className: "rounded-full px-4 py-1.5 font-sans text-[11px] uppercase tracking-regal transition-colors",
    style: {
      color: active ? "var(--color-bg)" : "var(--accent)",
      backgroundColor: active ? "var(--accent)" : "transparent",
      boxShadow: active ? "none" : "inset 0 0 0 1px var(--color-border)",
    },
  }),
  SectionTitle: classic.SectionTitle,
  Items: ({ section, currency, locale, onOpen }) => {
    const photos = section.items.filter((it) => it.imageUrl);
    const texts = section.items.filter((it) => !it.imageUrl);
    return (
      <>
        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            {photos.map((item, i) => (
              <div key={item.id} style={photos.length % 2 === 1 && i === photos.length - 1 ? { gridColumn: "1 / -1" } : undefined}>
                <PhotoCard item={item} currency={currency} locale={locale} onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
        {texts.map((item) => <TextRow key={item.id} item={item} currency={currency} locale={locale} onOpen={onOpen} />)}
      </>
    );
  },
};

export const LOOKS: Record<LookName, Look> = { classic, modern, visual };
