"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionBlock } from "./SectionBlock";
import { ItemDetailModal } from "./ItemDetailModal";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { Item, MenuPayload } from "@/lib/supabase/types";

export function MenuView({ initial }: { initial: MenuPayload }) {
  const { venue, sections } = initial;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const openItem = useCallback((item: Item) => setSelectedItem(item), []);
  const closeItem = useCallback(() => setSelectedItem(null), []);

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
          setItems((prev) => {
            const next = new Map(prev);
            if (payload.eventType === "DELETE") {
              const old = payload.old as Item;
              if (old?.id) next.delete(old.id);
            } else {
              const row = payload.new as Item;
              if (row?.id) next.set(row.id, row);
            }
            return next;
          });
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
    <div style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-8" style={cssVars}>
        <header className="text-center">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={120}
            textColor={text}
            isDarkBg={isDark}
          />
          {venue.about && (
            <p className="font-display italic text-lg md:text-xl mt-6 max-w-xl mx-auto" style={{ color: dim }}>
              {venue.about}
            </p>
          )}
          <div className="w-24 h-px mx-auto mt-8" style={{ backgroundColor: accent, opacity: 0.6 }} />
        </header>

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

        {sectionsWithItems.map((s) => (
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
    </div>
  );
}
