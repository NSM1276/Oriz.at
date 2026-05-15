import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ChangePasswordButton } from "@/components/admin/ChangePasswordButton";
import { SuperAdminView } from "@/components/admin/SuperAdminView";
import { limitForPlan } from "@/lib/plans";
import type { Item, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

type VenueRow = Venue & {
  plan: string;
  ai_credits_used: number;
  ai_credits_reset: string;
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
      .select("id, slug, name, about, color_bg, color_primary, logo_url, plan, instagram_url, google_maps_url, sections(id, items(id))")
      .order("created_at", { ascending: true })
      .returns<VenueRow[]>();

    const list = (venues ?? []).map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      about: v.about ?? null,
      color_bg: v.color_bg ?? null,
      color_primary: v.color_primary ?? null,
      logo_url: (v as { logo_url?: string | null }).logo_url ?? null,
      plan: v.plan ?? "trial",
      instagram_url: (v as { instagram_url?: string | null }).instagram_url ?? null,
      google_maps_url: (v as { google_maps_url?: string | null }).google_maps_url ?? null,
      itemCount: v.sections?.reduce((acc, s) => acc + (s.items?.length ?? 0), 0) ?? 0,
    }));

    return <SuperAdminView venues={list} />;
  }

  // Regular owner view
  const { data: venues } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, about, currency, color_primary, color_bg, owner_id, created_at, plan, ai_credits_used, ai_credits_reset, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at))",
    )
    .eq("owner_id", user.id)
    .returns<VenueRow[]>();

  const venue = venues?.[0];

  const plan = venue?.plan ?? "trial";
  const limit = limitForPlan(plan);
  const used = venue?.ai_credits_used ?? 0;
  const remaining = Math.max(0, limit - used);
  const canUseAi = remaining > 0;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
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

      {venue && (
        <div className="mb-10 flex items-center justify-between gap-4 border border-onyx/10 px-5 py-3 bg-white/40">
          <div className="flex items-center gap-3">
            <span className="font-sans text-[10px] tracking-regal uppercase text-onyx/50">
              Plan
            </span>
            <span className="font-display text-lg text-onyx capitalize">{plan}</span>
          </div>
          <div className="text-right">
            <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/50">
              AI-Texte diesen Monat
            </div>
            <div className="font-display text-lg tabular-nums">
              <span className={remaining === 0 ? "text-red-700" : "text-onyx"}>{used}</span>
              <span className="text-onyx/40"> / {limit}</span>
            </div>
          </div>
        </div>
      )}

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
                    <ItemEditor key={item.id} initial={item} canUseAi={canUseAi} />
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
