"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ slug, screenLocked = false, printLocked = false }: { slug: string; screenLocked?: boolean; printLocked?: boolean }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const tabs: { href: string; label: string; active: boolean; pro?: boolean }[] = [
    { href: base, label: "Übersicht", active: pathname === base },
    { href: `${base}/speisekarte`, label: "Speisekarte", active: pathname.startsWith(`${base}/speisekarte`) },
    { href: `${base}/druck`, label: "Druck", active: pathname.startsWith(`${base}/druck`), pro: printLocked },
    { href: `${base}/tische`, label: "Tische", active: pathname.startsWith(`${base}/tische`) },
    { href: `${base}/service`, label: "Service", active: pathname.startsWith(`${base}/service`) },
    { href: `${base}/aussehen`, label: "Aussehen", active: pathname.startsWith(`${base}/aussehen`) },
    { href: `${base}/profil`, label: "Profil", active: pathname.startsWith(`${base}/profil`) },
    { href: `${base}/screen`, label: "Screen", active: pathname.startsWith(`${base}/screen`), pro: screenLocked },
    { href: `${base}/leistungen`, label: "Leistungen", active: pathname.startsWith(`${base}/leistungen`) },
    { href: `${base}/konto`, label: "Konto", active: pathname.startsWith(`${base}/konto`) },
  ];

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            t.active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200"
          }`}
        >
          {t.label}
          {t.pro && <span className="ml-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">Pro</span>}
        </Link>
      ))}
    </nav>
  );
}
