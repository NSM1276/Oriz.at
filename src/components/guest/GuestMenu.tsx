"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALLERGEN_LABELS } from "@/lib/allergens";
import {
  EMPTY_FILTER,
  applyFilter,
  buildSections,
  filterActive,
  filterOptions,
  usedAllergens,
  type GuestItem,
  type MenuFilter,
  type RawItem,
} from "@/lib/guest-menu";
import { BASE_LOCALE, allergenName, count, localizeAbout, ui } from "@/lib/menu-i18n";
import { getActiveMenuId } from "@/lib/menu-schedule";
import type { MenuPayload } from "@/lib/supabase/types";
import { LanguageSwitcher } from "@/components/menu/LanguageSwitcher";
import { StickyActionBar } from "@/components/menu/StickyActionBar";
import { DishSheet } from "./DishSheet";
import { FilterSheet } from "./FilterSheet";
import { LOOKS, type LookName } from "./looks";

// The guest menu: one behaviour, three looks. Everything a guest can do —
// language, menu of the day, search, filters, dish details — lives here once;
// looks.tsx only decides how sections and dishes are drawn.

const SEARCH_MIN_ITEMS = 8;

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
}

function palette(colorBg: string | null, colorPrimary: string | null) {
  const bg = colorBg ?? "#F5F0EC";
  const isDark = colorBg ? luminance(colorBg) < 0.4 : false;
  const ink = isDark ? "245,240,236" : "10,10,10";
  return {
    isDark,
    bg,
    text: isDark ? "#F5F0EC" : "#0A0A0A",
    vars: {
      "--color-bg": bg,
      "--color-text": isDark ? "#F5F0EC" : "#0A0A0A",
      "--color-dim": `rgba(${ink},0.62)`,
      "--color-muted": `rgba(${ink},0.40)`,
      "--color-border": `rgba(${ink},0.10)`,
      "--accent": colorPrimary ?? "#C69B3C",
    } as React.CSSProperties,
  };
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

export function GuestMenu({ initial, initialLocale = BASE_LOCALE }: { initial: MenuPayload; initialLocale?: string }) {
  const { venue, menus = [] } = initial;
  const lookName: LookName = venue.menu_theme ?? "classic";
  const look = LOOKS[lookName] ?? LOOKS.classic;
  const enabledLocales = venue.enabled_locales ?? [];
  const colors = palette(venue.color_bg, venue.color_primary);

  // ── language ──
  const langKey = `oriz-lang-${venue.slug}`;
  const [locale, setLocale] = useState(initialLocale);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(langKey);
      if (saved && (saved === BASE_LOCALE || enabledLocales.includes(saved))) setLocale(saved);
    } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function changeLocale(next: string) {
    setLocale(next);
    try { localStorage.setItem(langKey, next); } catch { /* ignore */ }
  }
  const t = ui(locale);

  // ── live dishes: sold-out and price changes show up without a reload ──
  const [items, setItems] = useState<RawItem[]>(() => initial.sections.flatMap((s) => s.items as unknown as RawItem[]));
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venue.id}:items`)
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `venue_id=eq.${venue.id}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string })?.id;
          if (id) setItems((prev) => prev.filter((it) => it.id !== id));
        } else {
          const row = payload.new as RawItem;
          if (row?.id) setItems((prev) => [...prev.filter((it) => it.id !== row.id), row]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [venue.id]);

  // ── which menu (lunch / dinner …), when the venue has several ──
  const [menuId, setMenuId] = useState<string | null>(() => (menus.length > 1 ? getActiveMenuId(menus) : null));

  const sections = useMemo(
    () => buildSections(initial.sections, items, locale, menus.length > 1 ? menuId : null),
    [initial.sections, items, locale, menus.length, menuId],
  );
  const options = useMemo(() => filterOptions(sections), [sections]);
  const [filter, setFilter] = useState<MenuFilter>(EMPTY_FILTER);
  const result = useMemo(() => applyFilter(sections, filter), [sections, filter]);
  const legend = useMemo(() => usedAllergens(sections), [sections]);
  const totalItems = options.total;

  const canSearch = totalItems >= SEARCH_MIN_ITEMS;
  const canFilter = options.diet.length > 0 || options.avoid.length > 0;
  const activeFilterCount = filter.diet.size + filter.avoid.size;
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searching = filter.query.trim() !== "";

  // ── dish sheet follows live data and language ──
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo<GuestItem | null>(
    () => (openId ? sections.flatMap((s) => s.items).find((it) => it.id === openId) ?? null : null),
    [openId, sections],
  );
  const closeItem = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    document.body.style.backgroundColor = colors.bg;
    return () => { document.body.style.backgroundColor = ""; };
  }, [colors.bg]);

  // ── section tabs follow the scroll ──
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const visibleIds = result.sections.map((s) => s.id).join(",");
  useEffect(() => {
    const ids = visibleIds ? visibleIds.split(",") : [];
    setActiveSection(ids[0] ?? null);
    const observers = ids.map((id) => {
      const el = document.getElementById(`section-${id}`);
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActiveSection(id); }, { rootMargin: "-35% 0px -60% 0px" });
      if (el) obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [visibleIds]);
  useEffect(() => {
    const box = tabsRef.current;
    const tab = box?.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
    if (box && tab) box.scrollTo({ left: tab.offsetLeft - box.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [activeSection]);

  function jumpTo(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const showTabs = !searching && result.sections.length > 1;
  const showToolbar = showTabs || canSearch || canFilter;

  const links = [
    venue.instagram_url && { href: venue.instagram_url, label: "Instagram" },
    venue.facebook_url && { href: venue.facebook_url, label: "Facebook" },
    venue.website_url && { href: venue.website_url, label: "Website" },
    venue.google_maps_url && { href: venue.google_maps_url, label: "Maps" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh", color: "var(--color-text)", ...colors.vars }}>
      <main className={`mx-auto ${look.main} pt-6 md:pt-14`} style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}>
        <look.Header venue={venue} about={localizeAbout(venue, locale)} isDark={colors.isDark} text={colors.text} locale={locale} />

        {(enabledLocales.length > 0 || menus.length > 1) && (
          <div className={`mt-5 flex items-center gap-2 overflow-x-auto ${look.bleed}`} style={{ scrollbarWidth: "none" }}>
            {enabledLocales.length > 0 && (
              <LanguageSwitcher enabledLocales={enabledLocales} locale={locale} onChange={changeLocale} accent="var(--accent)" text="var(--color-text)" border="var(--color-border)" />
            )}
            {menus.length > 1 && menus.map((m) => {
              const tab = look.tab(m.id === menuId);
              return (
                <button key={m.id} type="button" onClick={() => { setMenuId(m.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`shrink-0 whitespace-nowrap ${tab.className}`} style={tab.style}>
                  {m.name}
                </button>
              );
            })}
          </div>
        )}

        {showToolbar && (
          <div className={`sticky top-0 z-20 mt-4 ${look.bleed}`} style={{ backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
            {searchOpen ? (
              <div className="flex items-center gap-2 py-2">
                <span style={{ color: "var(--color-muted)" }}><SearchIcon /></span>
                <input
                  ref={searchRef}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={filter.query}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.search}
                  onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent py-2 font-sans text-base outline-none"
                  style={{ color: "var(--color-text)" }}
                />
                <button
                  type="button"
                  onClick={() => { setFilter((f) => ({ ...f, query: "" })); setSearchOpen(false); }}
                  className="shrink-0 rounded-full px-3 py-2 font-sans text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                {canSearch && (
                  <button
                    type="button"
                    aria-label={t.search}
                    onClick={() => { setSearchOpen(true); requestAnimationFrame(() => searchRef.current?.focus()); }}
                    className="flex h-11 w-10 shrink-0 items-center justify-center"
                    style={{ color: "var(--accent)" }}
                  >
                    <SearchIcon />
                  </button>
                )}
                <div ref={tabsRef} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap py-1.5" style={{ scrollbarWidth: "none" }}>
                  {showTabs && result.sections.map((s) => {
                    const tab = look.tab(activeSection === s.id);
                    return (
                      <button key={s.id} type="button" data-section={s.id} onClick={() => jumpTo(s.id)} className={`shrink-0 ${tab.className}`} style={tab.style}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {canFilter && (
                  <button
                    type="button"
                    aria-label={activeFilterCount > 0 ? `${t.filter} (${activeFilterCount})` : t.filter}
                    onClick={() => setFilterOpen(true)}
                    className="relative flex h-11 shrink-0 items-center gap-1.5 pl-3 font-sans text-[11px] uppercase tracking-regal"
                    style={{ color: "var(--accent)" }}
                  >
                    <FilterIcon />
                    <span className="hidden sm:inline">{t.filter}</span>
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tracking-normal" style={{ backgroundColor: "var(--accent)", color: "var(--color-bg)" }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {(searching || activeFilterCount > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-sm" style={{ color: "var(--color-dim)" }}>
            <span>{result.matched > 0 ? count(t.results, result.matched) : t.noResults}</span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => setFilter((f) => ({ ...EMPTY_FILTER, query: f.query }))} className="underline" style={{ color: "var(--accent)" }}>
                {t.reset}
              </button>
            )}
          </div>
        )}
        {result.hiddenUnknown > 0 && (
          <p className="mt-2 font-sans text-sm" style={{ color: "var(--color-dim)" }}>
            {count(t.hiddenUnknown, result.hiddenUnknown)}{" "}
            <button type="button" onClick={() => setFilter((f) => ({ ...f, includeUnknown: true }))} className="underline" style={{ color: "var(--accent)" }}>
              {t.showUnknown}
            </button>
          </p>
        )}

        {result.sections.map((section, i) => (
          <section key={section.id} id={`section-${section.id}`} className="mt-10 md:mt-16" style={{ scrollMarginTop: 64 }}>
            <look.SectionTitle section={section} index={i} />
            <look.Items section={section} sectionIndex={i} currency={venue.currency} locale={locale} onOpen={(it) => setOpenId(it.id)} />
          </section>
        ))}

        {result.sections.length === 0 && filterActive(filter) && (
          <div className="py-20 text-center font-sans">
            <p style={{ color: "var(--color-dim)" }}>{t.noResults}</p>
            <button type="button" onClick={() => { setFilter(EMPTY_FILTER); setSearchOpen(false); }} className="mt-3 underline" style={{ color: "var(--accent)" }}>
              {t.reset}
            </button>
          </div>
        )}

        {legend.length > 0 && !searching && (
          <p className="mt-16 font-sans text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            <span className="uppercase tracking-regal">{t.allergens}: </span>
            {legend.map((c) => `${c} ${allergenName(c, locale, ALLERGEN_LABELS[c])}`).join(" · ")}
          </p>
        )}

        <footer className="mb-10 mt-12 flex flex-col items-center gap-5">
          {links.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="font-sans text-[10px] uppercase tracking-regal transition-opacity hover:opacity-60" style={{ color: "var(--color-dim)" }}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
          <span className="font-sans text-[11px] uppercase tracking-regal" style={{ color: "var(--color-muted)" }}>Powered by ORIZ</span>
        </footer>
      </main>

      <DishSheet item={openItem} currency={venue.currency} locale={locale} titleClass={look.sheetTitle} onClose={closeItem} />
      <FilterSheet open={filterOpen} options={options} filter={filter} matched={applyFilter(sections, { ...filter, query: "" }).matched} locale={locale} onChange={setFilter} onClose={() => setFilterOpen(false)} />
      <StickyActionBar venue={venue} theme={lookName} locale={locale} />
    </div>
  );
}
