import Link from "next/link";
import { serviceClient } from "@/lib/auth";
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
    case "trialing":
      return {
        title: `${plan} · Testphase`,
        detail: sub.trial_ends_at ? `Kostenlos bis ${dateFmt.format(new Date(sub.trial_ends_at))}.` : "Kostenlos testen.",
      };
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

  const [{ data: sub }, { count: itemCount }, { count: sectionCount }, { count: tableCount }] = await Promise.all([
    svc.from("subscriptions").select("plan, status, trial_ends_at, current_period_end").eq("venue_id", venue.id).maybeSingle<Subscription>(),
    svc.from("items").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    svc.from("sections").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    svc.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
  ]);

  const subText = subscriptionText(sub ?? null);
  const stats = [
    { label: "Bereiche", value: sectionCount ?? 0 },
    { label: "Gerichte", value: itemCount ?? 0 },
    { label: "Tische", value: tableCount ?? 0 },
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
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-stone-200">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </section>

      {(tableCount ?? 0) === 0 && (
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
