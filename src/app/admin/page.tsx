import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ChangePasswordButton } from "@/components/admin/ChangePasswordButton";
import { SuperAdminView } from "@/components/admin/SuperAdminView";
import { QRCodeBlock } from "@/components/admin/QRCodeBlock";
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

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

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

  const isDark = venue?.color_bg ? getLuminance(venue.color_bg) < 0.4 : false;
  const bg     = venue?.color_bg      ?? '#F5F0EC';
  const text   = isDark ? '#F5F0EC'   : '#0A0A0A';
  const dim    = isDark ? 'rgba(245,240,236,0.60)' : 'rgba(10,10,10,0.60)';
  const muted  = isDark ? 'rgba(245,240,236,0.30)' : 'rgba(10,10,10,0.30)';
  const border = isDark ? 'rgba(245,240,236,0.10)' : 'rgba(10,10,10,0.10)';
  const accent = venue?.color_primary ?? '#C69B3C';

  const cssVars = {
    '--color-bg': bg, '--color-text': text, '--color-dim': dim,
    '--color-muted': muted, '--color-border': border, '--accent': accent,
  } as React.CSSProperties;

  return (
    <div style={{ backgroundColor: bg, minHeight: '100dvh', ...cssVars }}>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
          <div>
            <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: accent }}>
              ORIZ · Admin
            </span>
            <h1 className="font-display text-3xl mt-1" style={{ color: text }}>
              {venue ? venue.name : "No venue yet"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ChangePasswordButton />
            <SignOutButton />
          </div>
        </div>

        {venue && (
          <div
            className="mb-10 flex items-center justify-between gap-4 px-5 py-3"
            style={{
              border: `1px solid ${border}`,
              backgroundColor: isDark ? 'rgba(245,240,236,0.05)' : 'rgba(10,10,10,0.03)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="font-sans text-[10px] tracking-regal uppercase" style={{ color: muted }}>
                Plan
              </span>
              <span className="font-display text-lg capitalize" style={{ color: text }}>{plan}</span>
            </div>
            <div className="text-right">
              <div className="font-sans text-[10px] tracking-regal uppercase" style={{ color: muted }}>
                AI-Texte diesen Monat
              </div>
              <div className="font-display text-lg tabular-nums">
                <span style={{ color: remaining === 0 ? '#ef4444' : text }}>{used}</span>
                <span style={{ color: muted }}> / {limit}</span>
              </div>
            </div>
          </div>
        )}

        {venue && <QRCodeBlock slug={venue.slug} />}

        {!venue ? (
          <div className="border border-dashed p-10 text-center" style={{ borderColor: border }}>
            <p className="font-display italic text-xl" style={{ color: dim }}>
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
                    <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: accent }}>
                      {section.name}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: border }} />
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

        <p className="mt-16 font-sans text-xs text-center" style={{ color: muted }}>
          Changes appear instantly on{" "}
          {venue ? (
            <a
              className="underline"
              style={{ color: accent, textDecorationColor: accent }}
              href={`/${venue.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              /{venue.slug}
            </a>
          ) : "the guest menu"}.
        </p>
      </main>
    </div>
  );
}
