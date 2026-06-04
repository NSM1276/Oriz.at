"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { ItemDetailModal } from "./ItemDetailModal";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { Item, MenuPayload, Section } from "@/lib/supabase/types";

// ── Modern Item Row ─────────────────────────────────────────────
function ModernItemRow({
  item,
  currency,
  onClick,
  index,
}: {
  item: Item;
  currency: string;
  onClick: (item: Item) => void;
  index: number;
}) {
  const dim = !item.is_active;
  const clickable = !!(item.description || item.image_url || item.ai_caption);

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: dim ? 0.35 : 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onClick={clickable ? () => onClick(item) : undefined}
      className="group relative"
      style={{ cursor: clickable ? "pointer" : "default" }}
    >
      {/* Full-width hover background */}
      <div
        className="absolute inset-0 -mx-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ backgroundColor: "var(--accent)", opacity: 0 }}
      />
      <div
        className="relative flex items-center gap-4 py-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Index number */}
        <span
          className="font-display font-light tabular-nums shrink-0 select-none"
          style={{
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            color: "var(--accent)",
            opacity: 0.25,
            lineHeight: 1,
            width: "2.5rem",
            textAlign: "right",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3
              className="font-display font-light leading-tight transition-opacity group-hover:opacity-60"
              style={{
                fontSize: "clamp(1.15rem, 3vw, 1.45rem)",
                color: "var(--color-text)",
              }}
            >
              {item.name}
            </h3>
            {!dim && clickable && (
              <span
                className="font-sans text-[10px] opacity-0 group-hover:opacity-70 transition-opacity"
                style={{ color: "var(--accent)" }}
                aria-hidden
              >
                ↗
              </span>
            )}
            {dim && (
              <span
                className="font-sans text-[9px] tracking-regal uppercase px-1.5 py-0.5 shrink-0"
                style={{ color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
              >
                N/A
              </span>
            )}
          </div>
          {item.description && (
            <p
              className="font-sans text-[13px] mt-0.5 leading-snug"
              style={{ color: "var(--color-muted)" }}
            >
              {item.description}
            </p>
          )}
          {item.allergens?.trim() && (
            <p
              className="font-sans text-[10px] mt-1 uppercase tracking-wider"
              style={{ color: "var(--color-muted)", opacity: 0.6 }}
            >
              {item.allergens}
            </p>
          )}
        </div>

        {/* Price — right aligned, accent color */}
        <span
          className="font-sans tabular-nums shrink-0 font-medium"
          style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "var(--accent)" }}
        >
          {formatPrice(item.price_cents, currency)}
        </span>

        {/* Photo thumbnail — 80px square */}
        {item.image_url && (
          <div
            className="shrink-0 overflow-hidden"
            style={{ width: 80, height: 80, borderRadius: 6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-active:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </motion.li>
  );
}

// ── Modern Section ──────────────────────────────────────────────
function ModernSection({
  section,
  items,
  currency,
  onItemClick,
  sectionIndex,
}: {
  section: Section;
  items: Item[];
  currency: string;
  onItemClick: (item: Item) => void;
  sectionIndex: number;
}) {
  if (items.length === 0) return null;

  return (
    <motion.section
      id={`section-${section.id}`}
      className="mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      {/* Section header — large number + name */}
      <div className="flex items-end gap-5 mb-8">
        <span
          className="font-display font-light leading-none select-none"
          style={{
            fontSize: "clamp(4rem, 12vw, 7rem)",
            color: "var(--accent)",
            opacity: 0.12,
            lineHeight: 0.85,
          }}
        >
          {String(sectionIndex + 1).padStart(2, "0")}
        </span>
        <div className="pb-1">
          <h2
            className="font-display font-light shimmer-title"
            style={{
              fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)",
              letterSpacing: "-0.01em",
            }}
          >
            {section.name}
          </h2>
          <div className="mt-1.5 h-px w-10" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      </div>

      <ul>
        {items.map((item, i) => (
          <ModernItemRow
            key={item.id}
            item={item}
            currency={currency}
            onClick={onItemClick}
            index={i}
          />
        ))}
      </ul>
    </motion.section>
  );
}

// ── Main ────────────────────────────────────────────────────────
export function MenuViewModern({ initial }: { initial: MenuPayload }) {
  const { venue, sections } = initial;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const openItem = useCallback((item: Item) => setSelectedItem(item), []);
  const closeItem = useCallback(() => setSelectedItem(null), []);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [items, setItems] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>();
    for (const s of sections) for (const it of s.items) map.set(it.id, it);
    return map;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venue.id}:items:modern`)
      .on("postgres_changes",
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
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [venue.id]);

  const sectionsWithItems = useMemo(() => {
    return sections.map((s) => ({
      ...s,
      items: Array.from(items.values())
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position),
    }));
  }, [sections, items]);

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
  const border = isDark ? "rgba(245,240,236,0.10)" : "rgba(10,10,10,0.08)";
  const accent = venue.color_primary ?? "#C69B3C";

  const cssVars = {
    "--color-bg": bg, "--color-text": text, "--color-dim": dim,
    "--color-muted": muted, "--color-border": border, "--accent": accent,
  } as React.CSSProperties;

  // Track active section for nav
  useEffect(() => {
    if (sectionsWithItems.length === 0) return;
    setActiveSection(sectionsWithItems[0].id);
    const observers: IntersectionObserver[] = [];
    sectionsWithItems.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(s.id); },
        { rootMargin: "-35% 0px -60% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", ...cssVars }}>
      {/* Sticky side nav — vertical on desktop, horizontal on mobile */}
      {sectionsWithItems.length > 1 && (
        <nav
          className="sticky top-0 z-20 overflow-x-auto"
          style={{
            backgroundColor: bg,
            borderBottom: `1px solid ${border}`,
            scrollbarWidth: "none",
          }}
        >
          <div className="flex gap-0 whitespace-nowrap max-w-2xl mx-auto px-6">
            {sectionsWithItems.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    const el = document.getElementById(`section-${s.id}`);
                    if (!el) return;
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 52, behavior: "smooth" });
                  }}
                  className="font-sans text-[11px] tracking-regal uppercase py-3 px-4 transition-all duration-200 relative"
                  style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? accent : muted }}
                >
                  {s.name}
                  {isActive && (
                    <motion.div
                      layoutId="modern-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: accent }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <main className="max-w-2xl mx-auto px-6 pt-16 pb-12">
        {/* Header */}
        <motion.header
          className="mb-16"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={90}
            textColor={text}
            isDarkBg={isDark}
          />
          {venue.about && (
            <p
              className="font-sans text-sm mt-5 leading-relaxed max-w-md"
              style={{ color: dim }}
            >
              {venue.about}
            </p>
          )}
          {/* Gold rule */}
          <div className="mt-7 flex items-center gap-4">
            <div className="h-px flex-1" style={{ backgroundColor: border }} />
            <span className="font-sans text-[10px] tracking-regal uppercase" style={{ color: muted }}>
              Speisekarte
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: border }} />
          </div>
        </motion.header>

        {/* Sections */}
        {sectionsWithItems.map((s, i) => (
          <ModernSection
            key={s.id}
            section={s}
            items={s.items}
            currency={venue.currency}
            onItemClick={openItem}
            sectionIndex={i}
          />
        ))}

        {/* Footer */}
        <footer className="mt-24 mb-8 flex flex-col items-center gap-4">
          <div className="h-px w-full" style={{ backgroundColor: border }} />
          <div className="flex items-center gap-6 pt-2">
            {venue.instagram_url && (
              <a href={venue.instagram_url} target="_blank" rel="noreferrer"
                className="font-sans text-[10px] tracking-regal uppercase transition-opacity hover:opacity-60"
                style={{ color: muted }}>Instagram</a>
            )}
            {venue.google_maps_url && (
              <a href={venue.google_maps_url} target="_blank" rel="noreferrer"
                className="font-sans text-[10px] tracking-regal uppercase transition-opacity hover:opacity-60"
                style={{ color: muted }}>Maps</a>
            )}
          </div>
          <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: muted }}>
            Powered by ORIZ
          </span>
        </footer>
      </main>

      <ItemDetailModal item={selectedItem} currency={venue.currency} onClose={closeItem} theme="modern" accent={accent} />
    </div>
  );
}
