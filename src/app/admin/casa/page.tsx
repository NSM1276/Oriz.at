import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

type Property = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  color_bg: string | null;
  color_primary: string | null;
  owner_id: string | null;
};

export default async function AdminCasaListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/casa");

  // Only super admin sees the full list. Regular Casa owners go to their property.
  if (user.email !== SUPER_ADMIN_EMAIL) {
    const { data: mine } = await supabase
      .schema("casa")
      .from("properties")
      .select("slug")
      .eq("owner_id", user.id)
      .limit(1);
    if (mine && mine.length > 0) redirect(`/admin/casa/${mine[0].slug}`);
    redirect("/admin");
  }

  const { data: props } = await supabase
    .schema("casa")
    .from("properties")
    .select("id, slug, name, city, color_bg, color_primary, owner_id")
    .order("name", { ascending: true });

  const list: Property[] = (props as Property[] | null) ?? [];

  return (
    <main className="min-h-screen bg-parchment text-onyx">
      <header className="border-b border-onyx/8 px-6 py-5 flex items-center justify-between">
        <div>
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
            ORIZ · Casa
          </span>
          <h1 className="font-display text-2xl font-light mt-1">
            Alle Pensionen &amp; Apartments
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/admin"
            className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 hover:text-gold transition-colors"
          >
            ← Venues
          </Link>
          <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/30">
            {list.length} {list.length === 1 ? "Eintrag" : "Einträge"}
          </span>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-px bg-gold/40 mx-auto mb-6" />
          <p className="font-display text-2xl italic text-onyx/50">
            Noch keine Casa-Objekte.
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p) => {
            const bg = p.color_bg ?? "#0A0A0A";
            const accent = p.color_primary ?? "#C69B3C";
            return (
              <Link
                key={p.id}
                href={`/admin/casa/${p.slug}`}
                className="group block bg-onyx text-parchment p-8 transition-transform hover:-translate-y-1 relative overflow-hidden"
                style={{ backgroundColor: bg, aspectRatio: "4/5" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}33 0%, transparent 70%)`,
                  }}
                />
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <span
                      className="font-sans text-[10px] tracking-regal uppercase"
                      style={{ color: accent }}
                    >
                      Casa
                    </span>
                    {p.city && (
                      <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/40 ml-3">
                        {p.city}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-display font-light text-parchment text-2xl mb-3">
                      {p.name}
                    </h2>
                    <div
                      className="w-10 h-px mb-5 transition-all duration-500 opacity-40 group-hover:w-full group-hover:opacity-80"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/45">
                        /casa/{p.slug}
                      </span>
                      <span
                        className="font-sans text-[11px] transition-transform group-hover:translate-x-1"
                        style={{ color: accent }}
                      >
                        ↗
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
