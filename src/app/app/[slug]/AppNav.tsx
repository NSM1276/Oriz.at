"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const tabs = [
    { href: base, label: "Übersicht", active: pathname === base },
    { href: `${base}/tische`, label: "Tische", active: pathname.startsWith(`${base}/tische`) },
    { href: `${base}/service`, label: "Service", active: pathname.startsWith(`${base}/service`) },
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
      {/* The menu editor still lives in the old admin until /app covers it. */}
      <Link
        href={`/admin/carta/${slug}`}
        className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200"
      >
        Speisekarte ↗
      </Link>
    </nav>
  );
}
