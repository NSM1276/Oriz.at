import Link from "next/link";
import type { ProfileProps } from "@/components/profile/types";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { AboutText } from "@/components/profile/AboutText";
import { OpeningHoursSection } from "@/components/profile/OpeningHours";
import { Gallery } from "@/components/profile/Gallery";
import { AllergenSummary } from "@/components/profile/AllergenSummary";
import { ReviewButtons } from "@/components/profile/ReviewButtons";
import { MenusSection } from "@/components/profile/MenusSection";
import type { OpeningHours } from "@/lib/supabase/types";

// Thin gold hairline rule.
function Hairline({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      className="mx-auto"
      style={{
        height: 1,
        width: 64,
        background: accent,
        opacity: 0.5,
      }}
    />
  );
}

function hasOpeningHours(hours: OpeningHours | null | undefined): hours is OpeningHours {
  if (!hours) return false;
  return Object.values(hours).some(
    (ranges) => Array.isArray(ranges) && ranges.length > 0,
  );
}

export function ProfileClassic({ venue, t, allergens = [], events = [] }: ProfileProps) {
  const ctaTextColor = t.isDark ? "#0A0A0A" : "#FFFFFF";
  const gallery = (venue.gallery ?? []).filter(
    (src): src is string => typeof src === "string" && src.length > 0,
  );
  const showOpeningHours = hasOpeningHours(venue.opening_hours);

  type ReviewPartner = { label: string; url: string; icon: React.ReactNode };
  const reviewPartners: ReviewPartner[] = ([
    venue.google_review_url
      ? {
          label: "Google",
          url: venue.google_review_url,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
          ),
        }
      : null,
    venue.tripadvisor_url
      ? {
          label: "TripAdvisor",
          url: venue.tripadvisor_url,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 6.5c-3.1 0-5.93.7-8.2 1.9H0l1.62 1.76A4.7 4.7 0 0 0 4.78 18a4.7 4.7 0 0 0 3.5-1.56L9.9 18l1.62-1.76L13.14 18l1.62-1.56A4.7 4.7 0 0 0 18.28 18a4.7 4.7 0 0 0 3.13-8.04L24 8.4h-3.8A18.3 18.3 0 0 0 12 6.5zm-7.22 9.9a2.65 2.65 0 1 1 0-5.3 2.65 2.65 0 0 1 0 5.3zm7.22-.13a3.13 3.13 0 0 0-1.96-2.9 7.6 7.6 0 0 1 3.92 0A3.13 3.13 0 0 0 12 16.27zm6.28.13a2.65 2.65 0 1 1 0-5.3 2.65 2.65 0 0 1 0 5.3zm0-3.97a1.32 1.32 0 1 0 0 2.64 1.32 1.32 0 0 0 0-2.64zm-12.56 0a1.32 1.32 0 1 0 0 2.64 1.32 1.32 0 0 0 0-2.64z" />
            </svg>
          ),
        }
      : null,
    venue.facebook_url
      ? {
          label: "Facebook",
          url: venue.facebook_url,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          ),
        }
      : null,
  ] as (ReviewPartner | null)[]).filter((p): p is ReviewPartner => p !== null);

  return (
    <div
      style={{ backgroundColor: t.bg, minHeight: "100vh", ...t.cssVars }}
    >
      {/* Hero cover photo */}
      {venue.cover_url && (
        <div className="w-full overflow-hidden" style={{ height: "240px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.cover_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className="mx-auto w-full max-w-xl px-6 pt-8"
        style={{
          paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* 1. Back to menu */}
        <Link
          href={`/${venue.slug}`}
          className="inline-flex items-center font-sans text-[11px] tracking-regal uppercase transition-opacity hover:opacity-70"
          style={{ color: t.accent }}
        >
          ← Zur Speisekarte
        </Link>

        {/* 2. Logo */}
        <div className="mt-10 flex justify-center">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={72}
            textColor={t.text}
            isDarkBg={t.isDark}
          />
        </div>

        {/* 3. Price range */}
        {venue.price_range ? (
          <p
            className="mt-4 text-center font-sans text-sm tracking-regal"
            style={{ color: t.accent }}
          >
            {venue.price_range}
          </p>
        ) : null}

        {/* 4. Divider */}
        <div className="mt-8">
          <Hairline accent={t.accent} />
        </div>

        {/* 5. About */}
        {venue.about ? (
          <div className="mt-8">
            <AboutText text={venue.about} />
          </div>
        ) : null}

        {/* 5b. Menus */}
        {(venue.menus ?? []).length > 0 && (
          <div className="mt-10">
            <MenusSection menus={venue.menus!} t={t} />
          </div>
        )}

        {/* 6. Contact */}
        {(venue.address || venue.phone || venue.website_url) && (
          <section className="mt-10 text-center font-sans text-sm">
            <h2
              className="mb-4 text-[11px] tracking-regal uppercase"
              style={{ color: t.muted }}
            >
              Kontakt
            </h2>
            <div className="space-y-2">
              {venue.address ? (
                venue.google_maps_url ? (
                  <a
                    href={venue.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block whitespace-pre-line transition-opacity hover:opacity-70"
                    style={{ color: t.dim }}
                  >
                    {venue.address}
                  </a>
                ) : (
                  <p
                    className="whitespace-pre-line"
                    style={{ color: t.dim }}
                  >
                    {venue.address}
                  </p>
                )
              ) : null}
              {venue.phone ? (
                <a
                  href={`tel:${venue.phone.replace(/\s+/g, "")}`}
                  className="block transition-opacity hover:opacity-70"
                  style={{ color: t.dim }}
                >
                  {venue.phone}
                </a>
              ) : null}
              {venue.website_url ? (
                <a
                  href={venue.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block tracking-regal uppercase text-[11px] transition-opacity hover:opacity-70"
                  style={{ color: t.accent }}
                >
                  Website
                </a>
              ) : null}
            </div>
          </section>
        )}

        {/* 7. Opening hours */}
        {showOpeningHours ? (
          <div className="mt-10">
            <OpeningHoursSection hours={venue.opening_hours as OpeningHours} />
          </div>
        ) : null}

        {/* 8. Social */}
        {(venue.instagram_url || venue.facebook_url) && (
          <div className="mt-10 flex items-center justify-center gap-6">
            {venue.instagram_url ? (
              <a
                href={venue.instagram_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ color: t.dim }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Instagram</span>
              </a>
            ) : null}
            {venue.facebook_url ? (
              <a
                href={venue.facebook_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ color: t.dim }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-sans text-[9px] tracking-regal uppercase">Facebook</span>
              </a>
            ) : null}
          </div>
        )}

        {/* 9. Gallery */}
        {gallery.length > 0 ? (
          <div className="mt-12">
            <Gallery images={gallery} name={venue.name} />
          </div>
        ) : null}

        {/* 9b. Events */}
        {events.length > 0 && (
          <section className="mt-12 text-center">
            <h2 className="mb-4 font-sans text-[11px] tracking-regal uppercase" style={{ color: t.muted }}>Veranstaltungen</h2>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="py-3 border-b" style={{ borderColor: t.border }}>
                  <p className="font-display italic text-lg" style={{ color: t.text }}>{ev.title}</p>
                  <p className="font-sans text-[12px] mt-1" style={{ color: t.dim }}>
                    {new Date(ev.event_date).toLocaleDateString("de-AT", { day: "numeric", month: "short", year: "numeric" })}
                    {ev.time_start ? ` · ${ev.time_start.slice(0, 5)}` : ""}
                    {ev.duration_hours != null ? ` · ${String(ev.duration_hours).replace(".", ",")} Std.` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 10. Allergens */}
        {allergens.length > 0 ? (
          <div className="mt-12">
            <AllergenSummary allergens={allergens} t={t} />
          </div>
        ) : null}

        {/* 11. Review partners */}
        <ReviewButtons
          googleUrl={venue.google_review_url}
          tripadvisorUrl={venue.tripadvisor_url}
          facebookUrl={venue.facebook_url}
          muted={t.muted}
          border={t.border}
          text={t.text}
        />

        {/* 11. CTA */}
        <div className="mt-12">
          <Link
            href={`/${venue.slug}`}
            className="block w-full rounded-full py-4 text-center font-sans text-xs tracking-regal uppercase transition-opacity hover:opacity-90"
            style={{ backgroundColor: t.accent, color: ctaTextColor }}
          >
            Zur Speisekarte
          </Link>
        </div>

        {/* 12. Footer */}
        <p
          className="mt-10 text-center font-sans text-[10px] tracking-regal uppercase"
          style={{ color: t.muted }}
        >
          Powered by ORIZ
        </p>
      </div>
    </div>
  );
}
