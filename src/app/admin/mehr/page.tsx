import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser, isPlatformAdmin } from "@/lib/auth";
import { AdminFrame, AdminTitle } from "../AdminFrame";
import { MoreActions } from "./MoreActions";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin/tarife", title: "Abos", hint: "Nach der Zahlung freischalten, Testphase verlängern" },
  { href: "/admin/casa", title: "Casa", hint: "Ferienwohnungen (pausiert)" },
];

// Everything the platform admin needs less often than daily.
export default async function MorePage() {
  const user = await getUser();
  if (!user) redirect("/admin/login?next=/admin/mehr");
  if (!(await isPlatformAdmin(user.id))) notFound();

  return (
    <AdminFrame>
      <AdminTitle title="Mehr" />
      <section className="divide-y divide-onyx/10 overflow-hidden rounded-2xl bg-white ring-1 ring-onyx/10">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 active:bg-onyx/5">
            <span className="text-[17px] font-medium">
              {l.title}
              <span className="block text-sm font-normal text-onyx/60">{l.hint}</span>
            </span>
            <span aria-hidden className="text-xl text-onyx/40">›</span>
          </Link>
        ))}
        <MoreActions />
      </section>
      <p className="mt-4 text-sm text-onyx/55">Angemeldet als {user.email}</p>
    </AdminFrame>
  );
}
