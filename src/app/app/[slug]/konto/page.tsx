import { PLAN_PRICE_EUR, upgradeMailto } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { requireUser, requireVenue } from "../../venue";
import { AccountForms } from "./AccountForms";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric" });

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue, venueCount } = await requireVenue(slug);
  const user = await requireUser(`/app/${slug}/konto`);
  const ent = await getEntitlements(venue.id);

  const current = ent.tier === "pro" || ent.tier === "trial" ? "pro" : "starter";
  const plans = [
    { id: "starter", name: "Starter", body: "Alles für ein Lokal: Karte mit unbegrenzten Gerichten, Aussehen, Allergene, QR-Codes für die Tische, Service-Ruf und Druck-PDF." },
    { id: "pro", name: "Pro", body: "Alles aus Starter, dazu bis zu fünf Karten (z. B. Mittag, Abend, Getränke), Druck-Design (Ihre Farben, Ihr Logo, Blatt für Blatt nachdrucken) und Screen (Ihre Karte auf dem Fernseher)." },
  ] as const;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Ihr Tarif</p>
        <p className="mt-1 text-lg font-semibold">
          {ent.tier === "trial" ? "Testphase · alle Funktionen" : ent.label}
        </p>
        {ent.tier === "trial" && ent.trialEndsAt && (
          <p className="mt-0.5 text-sm text-stone-600">Kostenlos bis {dateFmt.format(ent.trialEndsAt)}.</p>
        )}
        {ent.trialExpired && <p className="mt-0.5 text-sm text-stone-600">Die Testphase ist beendet. Sie nutzen jetzt Starter.</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-xl p-4 ring-1 ${p.id === current && ent.tier !== "trial" ? "bg-stone-50 ring-stone-900" : "ring-stone-200"}`}>
              <p className="font-semibold">
                {p.name} <span className="font-normal text-stone-600">· {PLAN_PRICE_EUR[p.id]} € pro Monat</span>
              </p>
              <p className="mt-1 text-sm text-stone-600">{p.body}</p>
              {p.id === current && ent.tier !== "trial" && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-700">Ihr Tarif</p>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Preise netto, monatlich kündbar.</p>
        <a
          href={upgradeMailto(venue.name)}
          className="mt-3 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium ring-1 ring-stone-300"
        >
          Tarif ändern: Nachricht an ORIZ
        </a>
      </section>

      <AccountForms email={user.email ?? ""} showVenues={venueCount > 1} />
    </div>
  );
}
