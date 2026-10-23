import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";
import { SERVICE_INFO, STATUS_LABEL, euroNet, type OrderStatus, type ServiceKind } from "@/lib/services";
import { OrderControls } from "./OrderControls";

export const dynamic = "force-dynamic";

type StoredFile = { path: string; name: string; size: number; type: string };
type Order = {
  id: string; kind: ServiceKind; status: OrderStatus; quantity: number; price_cents: number;
  link_url: string | null; languages: string[]; notes: string | null;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  files: StoredFile[]; admin_note: string | null;
  submitted_at: string | null; paid_at: string | null; done_at: string | null;
  venues: { name: string; slug: string };
};

const GROUPS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "Zu tun", statuses: ["bezahlt", "in_arbeit"] },
  { title: "Wartet auf Zahlung", statuses: ["neu"] },
  { title: "Erledigt", statuses: ["fertig"] },
  { title: "Storniert", statuses: ["storniert"] },
];
const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Orders for the hand-made services. Platform admins only; files come through
// signed links that expire after an hour.
export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/admin/login?next=/admin/auftraege");
  if (!(await isPlatformAdmin(user.id))) notFound();

  const db = serviceClient();
  const { data } = await db
    .from("service_orders")
    .select("id, kind, status, quantity, price_cents, link_url, languages, notes, contact_name, contact_email, contact_phone, files, admin_note, submitted_at, paid_at, done_at, venues(name, slug)")
    .neq("status", "entwurf")
    .order("submitted_at", { ascending: false })
    .limit(200)
    .returns<Order[]>();
  const orders = data ?? [];

  const paths = orders.filter((o) => o.status !== "storniert").flatMap((o) => o.files.map((f) => f.path));
  const links = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await db.storage.from("service-uploads").createSignedUrls(paths, 3600, { download: true });
    for (const s of signed ?? []) if (s.path && s.signedUrl) links.set(s.path, s.signedUrl);
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <Link href="/admin" className="text-sm font-medium text-stone-600">‹ Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold">Aufträge</h1>
        <p className="mt-1 text-sm text-stone-600">Einrichtung und Fotobearbeitung — von Hand. Kunden bekommen bei „Bezahlt“, „In Arbeit“ und „Fertig“ eine E-Mail.</p>
        {!emailConfigured() && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            E-Mail ist noch nicht eingerichtet (RESEND_API_KEY, EMAIL_FROM) — Kunden bitte selbst anrufen oder anschreiben.
          </p>
        )}

        {orders.length === 0 && <p className="mt-8 rounded-2xl bg-white p-6 text-stone-600 ring-1 ring-stone-200">Noch keine Aufträge.</p>}

        {GROUPS.map((g) => {
          const list = orders.filter((o) => g.statuses.includes(o.status));
          if (list.length === 0) return null;
          return (
            <section key={g.title} className="mt-6">
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">{g.title} · {list.length}</p>
              <div className="mt-2 space-y-3">
                {list.map((o) => (
                  <article key={o.id} id={o.id} className="scroll-mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{o.venues.name}</p>
                        <p className="text-sm text-stone-600">
                          {SERVICE_INFO[o.kind].title} · {o.kind === "photo_edit" ? `${o.quantity} Fotos · ` : ""}{euroNet(o.price_cents)}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium">{STATUS_LABEL[o.status]}</span>
                    </div>

                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-stone-500">Kontakt</dt>
                      <dd className="min-w-0">
                        {o.contact_name && <span className="block">{o.contact_name}</span>}
                        {o.contact_phone && <a className="block underline" href={`tel:${o.contact_phone.replace(/\s+/g, "")}`}>{o.contact_phone}</a>}
                        {o.contact_email && <a className="block truncate underline" href={`mailto:${o.contact_email}`}>{o.contact_email}</a>}
                      </dd>
                      <dt className="text-stone-500">Eingang</dt>
                      <dd>{o.submitted_at ? dateFmt.format(new Date(o.submitted_at)) : "—"}{o.paid_at && ` · bezahlt ${dateFmt.format(new Date(o.paid_at))}`}{o.done_at && ` · fertig ${dateFmt.format(new Date(o.done_at))}`}</dd>
                      {o.languages.length > 0 && (<><dt className="text-stone-500">Sprachen</dt><dd>{o.languages.join(", ").toUpperCase()}</dd></>)}
                      {o.link_url && (<><dt className="text-stone-500">Link</dt><dd className="min-w-0 truncate"><a className="underline" href={o.link_url} target="_blank" rel="noreferrer noopener">{o.link_url}</a></dd></>)}
                      {o.notes && (<><dt className="text-stone-500">Wünsche</dt><dd className="whitespace-pre-line">{o.notes}</dd></>)}
                    </dl>

                    {o.files.length > 0 && o.status !== "storniert" && (
                      <ul className="mt-3 divide-y divide-stone-100 rounded-xl bg-stone-50 px-3 text-sm">
                        {o.files.map((f) => (
                          <li key={f.path} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0 truncate">{f.name}</span>
                            <span className="flex shrink-0 items-center gap-3 text-stone-500">
                              {size(f.size)}
                              {links.get(f.path) ? <a className="font-medium text-stone-900 underline" href={links.get(f.path)}>Laden</a> : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link className="font-medium underline" href={`/app/${o.venues.slug}/speisekarte`}>Speisekarte bearbeiten</Link>
                      <a className="font-medium underline" href={`/${o.venues.slug}`} target="_blank" rel="noreferrer">Gästeansicht</a>
                    </div>

                    <OrderControls orderId={o.id} status={o.status} note={o.admin_note ?? ""} hasEmail={!!o.contact_email} />
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
