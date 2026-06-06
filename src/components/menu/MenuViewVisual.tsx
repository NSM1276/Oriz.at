"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ItemDetailModal } from "./ItemDetailModal";
import { StickyActionBar } from "./StickyActionBar";
import { MenuItemCardVisual } from "./MenuItemCardVisual";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { Item, MenuPayload } from "@/lib/supabase/types";

type DietFilter = "vegan" | "vegetarisch" | "glutenfrei";
const ALCOHOL_KEYWORDS = ["alkohol", "bier", "wein", "getränke", "drinks", "bar"];
function isAlcoholSection(name: string): boolean {
  const lower = name.toLowerCase();
  return ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw));
}

export function MenuViewVisual({ initial }: { initial: MenuPayload }) {
  const { venue, sections } = initial;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const openItem = useCallback((item: Item) => setSelectedItem(item), []);
  const closeItem = useCallback(() => setSelectedItem(null), []);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
      .channel(`venue:${venue.id}:items:visual`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `venue_id=eq.${venue.id}` },
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

  const sectionsWithItems = useMemo(() => {
    return sections.map((s) => {
      const list = Array.from(items.values())
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position);
      return { ...s, items: list };
    });
  }, [sections, items]);

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
      return () => { document.body.style.backgroundColor = ""; };
    }
  }, [venue.color_bg]);

  function getLuminance(hex: string): number {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  const isDark = venue.color_bg ? getLuminance(venue.color_bg) < 0.4 : false;
  const bg = venue.color_bg ?? "#F5F0EC";
  const text = isDark ? "#F5F0EC" : "#0A0A0A";
  const dim = isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)";
  const muted = isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)";
  const border = isDark ? "rgba(245,240,236,0.10)" : "rgba(10,10,10,0.10)";
  const accent = venue.color_primary ?? "#C69B3C";

  const cssVars = {
    "--color-bg": bg, "--color-text": text, "--color-dim": dim,
    "--color-muted": muted, "--color-border": border, "--accent": accent,
  } as React.CSSProperties;

  // IntersectionObserver: track which section is in view to highlight nav tab
  useEffect(() => {
    if (sectionsWithItems.length === 0) return;
    setActiveSection(sectionsWithItems[0].id);

    const observers: IntersectionObserver[] = [];
    sectionsWithItems.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(s.id); },
        { rootMargin: "-40% 0px -55% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", ...cssVars }}>
      <main className="max-w-2xl mx-auto px-4 pt-8 md:pt-14 pb-28" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>
        {/* Header — compact on mobile */}
        <header className="text-center mb-5">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={60}
            textColor={text}
            isDarkBg={isDark}
          />
          {venue.about && (
            <p
              className="font-sans text-sm mt-2 max-w-xs mx-auto leading-snug"
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
          <div className="w-10 h-px mx-auto mt-3" style={{ backgroundColor: accent, opacity: 0.4 }} />
        </header>

        {/* Sticky pill section nav */}
        {sectionsWithItems.length > 1 && (
          <div
            className="sticky top-0 z-20 -mx-4 px-4 py-3 overflow-x-auto"
            style={{ backgroundColor: bg, borderBottom: `1px solid ${border}`, scrollbarWidth: "none" }}
          >
            <div className="flex gap-2 whitespace-nowrap">
              {sectionsWithItems.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const el = document.getElementById(`section-${s.id}`);
                      if (!el) return;
                      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
                    }}
                    className="relative font-sans text-[11px] tracking-regal uppercase px-4 py-1.5 rounded-full transition-colors duration-200"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: isActive ? bg : accent,
                      backgroundColor: isActive ? accent : "transparent",
                      outline: isActive ? "none" : `1px solid ${border}`,
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ overflowX: "auto", scrollbarWidth: "none", margin: "12px -16px 0", padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap", paddingBottom: 10, paddingTop: 2 }}>
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
                  onClick={() => { if (key === "alcohol") setHideAlcohol((v) => !v); else toggleDiet(key); }}
                  style={{
                    height: 36, padding: "0 14px", borderRadius: 18,
                    border: `1px solid ${isActive ? accent : border}`,
                    backgroundColor: isActive ? accent : "transparent",
                    color: isActive ? bg : text,
                    fontFamily: "var(--font-inter, sans-serif)", fontSize: 11,
                    letterSpacing: "0.08em", textTransform: "uppercase" as const,
                    cursor: "pointer", opacity: isActive ? 1 : 0.55,
                    transition: "all 180ms", flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        {filteredSections.map((s, sIdx) => {
          if (s.items.length === 0) return null;

          // Split items: photo items in a 2-col grid, text-only items in a list
          const photoItems = s.items.filter((it) => it.image_url);
          const textItems = s.items.filter((it) => !it.image_url);

          return (
            <section
              key={s.id}
              id={`section-${s.id}`}
              className="mt-10 md:mt-14"
            >
              {/* Section header */}
              <header className="mb-4 flex items-center gap-3">
                <span className="font-sans text-[11px] tracking-regal uppercase shimmer-title">
                  {s.name}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: border }} />
              </header>

              {/* Photo grid — 2 columns; odd last item spans full width */}
              {photoItems.length > 0 && (
                <div
                  className="grid gap-3 mb-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  {photoItems.map((item, idx) => {
                    const isLastOdd = photoItems.length % 2 === 1 && idx === photoItems.length - 1;
                    return (
                      <div
                        key={item.id}
                        style={isLastOdd ? { gridColumn: "1 / -1" } : undefined}
                      >
                        <MenuItemCardVisual item={item} currency={venue.currency} onClick={openItem} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text-only list */}
              {textItems.length > 0 && (
                <ul>
                  {textItems.map((item) => (
                    <li key={item.id}>
                      <MenuItemCardVisual item={item} currency={venue.currency} onClick={openItem} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {/* Footer */}
        <footer className="mt-14 mb-8 flex flex-col items-center gap-5">
          <div className="flex items-center gap-6">
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
          </div>
          <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: muted }}>
            Powered by ORIZ
          </span>
        </footer>
      </main>

      <ItemDetailModal item={selectedItem} currency={venue.currency} onClose={closeItem} theme="visual" accent={accent} />
      <StickyActionBar venue={venue} theme="visual" />
    </div>
  );
}
