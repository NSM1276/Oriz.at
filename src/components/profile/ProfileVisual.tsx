import Link from "next/link";
import type { ProfileProps } from "@/components/profile/types";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { AboutText } from "@/components/profile/AboutText";
import { OpeningHoursSection } from "@/components/profile/OpeningHours";
import { AllergenSummary } from "@/components/profile/AllergenSummary";
import { ReviewButtons } from "@/components/profile/ReviewButtons";
import { MenusSection } from "@/components/profile/MenusSection";

// VISUAL theme — dark, immersive, imagery-forward restaurant profile.
// Glassy rounded cards, large logo, bold gallery hero. Consumes ThemeTokens `t`
// (never hardcodes colors) so it still reads correctly on a light bg.

const GLASS: React.CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
  border: "1px solid var(--color-border)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

function hasAnyHours(hours: ProfileProps["venue"]["opening_hours"]): boolean {
  if (!hours) return false;
  return Object.values(hours).some(
    (ranges) => Array.isArray(ranges) && ranges.length > 0,
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-sans text-[11px] tracking-regal uppercase mb-4"
      style={{ color: "var(--color-muted)" }}
    >
      {children}
    </h2>
  );
}

export function ProfileVisual({ venue, t, allergens = [], events = [] }: ProfileProps) {
  const gallery = (venue.gallery ?? []).filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  const ctaText = t.isDark ? "#0A0A0A" : "#FFFFFF";
  const phoneHref = venue.phone ? `tel:${venue.phone.replace(/\s+/g, "")}` : null;

  return (
    <div
      style={{
        backgroundColor: t.bg,
        minHeight: "100vh",
        ...t.cssVars,
      }}
    >
      {venue.cover_url && (
        <div className="w-full overflow-hidden" style={{ height: "280px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.cover_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <main
        className="mx-auto w-full max-w-2xl px-5 pt-6 font-sans"
        style={{
          color: t.text,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 3rem)",
        }}
      >
        {/* 1. Back link */}
        <Link
          href={`/${venue.slug}`}
          className="inline-flex items-center gap-1 font-sans text-[12px] tracking-regal uppercase transition-opacity hover:opacity-70"
          style={{ color: t.accent }}
        >
          ← Zur Speisekarte
        </Link>

        {/* 2. Hero */}
        <header className="mt-8 mb-10 flex flex-col items-center text-center">
          <VenueLogo
            name={venue.name}
            svg={venue.logo_svg}
            url={venue.logo_url}
            bg={venue.color_bg}
            accent={venue.color_primary}
            color="auto"
            height={96}
            textColor={t.text}
            isDarkBg={t.isDark}
          />
          <h1
            className="font-display mt-6 text-3xl md:text-4xl"
            style={{ color: t.text }}
          >
            {venue.name}
          </h1>
          {venue.price_range ? (
            <span
              className="mt-4 inline-block rounded-full px-4 py-1.5 font-sans text-[12px] tracking-regal"
              style={{
                color: t.accent,
                border: `1px solid ${t.accent}`,
                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              {venue.price_range}
            </span>
          ) : null}
        </header>

        <div className="space-y-5">
          {/* 7. Gallery — STAR of the visual theme */}
          {gallery.length > 0 ? (
            <section className="rounded-2xl p-5 md:p-6" style={GLASS}>
              <CardLabel>Galerie</CardLabel>
              <div className="space-y-3">
                <img
                  src={gallery[0]}
                  alt={`${venue.name} — Bild 1`}
                  loading="lazy"
                  className="w-full aspect-[16/10] object-cover rounded-xl"
                  style={{ border: "1px solid var(--color-border)" }}
                />
                {gallery.length > 1 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gallery.slice(1).map((src, i) => (
                      <img
                        key={`${src}-${i}`}
                        src={src}
                        alt={`${venue.name} — Bild ${i + 2}`}
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-xl"
                        style={{ border: "1px solid var(--color-border)" }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Allergens */}
          {allergens.length > 0 ? (
            <section className="rounded-2xl p-6" style={GLASS}>
              <AllergenSummary allergens={allergens} t={t} />
            </section>
          ) : null}

          {/* Events */}
          {events.length > 0 && (
            <section className="rounded-2xl p-6" style={GLASS}>
              <CardLabel>Veranstaltungen</CardLabel>
              <div className="space-y-3 mt-3">
                {events.map((ev) => (
                  <div key={ev.id} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: t.border }}>
                    <p className="font-display text-lg" style={{ color: t.text }}>{ev.title}</p>
                    <p className="font-sans text-[12px] mt-0.5" style={{ color: t.dim }}>
                      {new Date(ev.event_date).toLocaleDateString("de-AT", { day: "numeric", month: "short", year: "numeric" })}
                      {ev.time_start ? ` · ${ev.time_start.slice(0, 5)}` : ""}
                      {ev.duration_hours != null ? ` · ${String(ev.duration_hours).replace(".", ",")} Std.` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. About */}
          {venue.about ? (
            <section className="rounded-2xl p-6 md:p-8" style={GLASS}>
              <AboutText text={venue.about} />
            </section>
          ) : null}

          {/* 3b. Menus */}
          {(venue.menus ?? []).length > 0 && (
            <section className="rounded-2xl p-6" style={GLASS}>
              <MenusSection menus={venue.menus!} t={t} />
            </section>
          )}

          {/* 4. Contact */}
          {venue.address || phoneHref || venue.website_url ? (
            <section className="rounded-2xl p-6" style={GLASS}>
              <CardLabel>Kontakt</CardLabel>
              <ul className="space-y-4">
                {venue.address ? (
                  <li className="flex items-start gap-3">
                    <span style={{ color: t.accent }} className="mt-0.5 shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </span>
                    {venue.google_maps_url ? (
                      <a
                        href={venue.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm leading-relaxed transition-opacity hover:opacity-70 whitespace-pre-line"
                        style={{ color: t.dim }}
                      >
                        {venue.address}
                      </a>
                    ) : (
                      <span
                        className="text-sm leading-relaxed whitespace-pre-line"
                        style={{ color: t.dim }}
                      >
                        {venue.address}
                      </span>
                    )}
                  </li>
                ) : null}
                {phoneHref ? (
                  <li className="flex items-center gap-3">
                    <span style={{ color: t.accent }} className="shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                    </span>
                    <a
                      href={phoneHref}
                      className="text-sm transition-opacity hover:opacity-70"
                      style={{ color: t.dim }}
                    >
                      {venue.phone}
                    </a>
                  </li>
                ) : null}
                {venue.website_url ? (
                  <li className="flex items-center gap-3">
                    <span style={{ color: t.accent }} className="shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </span>
                    <a
                      href={venue.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm transition-opacity hover:opacity-70 break-all"
                      style={{ color: t.dim }}
                    >
                      {venue.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {/* 5. Opening hours */}
          {hasAnyHours(venue.opening_hours) ? (
            <section className="rounded-2xl p-6" style={GLASS}>
              <OpeningHoursSection hours={venue.opening_hours!} />
            </section>
          ) : null}

          {/* 6. Social */}
          {venue.instagram_url || venue.facebook_url ? (
            <section className="rounded-2xl p-6" style={GLASS}>
              <CardLabel>Folgen Sie uns</CardLabel>
              <div className="flex items-center gap-4">
                {venue.instagram_url ? (
                  <a
                    href={venue.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ color: t.text, border: "1px solid var(--color-border)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                ) : null}
                {venue.facebook_url ? (
                  <a
                    href={venue.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ color: t.text, border: "1px solid var(--color-border)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 8. Review partners */}
          <div className="rounded-2xl p-6" style={GLASS}>
            <ReviewButtons
              googleUrl={venue.google_review_url}
              tripadvisorUrl={venue.tripadvisor_url}
              facebookUrl={venue.facebook_url}
              muted={t.muted}
              border={t.border}
              text={t.text}
            />
          </div>

          {/* 9. CTA */}
          <Link
            href={`/${venue.slug}`}
            className="block rounded-2xl py-4 text-center font-sans text-[13px] tracking-regal uppercase transition-opacity hover:opacity-90"
            style={{ backgroundColor: t.accent, color: ctaText }}
          >
            Zur Speisekarte
          </Link>
        </div>

        {/* 10. Footer */}
        <footer className="mt-10 text-center">
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
