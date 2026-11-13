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
    <section className="rounded-2xl bg-white p-6 ring-1 ring-onyx/10">
      <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">Testphase beendet</p>
      <h1 className="mt-1 text-xl font-semibold">Ihre Karte bleibt online — zum Bearbeiten brauchen Sie das Abo</h1>
      <p className="mt-2 text-base text-onyx/70">
        Gäste sehen Ihre Speisekarte weiterhin über die QR-Codes. Änderungen, Fotos, Tische und Service-Ruf sind bereit, sobald Ihr Abo aktiv ist.
      </p>
      <Link href={`${base}/konto`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-onyx px-5 text-base font-medium text-white">
        Abo bestellen
      </Link>
    </section>
  );
}
