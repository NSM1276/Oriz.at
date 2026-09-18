"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Item, MenuPayload, ScreenSettingsRow, Section, Venue } from "@/lib/supabase/types";
import { getActiveMenuId } from "@/lib/menu-schedule";
import { localizeSection } from "@/lib/menu-i18n";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { buildPages, selectVisibleSections } from "./paginate";
import { resolveScreenConfig, type ScreenUrlOverrides } from "./screen-config";
import { buildPalette } from "./screen-colors";
import { ScreenPage } from "./ScreenPage";
import { ScreenSpotlight } from "./ScreenSpotlight";

const MENU_RECHECK_MS = 60_000;
const CLOCK_TICK_MS = 15_000;
const HERO_TICK_MS = 6_000;
const RELOAD_AFTER_MS = 24 * 60 * 60 * 1000;

type SectionWithItems = Section & { items: Item[] };

type Props = {
  initial: MenuPayload;
  /** `screen_settings` row as read on the server; null = defaults */
  initialSettings: ScreenSettingsRow | null;
  /** testing overrides from the URL */
  url: ScreenUrlOverrides;
};

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ScreenBoard({ initial, initialSettings, url }: Props) {
  const { menus = [] } = initial;

  // ── Everything the owner can edit lives in state and is kept current over
  //    Realtime. A TV on the wall can't be reloaded by hand, so a colour or
  //    settings change has to land on the screen the same way a price does.
  const [venue, setVenue] = useState<Venue>(initial.venue);
  const [settings, setSettings] = useState<ScreenSettingsRow | null>(initialSettings);
  const [sectionMeta, setSectionMeta] = useState<SectionWithItems[]>(initial.sections);
  const [items, setItems] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>();
    for (const s of initial.sections) for (const it of s.items) map.set(it.id, it);
    return map;
  });

  const config = useMemo(() => resolveScreenConfig(settings, venue, url), [settings, venue, url]);
  const palette = useMemo(
    () => buildPalette(config.colorBg, config.colorPrimary),
    [config.colorBg, config.colorPrimary],
  );

  const venueId = initial.venue.id;

  // ── Realtime: dishes ──
  useEffect(() => {
    if (config.preview) return; // embedded thumbnail: don't hold a Realtime channel
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venueId}:items`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `venue_id=eq.${venueId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Item;
            if (old?.id) setItems((prev) => { const next = new Map(prev); next.delete(old.id); return next; });
          } else {
            const row = payload.new as Item;
            if (row?.id) setItems((prev) => { const next = new Map(prev); next.set(row.id, row); return next; });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [venueId, config.preview]);

  // ── Realtime: design and settings (venue colours/logo, screen_settings, section names) ──
  useEffect(() => {
    if (config.preview) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venueId}:screen`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "screen_settings", filter: `venue_id=eq.${venueId}` },
        (payload) => {
          // DELETE (e.g. the nightly demo reset) puts the board back on defaults.
          if (payload.eventType === "DELETE") setSettings(null);
          else setSettings(payload.new as ScreenSettingsRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "venues", filter: `id=eq.${venueId}` },
        (payload) => {
          const row = payload.new as Partial<Venue>;
          if (row?.id) setVenue((prev) => ({ ...prev, ...row }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sections", filter: `venue_id=eq.${venueId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Section;
            if (old?.id) setSectionMeta((prev) => prev.filter((s) => s.id !== old.id));
            return;
          }
          const row = payload.new as Section;
          if (!row?.id) return;
          setSectionMeta((prev) =>
            prev.some((s) => s.id === row.id)
              ? prev.map((s) => (s.id === row.id ? { ...s, ...row } : s))
              : [...prev, { ...row, items: [] }],
          );
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [venueId, config.preview]);

  // ── Active menu by schedule, re-evaluated every minute ──
  const [activeMenuId, setActiveMenuId] = useState<string | null>(() => getActiveMenuId(menus));
  useEffect(() => {
    const id = setInterval(() => setActiveMenuId(getActiveMenuId(menus)), MENU_RECHECK_MS);
    return () => clearInterval(id);
  }, [menus]);

  // ── Pages ──
  const pages = useMemo(() => {
    if (!config.active) return [];
    const visible = selectVisibleSections(sectionMeta, items, activeMenuId, config.sectionIds)
      .map((s) => localizeSection(s, config.lang));
    return buildPages(visible, { spotlight: config.spotlight, heroPins: config.heroPins });
  }, [sectionMeta, items, activeMenuId, config]);

  // ── Rotation: setTimeout re-armed per page; page count read via ref so a
  //    Realtime recompute does not reset the timer ──
  const [index, setIndex] = useState(0);
  const pageCountRef = useRef(pages.length);
  pageCountRef.current = pages.length;
  const safeIndex = pages.length ? index % pages.length : 0;
  const hasMultiplePages = pages.length > 1;

  useEffect(() => {
    if (!hasMultiplePages) return;
    const id = setTimeout(() => {
      setIndex((i) => (pageCountRef.current ? (i + 1) % pageCountRef.current : 0));
    }, config.seconds * 1000);
    return () => clearTimeout(id);
  }, [safeIndex, config.seconds, hasMultiplePages]);

  // ── Hero cycles through the section's photo dishes on its own clock ──
  const [heroTick, setHeroTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHeroTick((t) => t + 1), HERO_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── Clock ──
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── TV hygiene: body background, daily reload ──
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = palette.bg;
    if (config.preview) {
      return () => { document.body.style.backgroundColor = prev; };
    }
    const id = setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
    return () => { document.body.style.backgroundColor = prev; clearTimeout(id); };
  }, [palette.bg, config.preview]);

  function requestFullscreen() {
    if (config.preview) return; // embedded: a click must not grab the whole screen
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  const page = pages[safeIndex];
  const heroItem =
    page?.kind === "board" && page.heroItems.length
      ? page.heroItems[heroTick % page.heroItems.length]
      : null;

  return (
    <div
      onClick={requestFullscreen}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: palette.bg,
        cursor: "none",
        userSelect: "none",
        transition: "background-color 600ms ease",
      }}
    >
      {page ? (
        <>
          <div style={{ position: "absolute", inset: "0 0 7vh 0" }}>
            <AnimatePresence initial={false}>
              <motion.div
                key={page.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0 }}
              >
                {page.kind === "spotlight" ? (
                  <ScreenSpotlight venue={venue} page={page} palette={palette} />
                ) : (
                  <ScreenPage venue={venue} page={page} heroItem={heroItem} palette={palette} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer strip — shared by every page kind */}
          <footer
            className="font-sans"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "7vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 3vw",
              borderTop: `1px solid ${palette.border}`,
              background: palette.bg,
              color: palette.muted,
              fontSize: "1.7vh",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              transition: "background-color 600ms ease",
            }}
          >
            <div className="screen-logo" style={{ color: palette.text }}>
              <VenueLogo
                svg={venue.logo_svg}
                url={venue.logo_url}
                name={venue.name}
                color="auto"
                bg={palette.bg}
                accent={palette.accent}
                isDarkBg={palette.isDark}
                height={40}
              />
            </div>
            <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>{clock}</span>
          </footer>

          {/* Progress bar — remounts per page key so the animation restarts */}
          <div
            key={page.key}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: "0.45vh",
              width: "0%",
              background: palette.accent,
              animation: `screen-progress ${config.seconds}s linear forwards`,
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4vh",
            color: palette.text,
          }}
        >
          <div className="screen-logo">
            <VenueLogo
              svg={venue.logo_svg}
              url={venue.logo_url}
              name={venue.name}
              color="auto"
              bg={palette.bg}
              accent={palette.accent}
              isDarkBg={palette.isDark}
              height={120}
            />
          </div>
          {config.active && (
            <div className="font-display" style={{ fontSize: "4vh", fontWeight: 300, color: palette.dim }}>
              Speisekarte wird vorbereitet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
