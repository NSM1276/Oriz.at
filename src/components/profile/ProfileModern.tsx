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

// ── Icons (mirrored from MenuView footer) ───────────────────────
const InstagramIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const StarIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

// ── Numbered section wrapper (modern idiom) ─────────────────────
function NumberedBlock({
  index,
  title,
  t,
  children,
}: {
  index: number;
  title: string;
  t: ProfileProps["t"];
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <div className="flex items-end gap-5 mb-8">
        <span
          className="font-display font-light leading-none select-none"
          style={{
            fontSize: "clamp(3rem, 11vw, 5.5rem)",
            color: t.accent,
            opacity: 0.12,
            lineHeight: 0.85,
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <div className="pb-1">
          <h2
            className="font-sans tracking-regal uppercase"
            style={{
              fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)",
              color: t.text,
            }}
          >
            {title}
          </h2>
          <div className="mt-2 h-px w-10" style={{ backgroundColor: t.accent }} />
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProfileModern({ venue, t, allergens = [], events = [] }: ProfileProps) {
  // ── Derive which sections render ──────────────────────────────
  const hasAbout = !!venue.about?.trim();

  const phoneClean = venue.phone?.replace(/\s+/g, "") ?? "";
  const hasKontakt =
    !!venue.address?.trim() || !!venue.phone?.trim() || !!venue.website_url?.trim();

  const hours = (venue.opening_hours ?? {}) as OpeningHours;
  const hasHours = Object.values(hours).some(
    (ranges) => Array.isArray(ranges) && ranges.length > 0,
  );

  const galleryImages = (venue.gallery ?? []).filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0,
  );
  const hasGallery = galleryImages.length > 0;

  const hasSocial = !!venue.instagram_url || !!venue.facebook_url;

  const hasReviews =
    !!venue.google_review_url || !!venue.tripadvisor_url || !!venue.facebook_url;

  // Running index so only rendered blocks get numbered.
  let n = 0;
  const next = () => (n += 1);

  const ctaTextColor = t.isDark ? "#0A0A0A" : "#FFFFFF";

  return (
    <div style={{ backgroundColor: t.bg, minHeight: "100vh", ...t.cssVars }}>
      {venue.cover_url && (
        <div className="w-full overflow-hidden" style={{ height: "240px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.cover_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <main
        className="max-w-2xl mx-auto px-6 pt-10"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* 1. Back link */}
        <Link
          href={`/${venue.slug}`}
          className="font-sans text-[11px] tracking-regal uppercase transition-opacity hover:opacity-60"
          style={{ color: t.accent }}
        >
          ← Zur Speisekarte
        </Link>

        {/* 2. Header */}
        <header className="mt-12 mb-4">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={90}
            textColor={t.text}
            isDarkBg={t.isDark}
          />
          <h1
            className="font-display font-light mt-6"
            style={{
              fontSize: "clamp(2rem, 8vw, 3.25rem)",
              color: t.text,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {venue.name}
          </h1>
          {venue.price_range && (
            <span
              className="inline-block font-sans text-[11px] tracking-regal uppercase mt-4"
              style={{ color: t.accent }}
            >
              {venue.price_range}
            </span>
          )}
          <div className="mt-7 flex items-center gap-4">
            <span
              className="font-sans text-[10px] tracking-regal uppercase"
              style={{ color: t.muted }}
            >
              Information
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: t.border }} />
          </div>
        </header>

        {/* Menus */}
        {(venue.menus ?? []).length > 0 && (
          <NumberedBlock index={next()} title="Speisekarten" t={t}>
            <MenusSection menus={venue.menus!} t={t} />
          </NumberedBlock>
        )}

        {/* About */}
        {hasAbout && (
          <NumberedBlock index={next()} title="Über uns" t={t}>
            <div className="text-left">
              <AboutText text={venue.about!.trim()} />
            </div>
          </NumberedBlock>
        )}

        {/* Kontakt */}
        {hasKontakt && (
          <NumberedBlock index={next()} title="Kontakt" t={t}>
            <div className="space-y-4">
              {venue.address?.trim() && (
                <div>
                  {venue.google_maps_url ? (
                    <a
                      href={venue.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans text-sm leading-relaxed whitespace-pre-line transition-opacity hover:opacity-70"
                      style={{ color: t.text }}
                    >
                      {venue.address}
                    </a>
                  ) : (
                    <p
                      className="font-sans text-sm leading-relaxed whitespace-pre-line"
                      style={{ color: t.text }}
                    >
                      {venue.address}
                    </p>
                  )}
                </div>
              )}
              {venue.phone?.trim() && (
                <a
                  href={`tel:${phoneClean}`}
                  className="block font-sans text-sm transition-opacity hover:opacity-70"
                  style={{ color: t.text }}
                >
                  {venue.phone}
                </a>
              )}
              {venue.website_url?.trim() && (
                <a
                  href={venue.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-sans text-sm transition-opacity hover:opacity-70"
                  style={{ color: t.accent }}
                >
                  {venue.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </NumberedBlock>
        )}

        {/* Öffnungszeiten */}
        {hasHours && (
          <NumberedBlock index={next()} title="Öffnungszeiten" t={t}>
            <div className="text-left [&_section]:text-left [&_h2]:hidden [&_ul]:mx-0 [&_button]:text-left">
              <OpeningHoursSection hours={hours} />
            </div>
          </NumberedBlock>
        )}

        {/* Galerie */}
        {events.length > 0 && (
          <NumberedBlock index={next()} title="Veranstaltungen" t={t}>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: t.border }}>
                  <p className="font-sans text-sm font-medium" style={{ color: t.text }}>{ev.title}</p>
                  <p className="font-sans text-[11px] mt-0.5" style={{ color: t.dim }}>
                    {new Date(ev.event_date).toLocaleDateString("de-AT", { day: "numeric", month: "short", year: "numeric" })}
                    {ev.time_start ? ` · ${ev.time_start.slice(0, 5)}` : ""}
                    {ev.duration_hours != null ? ` · ${String(ev.duration_hours).replace(".", ",")} Std.` : ""}
                  </p>
                </div>
              ))}
            </div>
          </NumberedBlock>
        )}

        {hasGallery && (
          <NumberedBlock index={next()} title="Galerie" t={t}>
            <div className="[&_h2]:hidden">
              <Gallery images={galleryImages} name={venue.name} />
            </div>
          </NumberedBlock>
        )}

        {/* Allergene */}
        {allergens.length > 0 && (
          <NumberedBlock index={next()} title="Allergene" t={t}>
            <AllergenSummary allergens={allergens} t={t} />
          </NumberedBlock>
        )}

        {/* Folgen (social) */}
        {hasSocial && (
          <NumberedBlock index={next()} title="Folgen" t={t}>
            <div className="flex flex-col gap-4">
              {venue.instagram_url && (
                <a
                  href={venue.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 font-sans text-sm tracking-wide transition-opacity hover:opacity-70"
                  style={{ color: t.text }}
                >
                  {InstagramIcon}
                  Instagram
                </a>
              )}
              {venue.facebook_url && (
                <a
                  href={venue.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 font-sans text-sm tracking-wide transition-opacity hover:opacity-70"
                  style={{ color: t.text }}
                >
                  {FacebookIcon}
                  Facebook
                </a>
              )}
            </div>
          </NumberedBlock>
        )}

        {/* Bewertungen */}
        {hasReviews && (
          <NumberedBlock index={next()} title="Bewertungen" t={t}>
            <ReviewButtons
              googleUrl={venue.google_review_url}
              tripadvisorUrl={venue.tripadvisor_url}
              facebookUrl={venue.facebook_url}
              muted={t.muted}
              border={t.border}
              text={t.text}
            />
          </NumberedBlock>
        )}

        {/* 4. CTA */}
        <div className="mt-24">
          <Link
            href={`/${venue.slug}`}
            className="inline-flex items-center justify-center w-full py-4 font-sans text-[12px] tracking-regal uppercase transition-opacity hover:opacity-90"
            style={{ backgroundColor: t.accent, color: ctaTextColor }}
          >
            Zur Speisekarte
          </Link>
        </div>

        {/* 5. Footer */}
        <footer className="mt-16 flex flex-col gap-4">
          <div className="h-px w-full" style={{ backgroundColor: t.border }} />
          <span
            className="font-sans text-[11px] tracking-regal uppercase"
            style={{ color: t.muted }}
          >
            Powered by ORIZ
          </span>
        </footer>
      </main>
    </div>
  );
}
