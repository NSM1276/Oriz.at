import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { LEAD_STATUS_LABEL, isLeadStatus, waLink, type LeadStatus } from "@/lib/contact-info";
import { AddLeadForm, LeadEdit } from "./LeadControls";

export const dynamic = "force-dynamic";

type Lead = {
  id: string; property_name: string | null; property_type: string | null; contact_name: string | null;
  email: string | null; phone: string | null; website: string | null; message: string | null; note: string | null;
  source: string | null; status: string; follow_up_on: string | null; created_at: string | null;
};

const SOURCE_LABEL: Record<string, string> = { persoenlich: "Persönlich", carta_landing: "Formular Carta", casa_landing: "Formular Casa", screen_landing: "Formular Screen" };
const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short" });
const todayVienna = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(new Date());
const closed = (s: string) => s === "kunde" || s === "kein_interesse";
const rank = (l: Lead) => (closed(l.status) ? 2 : l.follow_up_on ? 0 : 1);

// Sales notebook: people met in person and form requests in one list. Platform admins only.
export default async function SalesPage() {
  const user = await getUser();
  if (!user) redirect("/admin/login?next=/admin/vertrieb");
  if (!(await isPlatformAdmin(user.id))) notFound();

  const { data } = await serviceClient()
    .schema("casa")
    .from("leads")
    .select("id, property_name, property_type, contact_name, email, phone, website, message, note, source, status, follow_up_on, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Lead[]>();
  const today = todayVienna();
  const leads = (data ?? []).slice().sort((a, b) => rank(a) - rank(b) || (a.follow_up_on ?? "9").localeCompare(b.follow_up_on ?? "9"));
  const due = leads.filter((l) => l.follow_up_on && l.follow_up_on <= today && !closed(l.status)).length;

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [color-scheme:light]">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <Link href="/admin" className="text-sm font-medium text-stone-600">‹ Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold">Vertrieb</h1>
        <p className="mt-1 text-sm text-stone-600">
          Kontakte vom Markt und Anfragen vom Formular. {leads.length} {leads.length === 1 ? "Eintrag" : "Einträge"}{due > 0 && <> · <span className="font-medium text-red-700">{due} heute oder überfällig</span></>}
        </p>

        <AddLeadForm />

        {leads.length === 0 && <p className="mt-6 rounded-2xl bg-white p-6 text-stone-600 ring-1 ring-stone-200">Noch keine Kontakte.</p>}

        <div className="mt-5 space-y-3">
          {leads.map((l) => {
            const status: LeadStatus = isLeadStatus(l.status) ? l.status : "neu";
            const wa = waLink(l.phone);
            const overdue = !!l.follow_up_on && l.follow_up_on <= today && !closed(status);
            return (
              <article key={l.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${overdue ? "ring-red-300" : "ring-stone-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.property_name || l.contact_name || "—"}</p>
                    <p className="text-sm text-stone-500">
                      {[l.property_type, SOURCE_LABEL[l.source ?? ""] ?? l.source, l.created_at ? dateFmt.format(new Date(l.created_at)) : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium">{LEAD_STATUS_LABEL[status]}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {l.contact_name && l.property_name && <span>{l.contact_name}</span>}
                  {l.phone && <a className="font-medium underline" href={`tel:${l.phone.replace(/\s+/g, "")}`}>{l.phone}</a>}
                  {wa && <a className="font-medium underline" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
                  {l.email && <a className="truncate underline" href={`mailto:${l.email}`}>{l.email}</a>}
                  {l.website && <a className="truncate underline" href={l.website} target="_blank" rel="noreferrer noopener">Website</a>}
                </div>
                {l.message && <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{l.message}</p>}
                {overdue && <p className="mt-2 text-sm font-medium text-red-700">Wieder melden: {l.follow_up_on}</p>}

                <LeadEdit id={l.id} status={status} followUpOn={l.follow_up_on} note={l.note ?? ""} />
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
