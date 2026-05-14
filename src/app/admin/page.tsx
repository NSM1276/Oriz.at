import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ChangePasswordButton } from "@/components/admin/ChangePasswordButton";
import { SuperAdminView } from "@/components/admin/SuperAdminView";
import type { Item, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

type VenueRow = Venue & {
  plan: string;
  sections: (Section & { items: Item[] })[];
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

  if (isSuperAdmin) {
    const { data: venues } = await supabase
      .from("venues")
      .select("id, slug, name, about, color_bg, color_primary, plan, sections(id, items(id))")
      .order("created_at", { ascending: true })
      .returns<VenueRow[]>();

    const list = (venues ?? []).map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      about: v.about ?? null,
      color_bg: v.color_bg ?? null,
      color_primary: v.color_primary ?? null,
      plan: v.plan ?? "trial",
      itemCount: v.sections?.reduce((acc, s) => acc + (s.items?.length ?? 0), 0) ?? 0,
    }));

    return <SuperAdminView venues={list} />;
  }

  // Regular owner view
  const { data: venues } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, about, currency, color_primary, color_bg, owner_id, created_at, plan, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, is_active, position, updated_at))",
    )
    .eq("owner_id", user.id)
    .returns<VenueRow[]>();

  const venue = venues?.[0];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <span className="font-sans text-[11px] tracking-regal uppercase text-gold">
            ORIZ · Admin
          </span>
          <h1 className="font-display text-3xl text-onyx mt-1">
            {venue ? venue.name : "No venue yet"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ChangePasswordButton />
          <SignOutButton />
        </div>
      </div>

      {!venue ? (
        <div className="border border-dashed border-onyx/30 p-10 text-center">
          <p className="font-display italic text-xl text-onyx/80">
            You have no venue attached to this account.
          </p>
        </div>
      ) : (
        venue.sections
          ?.slice()
          .sort((a, b) => a.position - b.position)
          .map((section) => {
            const items = (section.items ?? [])
              .slice()
              .sort((a, b) => a.position - b.position);
            return (
              <section key={section.id} className="mt-10">
                <header className="mb-4 flex items-center gap-4">
                  <span className="font-sans text-[11px] tracking-regal uppercase text-gold">
                    {section.name}
                  </span>
                  <div className="flex-1 h-px bg-onyx/15" />
                </header>
                <ul>
                  {items.map((item) => (
                    <ItemEditor key={item.id} initial={item} />
                  ))}
                </ul>
              </section>
            );
          })
      )}

      <p className="mt-16 font-sans text-xs text-onyx/50 text-center">
        Changes appear instantly on{" "}
        {venue ? (
          <a className="underline decoration-gold" href={`/${venue.slug}`} target="_blank" rel="noreferrer">
            /{venue.slug}
          </a>
        ) : "the guest menu"}.
      </p>
    </main>
  );
}
