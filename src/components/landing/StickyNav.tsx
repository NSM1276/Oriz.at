"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 animate-nav-fade">
      <nav
        style={{
          background: scrolled
            ? "rgba(28,18,8,0.97)"
            : "rgba(28,18,8,0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(200,150,62,0.12)",
          transition: "background 0.4s ease",
        }}
        className="rounded-full flex items-center justify-between gap-6 px-6 py-3 w-full max-w-2xl"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-display font-light text-parchment tracking-[0.25em] text-sm shrink-0"
          style={{ letterSpacing: "0.3em" }}
        >
          ORIZ
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-6">
          {[
            { label: "Carta", href: "/carta" },
            { label: "Casa", href: "/casa" },
            { label: "Screen", href: "#screen" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="font-sans text-[10px] tracking-regal uppercase text-parchment/45 hover:text-parchment/80 transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Admin */}
        <Link
          href="/admin"
          className="font-sans text-[10px] tracking-regal uppercase shrink-0 transition-colors duration-200"
          style={{ color: "rgba(200,150,62,0.75)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#C8963E")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(200,150,62,0.75)")
          }
        >
          Admin →
        </Link>
      </nav>
    </div>
  );
}
