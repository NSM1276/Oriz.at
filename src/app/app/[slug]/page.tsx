import Link from "next/link";
import { serviceClient } from "@/lib/auth";
import { PLAN_PRICE_EUR, entitlementsFor } from "@/lib/entitlements";
import { requireVenue } from "../venue";

export const dynamic = "force-dynamic";

type Subscription = {
  plan: "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled" | "comped";
  trial_ends_at: string | null;
  current_period_end: string | null;
};

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric" });

function subscriptionText(sub: Subscription | null): { title: string; detail: string } {
  if (!sub) return { title: "Kein Abo", detail: "Für dieses Lokal ist noch kein Abo angelegt." };
  const plan = sub.plan === "pro" ? "Pro" : "Starter";
  switch (sub.status) {
    case "comped":
      return { title: `${plan} · kostenlos`, detail: "Von ORIZ freigeschaltet." };
    case "trialing": {
      const prices = `Danach Starter (${PLAN_PRICE_EUR.starter} €) oder Pro (${PLAN_PRICE_EUR.pro} €) pro Monat, netto.`;
      if (entitlementsFor(sub).trialExpired) {
        return {
          title: "Testphase beendet",
          detail: `Sie nutzen jetzt Starter (${PLAN_PRICE_EUR.starter} € pro Monat). Mit Pro (${PLAN_PRICE_EUR.pro} €) kommen Screen und mehr dazu. Schreiben Sie uns: office@oriz.at.`,
        };
      }
      return {
        title: "Testphase · alle Funktionen",
        detail: sub.trial_ends_at ? `Kostenlos bis ${dateFmt.format(new Date(sub.trial_ends_at))}. ${prices}` : `Kostenlos testen. ${prices}`,
      };
    }
    case "active":
      return {
        title: `${plan} · aktiv`,
        detail: sub.current_period_end ? `Nächste Abrechnung am ${dateFmt.format(new Date(sub.current_period_end))}.` : "",
      };
    case "past_due":
      return { title: `${plan} · Zahlung offen`, detail: "Die letzte Zahlung ist nicht durchgegangen." };
    case "canceled":
      return { title: "Abo beendet", detail: "Die Speisekarte ist für Gäste nicht mehr sichtbar." };
  }
}

export default async function VenueOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const svc = serviceClient();

  const [{ data: sub }, { count: itemCount }, { count: sectionCount }, { count: tableCount }, { count: soldOutCount }] = await Promise.all([
    svc.from("subscriptions").select("plan, status, trial_ends_at, current_period_end").eq("venue_id", venue.id).maybeSingle<Subscription>(),
    svc.from("items").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    svc.from("sections").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    svc.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    svc.from("items").select("id", { count: "exact", head: true }).eq("venue_id", venue.id).eq("is_active", false),
  ]);

  const subText = subscriptionText(sub ?? null);
  const stats = [
    { label: "Bereiche", value: sectionCount ?? 0, href: `/app/${venue.slug}/speisekarte` },
    { label: "Gerichte", value: itemCount ?? 0, href: `/app/${venue.slug}/speisekarte` },
    { label: "Tische", value: tableCount ?? 0, href: `/app/${venue.slug}/tische` },
  ];
  // The things an owner reaches for during a shift, one tap from the start page.
  const quick = [
    { label: "Gericht ausverkauft melden", hint: soldOutCount ? `${soldOutCount} gerade aus` : "Schalter neben jedem Gericht", href: `/app/${venue.slug}/speisekarte` },
    { label: "QR-Codes drucken", hint: "Ein Aufkleber je Tisch", href: `/app/${venue.slug}/tische` },
    { label: "Service-Ruf", hint: "Gerät des Personals verbinden", href: `/app/${venue.slug}/service` },
    { label: "Karte als Gast ansehen", hint: `oriz.at/${venue.slug}`, href: `/${venue.slug}`, external: true },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Abo</p>
        <p className="mt-1 text-lg font-semibold">{subText.title}</p>
        {subText.detail && <p className="mt-0.5 text-sm text-stone-600">{subText.detail}</p>}
      </section>

      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-stone-200">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </Link>
        ))}
      </section>

      {(itemCount ?? 0) > 0 && (
        <section className="grid gap-2 sm:grid-cols-2">
          {quick.map((q) =>
            q.external ? (
              <a key={q.label} href={q.href} target="_blank" rel="noreferrer" className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
                <span><span className="block font-medium">{q.label}</span><span className="block text-sm text-stone-500">{q.hint}</span></span>
                <span aria-hidden className="text-stone-400">↗</span>
              </a>
            ) : (
              <Link key={q.label} href={q.href} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
                <span><span className="block font-medium">{q.label}</span><span className="block text-sm text-stone-500">{q.hint}</span></span>
                <span aria-hidden className="text-stone-400">›</span>
              </Link>
            ),
          )}
        </section>
      )}

      {(itemCount ?? 0) === 0 && (
        <Link
          href={`/app/${venue.slug}/start`}
          className="block rounded-2xl bg-stone-900 p-5 text-white shadow-sm"
        >
          <p className="font-semibold">Einrichtung fortsetzen</p>
          <p className="mt-0.5 text-sm text-stone-300">
            Speisekarte einfügen, Aussehen wählen, Tische anlegen — in wenigen Minuten.
          </p>
        </Link>
      )}

      {(itemCount ?? 0) > 0 && (tableCount ?? 0) === 0 && (
        <Link
          href={`/app/${venue.slug}/tische`}
          className="block rounded-2xl bg-stone-900 p-5 text-white shadow-sm"
        >
          <p className="font-semibold">Tische anlegen</p>
          <p className="mt-0.5 text-sm text-stone-300">
            Jeder Tisch bekommt einen eigenen QR-Code. So wissen Sie später, von welchem Tisch ein Gast ruft.
          </p>
        </Link>
      )}
    </div>
  );
}
