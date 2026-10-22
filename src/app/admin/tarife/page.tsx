import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { entitlementsFor, type PlanId, type SubStatus } from "@/lib/entitlements";
import { TarifRow } from "./TarifRow";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscriptions: { plan: PlanId; status: SubStatus; trial_ends_at: string | null } | { plan: PlanId; status: SubStatus; trial_ends_at: string | null }[] | null;
};

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", year: "numeric" });

// Plans by hand, until Stripe: platform admins only.
export default async function TarifePage() {
  const user = await getUser();
  if (!user) redirect("/admin/login?next=/admin/tarife");
  if (!(await isPlatformAdmin(user.id))) notFound();

  const { data } = await serviceClient()
    .from("venues")
    .select("id, name, slug, created_at, subscriptions(plan, status, trial_ends_at)")
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  const venues = (data ?? []).map((v) => ({ ...v, sub: Array.isArray(v.subscriptions) ? v.subscriptions[0] ?? null : v.subscriptions }));

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <Link href="/admin" className="text-sm font-medium text-stone-600">‹ Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold">Tarife</h1>
        <p className="mt-1 text-sm text-stone-600">
          Hier schalten Sie Pro nach der Zahlung frei, bis Stripe das übernimmt. Eine Testphase hat die Pro-Funktionen, bis das Datum erreicht ist.
        </p>

        <ul className="mt-6 space-y-3">
          {venues.map((v) => {
            const ent = entitlementsFor(v.sub);
            return (
              <li key={v.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-sm text-stone-500">
                    {v.slug} · seit {dateFmt.format(new Date(v.created_at))}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-stone-600">
                  Gilt jetzt: {ent.tier === "trial" ? "Testphase (Pro-Funktionen)" : ent.label}
                  {ent.trialExpired && " · Testphase abgelaufen"}
                </p>
                <TarifRow venueId={v.id} plan={v.sub?.plan ?? "starter"} status={v.sub?.status ?? "trialing"} trialEnd={v.sub?.trial_ends_at ?? null} />
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
