"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Venue } from "@/lib/supabase/types";

function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) > 4) {
          setVisible(delta < 0 || y < 60);
          lastY.current = y;
        }
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}

type Theme = "classic" | "modern" | "visual";

// ── Icons (inline, 20px) ────────────────────────────────────────
function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function MapIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function PhoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.18z" />
    </svg>
  );
}

function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

// ── Single action (button / anchor / link) ──────────────────────
const actionClassName =
  "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors duration-200 sticky-action";

function ActionLabel({ children, theme }: { children: string; theme: Theme }) {
  return (
    <span
      className="font-sans tracking-regal uppercase"
      style={{
        fontSize: theme === "modern" ? "8px" : "9px",
        letterSpacing: theme === "modern" ? "0.18em" : undefined,
      }}
    >
      {children}
    </span>
  );
}

export function StickyActionBar({ venue, theme }: { venue: Venue; theme: Theme }) {
  const iconSize = theme === "modern" ? 18 : 20;
  const visible = useScrollDirection();

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${venue.name} — Speisekarte`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
    }
  }, [venue.name]);

  const mapHref = venue.google_maps_url
    ? venue.google_maps_url
    : venue.address
    ? `https://maps.google.com/?q=${encodeURIComponent(venue.address)}`
    : null;

  const showLocation = !!mapHref;
  const showCall = !!venue.phone;

  // ── Per-theme shell ──
  const maxWidth = theme === "classic" ? "max-w-3xl" : "max-w-2xl";

  const innerStyle: React.CSSProperties =
    theme === "visual"
      ? {
          margin: "0 12px 12px",
          borderRadius: "1rem",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 80%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--color-border)",
        }
      : {
          backgroundColor: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
        };

  const innerClass =
    theme === "visual"
      ? `${maxWidth} mx-auto flex items-stretch`
      : `${maxWidth} mx-auto flex items-stretch`;

  const padY = theme === "modern" ? "py-3" : "py-2.5";

  return (
    <AnimatePresence>
    {visible && <motion.div
      key="sticky-bar"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <style>{`
        .sticky-action { color: var(--color-dim); }
        .sticky-action:hover { color: var(--color-text); }
        @media (hover: hover) {
          .sticky-action:hover .sticky-action-icon { color: var(--accent); }
        }
        .sticky-action:active { color: var(--accent); }
      `}</style>
      <div style={innerStyle} className={innerClass}>
        <div className={`flex items-stretch w-full px-2 ${padY}`}>
          {/* Share — always */}
          <button
            type="button"
            onClick={handleShare}
            className={actionClassName}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Teilen"
          >
            <span className="sticky-action-icon"><ShareIcon size={iconSize} /></span>
            <ActionLabel theme={theme}>Teilen</ActionLabel>
          </button>

          {/* Location */}
          {showLocation && (
            <a
              href={mapHref!}
              target="_blank"
              rel="noreferrer"
              className={actionClassName}
              aria-label="Karte"
            >
              <span className="sticky-action-icon"><MapIcon size={iconSize} /></span>
              <ActionLabel theme={theme}>Karte</ActionLabel>
            </a>
          )}

          {/* Call */}
          {showCall && (
            <a
              href={`tel:${venue.phone}`}
              className={actionClassName}
              aria-label="Anrufen"
            >
              <span className="sticky-action-icon"><PhoneIcon size={iconSize} /></span>
              <ActionLabel theme={theme}>Anrufen</ActionLabel>
            </a>
          )}

          {/* Profile — always */}
          <Link
            href={`/${venue.slug}/profile`}
            className={actionClassName}
            aria-label="Info"
          >
            <span className="sticky-action-icon"><InfoIcon size={iconSize} /></span>
            <ActionLabel theme={theme}>Info</ActionLabel>
          </Link>
        </div>
      </div>
    </motion.div>}
    </AnimatePresence>
  );
}
