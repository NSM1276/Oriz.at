import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  property_name: string | null;
  property_type: string | null;
  units: string | null;
  languages: string | null;
  contact_name: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  message: string | null;
  source: string | null;
  created_at: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/leads");

  const { data: leads, error } = await supabase
    .schema("casa")
    .from("leads")
    .select(
      "id, property_name, property_type, units, languages, contact_name, email, phone, website, message, source, created_at",
    )
    .order("created_at", { ascending: false });

  const list: Lead[] = (leads as Lead[] | null) ?? [];

  return (
    <main className="min-h-screen bg-parchment text-onyx">
      {/* Header */}
      <header className="border-b border-onyx/8 px-6 py-5 flex items-center justify-between">
        <div>
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
            ORIZ · Casa
          </span>
          <h1 className="font-display text-2xl font-light mt-1">Lead-Inbox</h1>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/admin"
            className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-gold transition-colors"
          >
            ← Admin
          </Link>
          <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/30">
            {list.length} {list.length === 1 ? "Eintrag" : "Einträge"}
          </span>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p className="font-sans text-sm text-red-700">
            Fehler beim Laden: {error.message}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!error && list.length === 0 && (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-px bg-gold/40 mx-auto mb-6" />
          <p className="font-display text-2xl italic text-onyx/50">
            Noch keine Anfragen.
          </p>
          <p className="font-sans text-xs text-onyx/35 mt-4 tracking-wide">
            Sobald jemand das Casa-Formular abschickt, erscheint die Anfrage
            hier.
          </p>
        </div>
      )}

      {/* List */}
      {!error && list.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-5">
          {list.map((l) => (
            <article
              key={l.id}
              className="bg-white/60 border border-onyx/8 p-6"
            >
              <header className="flex items-baseline justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-xl font-light text-onyx">
                    {l.property_name || "—"}
                  </h2>
                  {l.property_type && (
                    <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
                      {l.property_type}
                    </span>
                  )}
                </div>
                <time className="font-sans text-[10px] tracking-wide text-onyx/40 shrink-0">
                  {fmtDate(l.created_at)}
                </time>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <Field label="Ansprechpartner" value={l.contact_name} />
                <Field
                  label="E-Mail"
                  value={l.email}
                  href={`mailto:${l.email}`}
                />
                <Field
                  label="Telefon"
                  value={l.phone}
                  href={l.phone ? `tel:${l.phone}` : undefined}
                />
                <Field
                  label="Website"
                  value={l.website}
                  href={l.website || undefined}
                  external
                />
                <Field label="Einheiten" value={l.units} />
                <Field label="Sprachen" value={l.languages} />
              </div>

              {l.message && (
                <div className="mt-5 pt-5 border-t border-onyx/8">
                  <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 block mb-2">
                    Nachricht
                  </span>
                  <p className="font-display italic text-onyx/70 leading-relaxed whitespace-pre-wrap">
                    {l.message}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string | null;
  href?: string;
  external?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 block">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="font-sans text-sm text-onyx hover:text-gold transition-colors break-all"
        >
          {value}
        </a>
      ) : (
        <span className="font-sans text-sm text-onyx break-all">{value}</span>
      )}
    </div>
  );
}
