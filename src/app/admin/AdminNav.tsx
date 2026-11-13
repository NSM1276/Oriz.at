"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Same pattern as the owner admin: four everyday places in a bottom bar on the phone,
// the rest behind "Mehr"; wider screens get one row of pills in the header.

const icon = (d: React.ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

const TABS = [
  { href: "/admin", label: "Übersicht", icon: icon(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /></>) },
  { href: "/admin/vertrieb", label: "Vertrieb", icon: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></>) },
  { href: "/admin/auftraege", label: "Aufträge", icon: icon(<><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h3" /></>) },
  { href: "/admin/mehr", label: "Mehr", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg> },
];
// Pages reached from "Mehr" light up the "Mehr" tab.
const MORE = ["/admin/mehr", "/admin/tarife", "/admin/casa"];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : href === "/admin/mehr" ? MORE.some((p) => pathname.startsWith(p)) : pathname.startsWith(href);
  // The bar goes straight into <body>: a sticky header must not become its containing block.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const bar = (
    <nav aria-label="Bereiche" className="fixed inset-x-0 bottom-0 z-30 bg-onyx sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-auto flex max-w-3xl items-stretch">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? "page" : undefined}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${active(t.href) ? "text-gold" : "text-parchment/65"}`}
          >
            {t.icon}
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <nav className="-mx-4 hidden gap-1 overflow-x-auto px-4 pb-3 sm:flex">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active(t.href) ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-medium transition-colors ${active(t.href) ? "bg-gold text-onyx" : "text-parchment/75 hover:bg-white/10"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {mounted && createPortal(bar, document.body)}
    </>
  );
}
