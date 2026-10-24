import Link from "next/link";
import { getEntitlements } from "@/lib/entitlements-server";
import { requireVenue } from "../venue";
import { AppNav } from "./AppNav";
import { LockGate } from "./LockGate";
import { WhatsAppHelp } from "@/components/WhatsAppHelp";

export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { venue, venueCount } = await requireVenue(slug);
  const entitlements = await getEntitlements(venue.id);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-100/90 backdrop-blur print:hidden">
        <div className="mx-auto max-w-3xl px-4 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="min-w-0">
              {venueCount > 1 ? (
                <Link href="/app" className="text-xs font-medium uppercase tracking-widest text-stone-500">
                  ‹ Alle Lokale
                </Link>
              ) : (
                <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ</p>
              )}
              <p className="truncate text-lg font-semibold">{venue.name}</p>
            </div>
            <a
              href={`/${venue.slug}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-stone-200"
            >
              Ansehen
            </a>
          </div>
          <div className="pb-1 sm:pb-3">
            <AppNav slug={venue.slug} screenLocked={!entitlements.screen} printLocked={!entitlements.printDesign} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-16 sm:pt-6">
        <LockGate slug={venue.slug} locked={entitlements.locked}>{children}</LockGate>
        <WhatsAppHelp message={`Hallo, ich brauche Hilfe bei ORIZ (${venue.name}).`} className="mt-10 text-center print:hidden" />
      </main>
    </>
  );
}
