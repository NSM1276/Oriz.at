"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Item, MenuPayload } from "@/lib/supabase/types";
import { getActiveMenuId } from "@/lib/menu-schedule";
import { localizeSection } from "@/lib/menu-i18n";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { buildPages, selectVisibleSections } from "./paginate";
import type { ScreenParams } from "./screen-params";
import type { ScreenPalette } from "./screen-colors";
import { ScreenPage, ROWS_PER_PAGE } from "./ScreenPage";

const WIDE_QUERY = "(min-width: 1600px)";
const MENU_RECHECK_MS = 60_000;
const CLOCK_TICK_MS = 15_000;
const RELOAD_AFTER_MS = 24 * 60 * 60 * 1000;

type Props = {
  initial: MenuPayload;
  params: ScreenParams;
  palette: ScreenPalette;
};

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ScreenBoard({ initial, params, palette }: Props) {
  const { venue, sections, menus = [] } = initial;

  // ── Live items (same Realtime contract as the guest menu) ──
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
        { event: "*", schema: "public", table: "items", filter: `venue_id=eq.${venue.id}` },
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
  }, [venue.id]);

  // ── Active menu by schedule, re-evaluated every minute ──
  const [activeMenuId, setActiveMenuId] = useState<string | null>(() => getActiveMenuId(menus));
  useEffect(() => {
    const id = setInterval(() => setActiveMenuId(getActiveMenuId(menus)), MENU_RECHECK_MS);
    return () => clearInterval(id);
  }, [menus]);

  // ── Columns from viewport width ──
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => setColumns(mq.matches ? 3 : 2);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Pages ──
  const pages = useMemo(() => {
    const visible = selectVisibleSections(sections, items, activeMenuId)
      .map((s) => localizeSection(s, params.lang));
    return buildPages(visible, columns * ROWS_PER_PAGE);
  }, [sections, items, activeMenuId, columns, params.lang]);

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
    }, params.seconds * 1000);
    return () => clearTimeout(id);
  }, [safeIndex, params.seconds, hasMultiplePages]);

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
    const id = setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
    return () => { document.body.style.backgroundColor = prev; clearTimeout(id); };
  }, [palette.bg]);

  function requestFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  const page = pages[safeIndex];

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
      }}
    >
      {page ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={page.key}
            initial={{ opacity: 0, y: "2vh" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-2vh" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <ScreenPage
              venue={venue}
              page={page}
              columns={columns}
              palette={palette}
              seconds={params.seconds}
              clock={clock}
            />
          </motion.div>
        </AnimatePresence>
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
          <div className="font-display" style={{ fontSize: "4vh", fontWeight: 300, color: palette.dim }}>
            Speisekarte wird vorbereitet
          </div>
        </div>
      )}
    </div>
  );
}
