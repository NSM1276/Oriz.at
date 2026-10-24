"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; active: boolean; pro?: boolean; icon?: React.ReactNode };

// On a phone the owner gets a bottom bar with the four everyday pages and
// "Mehr" for the rest; wider screens keep the row of pills.

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </svg>
  );
}
function TablesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h6v6h-6z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function AppNav({ slug, screenLocked = false, printLocked = false }: { slug: string; screenLocked?: boolean; printLocked?: boolean }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const is = (p: string) => pathname.startsWith(`${base}/${p}`);
  const main: Tab[] = [
    { href: base, label: "Übersicht", active: pathname === base, icon: <HomeIcon /> },
    { href: `${base}/speisekarte`, label: "Speisekarte", active: is("speisekarte"), icon: <MenuIcon /> },
    { href: `${base}/tische`, label: "Tische", active: is("tische"), icon: <TablesIcon /> },
    { href: `${base}/service`, label: "Service", active: is("service"), icon: <BellIcon /> },
  ];
  const more: Tab[] = [
    { href: `${base}/druck`, label: "Druck", active: is("druck"), pro: printLocked },
    { href: `${base}/aussehen`, label: "Aussehen", active: is("aussehen") },
    { href: `${base}/profil`, label: "Profil", active: is("profil") },
    { href: `${base}/screen`, label: "Screen", active: is("screen"), pro: screenLocked },
    { href: `${base}/leistungen`, label: "Leistungen", active: is("leistungen") },
    { href: `${base}/konto`, label: "Konto", active: is("konto") },
  ];
  const moreActive = more.some((t) => t.active);
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  // The header around this nav has backdrop-blur, which makes it the containing block of any
  // position:fixed child — the bottom bar would stick to the header, not the screen. So the
  // phone bar and its sheet go straight into <body>.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const pro = (t: Tab) => t.pro && <span className="ml-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">Pro</span>;

  const phoneNav = (
    <>
      {/* Phones: bottom bar. */}
      <nav
        aria-label="Bereiche"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur sm:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex max-w-3xl items-stretch">
          {main.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${t.active ? "text-stone-900" : "text-stone-500"}`}
            >
              {t.icon}
              {t.label}
            </Link>
          ))}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${moreActive || open ? "text-stone-900" : "text-stone-500"}`}
          >
            <MoreIcon />
            Mehr
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Mehr">
          <button type="button" aria-label="Schließen" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3 shadow-xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-stone-300" />
            <ul className="grid grid-cols-2 gap-2">
              {more.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={t.active ? "page" : undefined}
                    className={`flex min-h-14 items-center rounded-xl px-4 text-base font-medium ring-1 ${t.active ? "bg-stone-900 text-white ring-stone-900" : "bg-stone-50 text-stone-800 ring-stone-200"}`}
                  >
                    {t.label}
                    {pro(t)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Wide screens: one row of pills. */}
      <nav className="-mx-4 hidden gap-1 overflow-x-auto px-4 sm:flex" style={{ scrollbarWidth: "none" }}>
        {[...main, ...more].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${t.active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200"}`}
          >
            {t.label}
            {pro(t)}
          </Link>
        ))}
      </nav>

      {mounted && createPortal(phoneNav, document.body)}
    </>
  );
}
