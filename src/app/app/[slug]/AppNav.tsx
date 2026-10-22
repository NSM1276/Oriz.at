"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const tabs = [
    { href: base, label: "Übersicht", active: pathname === base },
    { href: `${base}/speisekarte`, label: "Speisekarte", active: pathname.startsWith(`${base}/speisekarte`) },
    { href: `${base}/tische`, label: "Tische", active: pathname.startsWith(`${base}/tische`) },
    { href: `${base}/service`, label: "Service", active: pathname.startsWith(`${base}/service`) },
    { href: `${base}/aussehen`, label: "Aussehen", active: pathname.startsWith(`${base}/aussehen`) },
    { href: `${base}/profil`, label: "Profil", active: pathname.startsWith(`${base}/profil`) },
    { href: `${base}/screen`, label: "Screen", active: pathname.startsWith(`${base}/screen`) },
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
        </Link>
      ))}
    </nav>
  );
}
