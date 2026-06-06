"use client";

import { useState, useRef } from "react";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type OpeningHours = Partial<Record<Weekday, [string, string][]>>;

const ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const LABELS: Record<Weekday, string> = {
  mon: "Mo",
  tue: "Di",
  wed: "Mi",
  thu: "Do",
  fri: "Fr",
  sat: "Sa",
  sun: "So",
};

// JS getDay(): 0=Sun..6=Sat → our Weekday keys
const JS_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatRanges(ranges: [string, string][] | undefined): string | null {
  if (!ranges || ranges.length === 0) return null; // closed
  return ranges.map(([open, close]) => `${open}–${close}`).join(", ");
}

export function OpeningHoursSection({ hours }: { hours: OpeningHours }) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const todayKey = JS_TO_WEEKDAY[new Date().getDay()];
  const todayRanges = formatRanges(hours[todayKey]);
  const todayLabel = todayRanges
    ? `Heute: ${todayRanges}`
    : "Heute geschlossen";

  return (
    <section className="text-center">
      <h2
        className="font-sans text-[11px] tracking-regal uppercase mb-3"
        style={{ color: "var(--color-muted)" }}
      >
        Öffnungszeiten
      </h2>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="font-display text-xl md:text-2xl transition-opacity hover:opacity-80 inline-flex items-center gap-2"
        style={{
          color: "var(--color-text)",
          background: "none",
          border: "none",
          cursor: "pointer",
          minHeight: "44px",
          padding: "0 4px",
        }}
        aria-expanded={expanded}
      >
        <span>{todayLabel}</span>
        <span
          className="font-sans text-xs align-middle transition-transform duration-300"
          style={{
            color: "var(--accent)",
            display: "inline-block",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>

      {/* Animated expand/collapse via max-height transition */}
      <div
        ref={listRef}
        style={{
          overflow: "hidden",
          maxHeight: expanded ? "600px" : "0px",
          transition: "max-height 0.35s ease",
        }}
        aria-hidden={!expanded}
      >
        <ul className="mt-5 mx-auto max-w-xs space-y-2 pb-2">
          {ORDER.map((day) => {
            const ranges = formatRanges(hours[day]);
            const isToday = day === todayKey;
            return (
              <li
                key={day}
                className="flex items-center justify-between font-sans text-sm py-1"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  color: isToday ? "var(--color-text)" : "var(--color-dim)",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                <span
                  className="tracking-regal uppercase text-[11px]"
                  style={isToday ? { color: "var(--accent)" } : undefined}
                >
                  {LABELS[day]}
                </span>
                <span>{ranges ?? "Geschlossen"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
