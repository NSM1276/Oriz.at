import { notFound, redirect } from "next/navigation";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { entitlementsFor, standingOf, type PlanId, type SubStatus } from "@/lib/entitlements";
import { PublishToggle } from "./PublishToggle";
import { TarifRow } from "./TarifRow";
import { AdminFrame, AdminTitle } from "../AdminFrame";

export const dynamic = "force-dynamic";

type Sub = { plan: PlanId; status: SubStatus; trial_ends_at: string | null; languages_all?: boolean | null };

type Row = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  published: boolean;
  subscriptions: Sub | Sub[] | null;
};

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", year: "numeric" });

// Plans by hand, until Stripe: platform admins only.
export default async function TarifePage() {
  const user = await getUser();
  if (!user) redirect("/admin/login?next=/admin/tarife");
  if (!(await isPlatformAdmin(user.id))) notFound();

  const { data } = await serviceClient()
    .from("venues")
    .select("id, name, slug, created_at, published, subscriptions(*)")
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  const venues = (data ?? []).map((v) => ({ ...v, sub: Array.isArray(v.subscriptions) ? v.subscriptions[0] ?? null : v.subscriptions }));

  return (
    <AdminFrame>
        <AdminTitle title="Abos" line="Nach der Zahlung auf „Bezahlt“ stellen. Die Testphase lässt sich hier verlängern." />

        <ul className="mt-6 space-y-3">
          {venues.map((v) => {
            const ent = entitlementsFor(v.sub);
            return (
              <li key={v.id} className="rounded-2xl bg-white p-4 ring-1 ring-onyx/10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-sm text-onyx/60">
                    {v.slug} · seit {dateFmt.format(new Date(v.created_at))}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-onyx/70">
                  Gilt jetzt: {standingOf(v.sub).label}
                  {ent.trialExpired && " · Testphase abgelaufen, Admin gesperrt"}
                  {ent.allLanguages && ent.tier !== "trial" && " · 20+ Sprachen"}
                </p>
                <PublishToggle venueId={v.id} published={v.published} />
                <TarifRow venueId={v.id} plan={v.sub?.plan ?? "starter"} status={v.sub?.status ?? "trialing"} trialEnd={v.sub?.trial_ends_at ?? null} languagesAll={!!v.sub?.languages_all} />
              </li>
            );
          })}
        </ul>
    </AdminFrame>
  );
}
