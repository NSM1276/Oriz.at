"use client";

import { useEffect, useState } from "react";
import { openText } from "@/lib/menu-i18n-open";
import { openStatus, type OpeningHours, type OpenStatus } from "@/lib/opening-status";
import { DishMedia } from "./parts";

// The first screen a guest sees: the place itself (cover photo), then whether it is open.
// Same for every look; the look draws the name and text in between.

/** Full-width cover photo that fades into the menu's background. */
export function CoverImage({ src, alt, bleed }: { src: string; alt: string; bleed: string }) {
  return (
    <div className={`relative -mt-6 mb-6 overflow-hidden md:-mt-14 md:rounded-b-3xl ${bleed}`} style={{ height: "min(46vw, 260px)", minHeight: 170 }}>
      <DishMedia src={src} alt={alt} sizes="100vw" eager className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 45%, var(--color-bg) 100%)" }} />
    </div>
  );
}

/** "Jetzt geöffnet · bis 22:00" — computed after mounting, so server and phone clocks never disagree. */
export function OpenLine({ hours, locale, center }: { hours: OpeningHours | null | undefined; locale: string; center?: boolean }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(openStatus(hours, new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  if (!status) return null;
  return (
    <p className={`mt-3 flex items-center gap-2 font-sans text-sm ${center ? "justify-center" : ""}`} style={{ color: "var(--color-dim)" }}>
      <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: status.open ? "#22c55e" : "var(--color-muted)" }} />
      {openText(status, locale)}
    </p>
  );
}
