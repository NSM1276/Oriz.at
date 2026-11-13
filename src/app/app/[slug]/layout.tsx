import Link from "next/link";
import { getEntitlements } from "@/lib/entitlements-server";
import { requireVenue } from "../venue";
import { AppNav } from "./AppNav";
import { LockGate } from "./LockGate";
import { PageTitle } from "./PageTitle";
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
      <header className="sticky top-0 z-20 bg-onyx text-parchment print:hidden">
        <div className="mx-auto max-w-3xl px-4 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              {venueCount > 1 ? (
                <Link href="/app" className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                  ‹ Alle Lokale
                </Link>
              ) : (
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">ORIZ</p>
              )}
              <p className="truncate font-display text-[26px] font-medium leading-tight">{venue.name}</p>
            </div>
            <a
              href={`/${venue.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-gold/70 px-4 text-base font-semibold text-gold"
            >
              Ansehen <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="pb-1 sm:pb-3">
            <AppNav slug={venue.slug} screenLocked={!entitlements.screen} printLocked={!entitlements.printDesign} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-16 sm:pt-6">
        <PageTitle slug={venue.slug} />
        <LockGate slug={venue.slug} locked={entitlements.locked}>{children}</LockGate>
        <WhatsAppHelp message={`Hallo, ich brauche Hilfe bei ORIZ (${venue.name}).`} className="mt-10 text-center print:hidden" />
      </main>
    </>
  );
}
