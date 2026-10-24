"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// After the trial, without a plan: every page except Konto and Leistungen shows this instead of
// its content. The guest menu stays online; the hook for coming back is the account page.
export function LockGate({ slug, locked, children }: { slug: string; locked: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const open = pathname.startsWith(`${base}/konto`) || pathname.startsWith(`${base}/leistungen`);
  if (!locked || open) return <>{children}</>;
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Testphase beendet</p>
      <h1 className="mt-1 text-xl font-semibold">Ihre Karte bleibt online — zum Bearbeiten wählen Sie einen Tarif</h1>
      <p className="mt-2 text-sm text-stone-600">
        Gäste sehen Ihre Speisekarte weiterhin über die QR-Codes. Änderungen, Fotos, Tische und Service-Ruf sind bereit, sobald Ihr Tarif aktiv ist.
      </p>
      <Link href={`${base}/konto`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-medium text-white">
        Tarif wählen
      </Link>
    </section>
  );
}
