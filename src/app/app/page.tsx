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
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">ORIZ</p>
      <h1 className="mt-1 text-2xl font-semibold">Ihre Lokale</h1>

      <ul className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        {venues.map((v) => (
          <li key={v.id}>
            <Link
              href={`/app/${v.slug}`}
              className="flex items-center justify-between px-4 py-4 active:bg-stone-50"
            >
              <span>
                <span className="block font-medium">{v.name}</span>
                <span className="block text-sm text-stone-500">oriz.at/{v.slug}</span>
              </span>
              <span aria-hidden className="text-stone-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
