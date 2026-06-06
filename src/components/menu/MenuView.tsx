"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionBlock } from "./SectionBlock";
import { ItemDetailModal } from "./ItemDetailModal";
import { StickyActionBar } from "./StickyActionBar";
import { MenuViewVisual } from "./MenuViewVisual";
import { MenuViewModern } from "./MenuViewModern";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { getActiveMenuId } from "@/lib/menu-schedule";
import type { Item, MenuData, MenuPayload } from "@/lib/supabase/types";

// ── Menu tab bar (Classic style) ────────────────────────────────
function MenuTabBar({
  menus,
  selectedMenuId,
  onSelect,
  accent,
  bg,
  border,
}: {
  menus: MenuData[];
  selectedMenuId: string | null;
  onSelect: (id: string) => void;
  accent: string;
  bg: string;
  border: string;
}) {
  if (menus.length <= 1) return null;
  return (
    <div
      className="overflow-x-auto -mx-6 px-6 mb-6 mt-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex gap-2 whitespace-nowrap">
        {menus.map((m) => {
          const isActive = selectedMenuId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              style={{
                minHeight: 44,
                background: isActive ? accent : "transparent",
                color: isActive ? bg : accent,
                border: `1px solid ${isActive ? accent : border}`,
                borderRadius: 4,
                padding: "0 18px",
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.18s, color 0.18s",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Filter types ────────────────────────────────────────────────
type DietFilter = "vegan" | "vegetarisch" | "glutenfrei";
const ALCOHOL_KEYWORDS = ["alkohol", "bier", "wein", "getränke", "drinks", "bar"];

function isAlcoholSection(name: string): boolean {
  const lower = name.toLowerCase();
  return ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw));
}

export function MenuView({ initial }: { initial: MenuPayload }) {
  const theme = initial.venue.menu_theme ?? "classic";
  if (theme === "visual") return <MenuViewVisual initial={initial} />;
  if (theme === "modern") return <MenuViewModern initial={initial} />;
  // falls through to Classic below
  const { venue, sections, menus = [] } = initial;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const openItem = useCallback((item: Item) => setSelectedItem(item), []);
  const closeItem = useCallback(() => setSelectedItem(null), []);

  // Menu switcher state
  const defaultMenuId = useMemo(
    () => (menus.length > 1 ? getActiveMenuId(menus) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(defaultMenuId);

  // Diet / alcohol filter state
  const [hideAlcohol, setHideAlcohol] = useState(false);
  const [dietFilters, setDietFilters] = useState<Set<DietFilter>>(new Set());

  function toggleDiet(tag: DietFilter) {
    setDietFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }

  const [items, setItems] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>();
    for (const s of sections) for (const it of s.items) map.set(it.id, it);
    return map;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venue.id}:items`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `venue_id=eq.${venue.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Item;
            if (old?.id) {
              setItems((prev) => { const next = new Map(prev); next.delete(old.id); return next; });
              setSelectedItem((cur) => (cur?.id === old.id ? null : cur));
            }
          } else {
            const row = payload.new as Item;
            if (row?.id) setItems((prev) => { const next = new Map(prev); next.set(row.id, row); return next; });
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [venue.id]);

  const allSectionsWithItems = useMemo(() => {
    return sections.map((s) => {
      const list = Array.from(items.values())
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position);
      return { ...s, items: list };
    });
  }, [sections, items]);

  // 1. Filter by active menu (null menu_id = global, always shown)
  const sectionsWithItems = useMemo(() => {
    if (menus.length <= 1 || !selectedMenuId) return allSectionsWithItems;
    return allSectionsWithItems.filter(
      (s) => s.menu_id === selectedMenuId || s.menu_id == null,
    );
  }, [allSectionsWithItems, menus.length, selectedMenuId]);

  // 2. Filter by diet tags / alcohol (applied on top of menu filter)
  const filteredSections = useMemo(() => {
    return sectionsWithItems
      .filter((s) => !(hideAlcohol && isAlcoholSection(s.name)))
      .map((s) => {
        if (dietFilters.size === 0) return s;
        const filtered = s.items.filter((it) =>
          Array.from(dietFilters).every((tag) => it.diet_tags?.includes(tag))
        );
        return { ...s, items: filtered };
      })
      .filter((s) => s.items.length > 0);
  }, [sectionsWithItems, hideAlcohol, dietFilters]);

  useEffect(() => {
    if (venue.color_bg) {
      document.body.style.backgroundColor = venue.color_bg;
      return () => { document.body.style.backgroundColor = ''; };
    }
  }, [venue.color_bg]);

  // Compute relative luminance (WCAG formula) to decide text colour.
  // isDark = true  → use light text (parchment)
  // isDark = false → use dark text (onyx)
  function getLuminance(hex: string): number {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  const isDark = venue.color_bg
    ? getLuminance(venue.color_bg) < 0.4
    : false;
  const bg      = venue.color_bg      ?? '#F5F0EC';
  const text    = isDark ? '#F5F0EC'  : '#0A0A0A';
  const dim     = isDark ? 'rgba(245,240,236,0.60)' : 'rgba(10,10,10,0.60)';
  const muted   = isDark ? 'rgba(245,240,236,0.30)' : 'rgba(10,10,10,0.30)';
  const border  = isDark ? 'rgba(245,240,236,0.10)' : 'rgba(10,10,10,0.10)';
  const accent  = venue.color_primary ?? '#C69B3C';

  const cssVars = {
    '--color-bg': bg, '--color-text': text, '--color-dim': dim,
    '--color-muted': muted, '--color-border': border, '--accent': accent,
  } as React.CSSProperties;

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', ...cssVars }}>
      <main className="max-w-3xl mx-auto px-6 pt-8 md:pt-16 pb-28" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>
        <header className="text-center mb-0">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={70}
            textColor={text}
            isDarkBg={isDark}
          />
          {venue.about && (
            <p
              className="font-display italic text-base md:text-lg mt-3 max-w-xs md:max-w-xl mx-auto"
              style={{
                color: dim,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              } as React.CSSProperties}
            >
              {venue.about}
            </p>
          )}
          <div className="w-16 h-px mx-auto mt-4" style={{ backgroundColor: accent, opacity: 0.6 }} />
        </header>

        {/* Menu switcher tabs — only shown when venue has multiple menus */}
        <MenuTabBar
          menus={menus}
          selectedMenuId={selectedMenuId}
          onSelect={(id) => { setSelectedMenuId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          accent={accent}
          bg={bg}
          border={border}
        />

        {/* Section jump nav */}
        {sectionsWithItems.length > 1 && (
          <div
            className="sticky top-0 z-20 mt-8 -mx-6 px-6 overflow-x-auto"
            style={{
              backgroundColor: bg,
              borderBottom: `1px solid ${border}`,
              scrollbarWidth: 'none',
            }}
          >
            <div className="flex gap-0 py-3 whitespace-nowrap">
              {sectionsWithItems.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const el = document.getElementById(`section-${s.id}`);
                    if (!el) return;
                    const top = el.getBoundingClientRect().top + window.scrollY - 56;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }}
                  className="font-sans text-[11px] tracking-regal uppercase px-4 py-1.5 transition-opacity hover:opacity-70"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: accent,
                    borderRight: i < sectionsWithItems.length - 1 ? `1px solid ${border}` : 'none',
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div
          style={{
            overflowX: "auto",
            scrollbarWidth: "none",
            margin: "16px -24px 0",
            padding: "0 16px 0",
          }}
        >
          <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap", paddingBottom: 12, paddingTop: 4 }}>
            {(
              [
                { key: "alcohol" as const, label: "Alkohol" },
                { key: "vegan" as const, label: "Vegan" },
                { key: "vegetarisch" as const, label: "Vegetarisch" },
                { key: "glutenfrei" as const, label: "Glutenfrei" },
              ] as const
            ).map(({ key, label }) => {
              const isActive = key === "alcohol" ? hideAlcohol : dietFilters.has(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "alcohol") setHideAlcohol((v) => !v);
                    else toggleDiet(key);
                  }}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 18,
                    border: `1px solid ${isActive ? accent : border}`,
                    backgroundColor: isActive ? accent : "transparent",
                    color: isActive ? (accent === "#C69B3C" ? "#0A0A0A" : text) : text,
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    cursor: "pointer",
                    opacity: isActive ? 1 : 0.55,
                    transition: "all 180ms",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredSections.map((s) => (
          <SectionBlock key={s.id} section={s} items={s.items} currency={venue.currency} onItemClick={openItem} />
        ))}

        <footer className="mt-24 mb-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">

            {/* Instagram */}
            {venue.instagram_url ? (
              <a href={venue.instagram_url} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ color: dim }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Instagram</span>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1.5" style={{ color: muted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Instagram</span>
              </div>
            )}

            {/* Google Maps */}
            {venue.google_maps_url ? (
              <a href={venue.google_maps_url} target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ color: dim }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Maps</span>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1.5" style={{ color: muted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Maps</span>
              </div>
            )}

            {/* Facebook — placeholder */}
            <div className="flex flex-col items-center gap-1.5" style={{ color: muted }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-sans text-[9px] tracking-regal uppercase">Facebook</span>
            </div>

            {/* Website — placeholder */}
            <div className="flex flex-col items-center gap-1.5" style={{ color: muted }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className="font-sans text-[9px] tracking-regal uppercase">Website</span>
            </div>

          </div>

          <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: muted }}>
            Powered by ORIZ
          </span>
        </footer>
      </main>

      <ItemDetailModal item={selectedItem} currency={venue.currency} onClose={closeItem} />
      <StickyActionBar venue={venue} theme="classic" />
    </div>
  );
}
