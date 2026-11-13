import Link from "next/link";
import { redirect } from "next/navigation";
import { memberVenues } from "@/lib/auth";
import { requireUser } from "./venue";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const user = await requireUser("/app");
  const venues = await memberVenues(user.id);

  if (venues.length === 0) redirect("/app/neu");
  if (venues.length === 1) redirect(`/app/${venues[0].slug}`);

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
      <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">ORIZ</p>
      <h1 className="mt-1 text-2xl font-semibold">Ihre Lokale</h1>

      <ul className="mt-6 divide-y divide-onyx/10 overflow-hidden rounded-2xl bg-white ring-1 ring-onyx/10">
        {venues.map((v) => (
          <li key={v.id}>
            <Link
              href={`/app/${v.slug}`}
              className="flex items-center justify-between px-4 py-4 active:bg-onyx/5"
            >
              <span>
                <span className="block font-medium">{v.name}</span>
                <span className="block text-base text-onyx/60">oriz.at/{v.slug}</span>
              </span>
              <span aria-hidden className="text-onyx/40">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
