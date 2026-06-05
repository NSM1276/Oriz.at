"use client";

import { useState } from "react";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { SectionNav } from "@/components/admin/SectionNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ChangePasswordButton } from "@/components/admin/ChangePasswordButton";
import { QRCodeBlock } from "@/components/admin/QRCodeBlock";
import { OwnerStylePicker } from "@/components/admin/OwnerStylePicker";
import { limitForPlan } from "@/lib/plans";
import type { Item, Section, Venue } from "@/lib/supabase/types";

type VenueWithSections = Venue & {
  plan: string;
  ai_credits_used: number;
  ai_credits_reset: string;
  sections: (Section & { items: Item[] })[];
};

function getLuminance(hex: string): number {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Shared content-editor view used by:
// - /admin (when an owner logs in and has exactly one venue)
// - /admin/carta/[slug] (super admin opening any venue, or owner reaching by URL)
//
// `superAdminLink` is an optional href back to /admin/casa or /admin
// to make navigation obvious when super admin lands here.
export function CartaOwnerView({
  venue: initialVenue,
  superAdminLink,
}: {
  venue: VenueWithSections | null;
  superAdminLink?: string;
}) {
  // Live venue state — updates instantly when owner changes style
  const [venueStyle, setVenueStyle] = useState({
    color_bg:      initialVenue?.color_bg      ?? null,
    color_primary: initialVenue?.color_primary ?? null,
    menu_theme:    initialVenue?.menu_theme     ?? "classic",
  });

  const venue = initialVenue
    ? { ...initialVenue, ...venueStyle }
    : initialVenue;

  function handleStyleUpdate(updates: {
    color_bg?: string;
    color_primary?: string;
    menu_theme?: string;
  }) {
    setVenueStyle((prev) => ({
      ...prev,
      ...(updates.color_bg !== undefined      ? { color_bg: updates.color_bg }           : {}),
      ...(updates.color_primary !== undefined  ? { color_primary: updates.color_primary } : {}),
      ...(updates.menu_theme !== undefined
        ? { menu_theme: updates.menu_theme as "classic" | "modern" | "visual" }
        : {}),
    }));
  }

  const plan = venue?.plan ?? "trial";
  const limit = limitForPlan(plan);
  const used = venue?.ai_credits_used ?? 0;
  const remaining = Math.max(0, limit - used);
  const canUseAi = remaining > 0;

  const isDark = venue?.color_bg ? getLuminance(venue.color_bg) < 0.4 : false;
  const bg = venue?.color_bg ?? "#F5F0EC";
  const text = isDark ? "#F5F0EC" : "#0A0A0A";
  const dim = isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)";
  const muted = isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)";
  const border = isDark ? "rgba(245,240,236,0.10)" : "rgba(10,10,10,0.10)";
  const accent = venue?.color_primary ?? "#C69B3C";

  const cssVars = {
    "--color-bg": bg,
    "--color-text": text,
    "--color-dim": dim,
    "--color-muted": muted,
    "--color-border": border,
    "--accent": accent,
  } as React.CSSProperties;

  return (
    <div style={{ backgroundColor: bg, minHeight: "100dvh", ...cssVars }}>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
          <div>
            <span
              className="font-sans text-[11px] tracking-regal uppercase"
              style={{ color: accent }}
            >
              ORIZ · Admin
            </span>
            <h1
              className="font-display text-3xl mt-1"
              style={{ color: text }}
            >
              {venue ? venue.name : "No venue yet"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {superAdminLink && (
              <a
                href={superAdminLink}
                className="font-sans text-[10px] tracking-regal uppercase px-3 py-2 transition-opacity hover:opacity-70"
                style={{
                  border: `1px solid ${border}`,
                  color: dim,
                }}
              >
                ← Super Admin
              </a>
            )}
            <ChangePasswordButton />
            <SignOutButton />
          </div>
        </div>

        {venue && (
          <div
            className="mb-10 flex items-center justify-between gap-4 px-5 py-3"
            style={{
              border: `1px solid ${border}`,
              backgroundColor: isDark
                ? "rgba(245,240,236,0.05)"
                : "rgba(10,10,10,0.03)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-sans text-[10px] tracking-regal uppercase"
                style={{ color: muted }}
              >
                Plan
              </span>
              <span
                className="font-display text-lg capitalize"
                style={{ color: text }}
              >
                {plan}
              </span>
            </div>
            <div className="text-right">
              <div
                className="font-sans text-[10px] tracking-regal uppercase"
                style={{ color: muted }}
              >
                AI-Texte diesen Monat
              </div>
              <div className="font-display text-lg tabular-nums">
                <span
                  style={{
                    color:
                      remaining === 0
                        ? isDark
                          ? "#FCA5A5"
                          : "#DC2626"
                        : text,
                  }}
                >
                  {used}
                </span>
                <span style={{ color: muted }}> / {limit}</span>
              </div>
            </div>
          </div>
        )}

        {venue && (
          <>
            <QRCodeBlock slug={venue.slug} />
            <div className="mb-10 flex gap-3 flex-wrap">
              <a
                href={`/${venue.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-80"
                style={{
                  border: `1px solid ${
                    isDark ? "rgba(245,240,236,0.35)" : "rgba(10,10,10,0.35)"
                  }`,
                  color: text,
                }}
              >
                Menü ansehen →
              </a>
              <a
                href={`/${venue.slug}/print`}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: accent,
                  color: isDark ? "#0A0A0A" : "#FFFFFF",
                }}
              >
                Menü drucken / PDF ↓
              </a>
            </div>
          </>
        )}

        {/* Style picker — color palette + theme switcher */}
        {venue && (
          <OwnerStylePicker
            venueId={venue.id}
            color_bg={venue.color_bg}
            color_primary={venue.color_primary}
            menu_theme={venue.menu_theme}
            onUpdate={handleStyleUpdate}
          />
        )}

        {!venue ? (
          <div
            className="border border-dashed p-10 text-center"
            style={{ borderColor: border }}
          >
            <p
              className="font-display italic text-xl"
              style={{ color: dim }}
            >
              You have no venue attached to this account.
            </p>
          </div>
        ) : (
          (() => {
            const sorted = (venue.sections ?? [])
              .slice()
              .sort((a, b) => a.position - b.position);
            return (
              <>
                <SectionNav
                  sections={sorted.map((s) => ({ id: s.id, name: s.name }))}
                />
                {sorted.map((section) => {
                  const items = (section.items ?? [])
                    .slice()
                    .sort((a, b) => a.position - b.position);
                  return (
                    <section
                      key={section.id}
                      id={`section-${section.id}`}
                      className="mt-12"
                    >
                      <header className="mb-5 flex items-center gap-4 pt-2">
                        <span
                          className="font-sans text-sm tracking-regal uppercase shrink-0"
                          style={{ color: accent, fontWeight: 600 }}
                        >
                          {section.name}
                        </span>
                        <div
                          className="flex-1 h-px"
                          style={{ backgroundColor: accent, opacity: 0.25 }}
                        />
                      </header>
                      <ul>
                        {items.map((item) => (
                          <ItemEditor
                            key={item.id}
                            initial={item}
                            canUseAi={canUseAi}
                          />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </>
            );
          })()
        )}

        <p
          className="mt-16 font-sans text-xs text-center"
          style={{ color: muted }}
        >
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
          ) : (
            "the guest menu"
          )}
          .
        </p>
      </main>
    </div>
  );
}
