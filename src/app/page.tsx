"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/landing/ContactForm";
import { HeroAtmosphere } from "@/components/landing/HeroAtmosphere";
import { LegalLinks } from "@/components/landing/LegalLinks";
import { LocaleProvider } from "@/lib/locale-context";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { useT } from "@/lib/locale-context";

const DEMO_SLUGS = [
  { slug: "belvedere", bg: "#1C1208", accent: "#C8963E", name: "Trattoria Belvedere", isAdmin: false },
  { slug: "demo",      bg: "#0A0A0A", accent: "#C69B3C", name: "Admin-Panel",         isAdmin: true  },
];

const PLAN_META = [
  { plan: "trial",   accent: false },
  { plan: "starter", accent: true  },
  { plan: "pro",     accent: false },
] as const;

const LANG_GRID = [
  { lang: "DE", name: "Deutsch" },
  { lang: "EN", name: "English" },
  { lang: "RU", name: "Русский" },
  { lang: "AR", name: "العربية" },
  { lang: "TR", name: "Türkçe" },
  { lang: "FR", name: "Français" },
  { lang: "IT", name: "Italiano" },
  { lang: "ES", name: "Español" },
  { lang: "JA", name: "日本語" },
  { lang: "ZH", name: "中文" },
  { lang: "PL", name: "Polski" },
  { lang: "UK", name: "Українська" },
];

function LandingContent() {
  const { t } = useT();

  // Merge translation plan strings with hardcoded plan metadata
  const plans = PLAN_META.map((meta, i) => ({
    ...meta,
    ...t.pricing.plans[i],
  }));

  // Merge translation venue strings with hardcoded slug/bg/accent/name/isAdmin
  const demoVenues = DEMO_SLUGS.map((slug, i) => ({
    ...slug,
    type:  t.demo.venues[i].type,
    items: t.demo.venues[i].items,
    cta:   t.demo.venues[i].cta,
  }));

  return (
    <main className="bg-parchment text-onyx overflow-x-hidden">

      {/* ── Hero ── */}
      <HeroAtmosphere />

      {/* ── Problem ── */}
      <section id="problem" className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.problem.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light leading-tight">
              {t.problem.heading.split("\n").map((line, i) => (
                <span key={i}>{line}{i < t.problem.heading.split("\n").length - 1 && <br />}</span>
              ))}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {t.problem.cards.map(({ title, body }) => (
              <div key={title} className="border border-parchment/8 p-8">
                <div className="font-display text-3xl text-parchment/15 mb-4">✕</div>
                <h3 className="font-sans text-[10px] tracking-regal uppercase text-parchment/40 mb-3">{title}</h3>
                <p className="font-display text-sm text-parchment/50 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <div className="w-12 h-px bg-gold/40 mx-auto mb-6" />
            <p className="font-display text-2xl md:text-3xl text-parchment/70 italic">
              {t.problem.outro}
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats / Vier Zahlen ── */}
      <section id="warum" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.stats.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              {t.stats.heading}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {t.stats.items.map(({ stat, label, body }) => (
              <div key={label} className="border-t border-gold/25 pt-6">
                <div className="font-display text-5xl md:text-6xl font-light text-gold mb-2">{stat}</div>
                <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/40 mb-4">{label}</div>
                <p className="font-display text-sm text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section id="demo" className="py-32 px-6 bg-onyx/[0.025] border-t border-onyx/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.demo.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              {t.demo.heading}
            </h2>
            <p className="font-sans text-sm text-onyx/40 mt-4 max-w-md mx-auto leading-relaxed">
              {t.demo.sub}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {demoVenues.map(({ slug, name, type, items, bg, accent, cta, isAdmin }) => (
              <a
                key={slug}
                href={isAdmin ? "/demo" : `/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden flex flex-col justify-between p-8 transition-transform duration-500 hover:-translate-y-1"
                style={{ backgroundColor: bg, aspectRatio: "4/5" }}
              >
                {/* radial glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}22 0%, transparent 70%)` }}
                />
                {/* bottom edge accent line — brightens on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 opacity-20 group-hover:opacity-70"
                  style={{ backgroundColor: accent }}
                />

                {/* top: type label */}
                <div className="relative z-10">
                  <span
                    className="font-sans text-[9px] tracking-regal uppercase"
                    style={{ color: `${accent}99` }}
                  >
                    {type}
                  </span>
                </div>

                {/* center: name + subtitle */}
                <div className="relative z-10">
                  <h3
                    className="font-display font-light leading-snug text-parchment mb-3 transition-colors duration-300 group-hover:text-white"
                    style={{ fontSize: "clamp(1.4rem, 2.8vw, 2rem)" }}
                  >
                    {name}
                  </h3>
                  <span className="font-sans text-[9px] tracking-regal uppercase text-parchment/20">
                    {items}
                  </span>
                </div>

                {/* bottom: hairline + CTA */}
                <div className="relative z-10">
                  <div
                    className="w-10 h-px mb-5 transition-all duration-500 opacity-30 group-hover:opacity-80 group-hover:w-full"
                    style={{ backgroundColor: accent }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[9px] tracking-regal uppercase text-parchment/35 group-hover:text-parchment/65 transition-colors duration-300">
                      {cta}
                    </span>
                    <span
                      className="font-sans text-[11px] transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: accent }}
                    >
                      ↗
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] text-onyx/25 mt-8 tracking-wide uppercase">
            {t.demo.disclaimer}
          </p>
        </div>
      </section>

      {/* ── 20+ Sprachen ── */}
      <section className="py-28 px-6 bg-onyx text-parchment overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.languages.eyebrow}</span>
              <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light leading-tight">
                {t.languages.heading}
              </h2>
              <div className="w-10 h-px bg-gold/40 mb-8" />
              <p className="font-display text-lg text-parchment/60 italic leading-relaxed mb-6">
                {t.languages.body1}
              </p>
              <p className="font-display text-lg text-parchment/60 italic leading-relaxed">
                {t.languages.body2}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {LANG_GRID.map(({ lang, name }) => (
                <div key={lang} className="border border-parchment/8 p-3 text-center">
                  <div className="font-sans text-[10px] tracking-regal uppercase text-gold mb-1">{lang}</div>
                  <div className="font-display text-xs text-parchment/40">{name}</div>
                </div>
              ))}
              <div className="col-span-3 border border-parchment/8 p-3 text-center">
                <div className="font-sans text-[10px] tracking-regal uppercase text-parchment/25">
                  {t.languages.more}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 border-t border-onyx/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.testimonials.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">{t.testimonials.heading}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.testimonials.items.map(({ quote, name, role }) => (
              <div key={name} className="border-t border-gold/20 pt-6">
                <p className="font-display text-base text-onyx/65 italic leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <div className="font-sans text-[10px] tracking-regal uppercase text-onyx/50">{name}</div>
                  <div className="font-sans text-[10px] text-onyx/30 mt-0.5">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophie ── */}
      <section className="py-24 px-6 bg-onyx/[0.025] border-t border-onyx/6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.philosophy.eyebrow}</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-8 font-light">
            {t.philosophy.heading}
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mb-10" />
          <p className="font-display text-xl md:text-2xl text-onyx/60 italic leading-relaxed mb-14">
            {t.philosophy.body}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {t.philosophy.points.map(({ label, body }) => (
              <div key={label} className="border-l-2 border-gold/30 pl-5">
                <div className="font-sans text-[10px] tracking-regal uppercase text-gold mb-2">{label}</div>
                <p className="font-display text-sm text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.steps.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              {t.steps.heading}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {t.steps.items.map(({ n, title, body }) => (
              <div key={n}>
                <div className="font-display text-7xl font-light text-gold/12 leading-none mb-4">{n}</div>
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-onyx mb-3">{title}</h3>
                <p className="font-display text-base text-onyx/55 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bald: Fotos & Social ── */}
      <section className="py-28 px-6 bg-onyx text-parchment">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.soon.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 mb-6 font-light">
              {t.soon.heading}
            </h2>
            <p className="font-display text-xl text-parchment/55 italic max-w-2xl mx-auto">
              {t.soon.sub}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {t.soon.items.map(({ title, body }) => (
              <div key={title} className="border border-parchment/10 p-7">
                <div className="w-4 h-px bg-gold/50 mb-5" />
                <h3 className="font-sans text-[11px] tracking-regal uppercase text-parchment mb-3">{title}</h3>
                <p className="font-display text-sm text-parchment/45 italic leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preise ── */}
      <section id="preise" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.pricing.eyebrow}</span>
            <h2 className="font-display text-4xl md:text-5xl mt-6 font-light">
              {t.pricing.heading}
            </h2>
            <p className="font-sans text-sm text-onyx/40 mt-4">{t.pricing.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(({ name, price, sub, badge, features, cta, plan, accent }) => (
              <div
                key={name}
                className={`border p-8 flex flex-col ${
                  accent ? "border-gold bg-onyx text-parchment" : "border-onyx/10"
                }`}
              >
                {badge && (
                  <div className={`font-sans text-[9px] tracking-regal uppercase border px-2 py-1 self-start mb-4 ${accent ? "text-gold border-gold/40" : "text-onyx/40 border-onyx/20"}`}>
                    {badge}
                  </div>
                )}
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-5 ${accent ? "text-gold" : "text-onyx/35"}`}>
                  {name}
                </div>
                <div className={`font-display text-5xl font-light mb-1 ${accent ? "text-parchment" : "text-onyx"}`}>
                  {price}
                </div>
                <div className={`font-sans text-[10px] tracking-regal uppercase mb-8 ${accent ? "text-parchment/35" : "text-onyx/28"}`}>
                  {sub}
                </div>
                <ul className="flex-1 space-y-3 mb-10">
                  {(features as readonly string[]).map((f) => (
                    <li key={f} className={`font-sans text-xs flex items-start gap-2 ${accent ? "text-parchment/65" : "text-onyx/55"}`}>
                      <span className="text-gold mt-0.5 shrink-0">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/?plan=${plan}#kontakt`}
                  className={`font-sans text-[11px] tracking-regal uppercase py-3 text-center transition-colors duration-300 ${
                    accent
                      ? "bg-gold text-onyx hover:bg-gold/80"
                      : "border border-onyx/15 text-onyx/50 hover:border-gold hover:text-gold"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center font-sans text-[10px] text-onyx/25 mt-8 tracking-wide uppercase">
            {t.pricing.disclaimer}
          </p>
        </div>
      </section>

      {/* ── Kontakt ── */}
      <section id="kontakt" className="py-32 px-6 bg-onyx text-parchment">
        <div className="max-w-xl mx-auto text-center">
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">{t.contact.eyebrow}</span>
          <h2 className="font-display text-4xl md:text-5xl mt-6 mb-4 font-light">
            {t.contact.heading}
          </h2>
          <div className="w-12 h-px bg-gold/40 mx-auto mb-4" />
          <p className="font-display text-lg text-parchment/50 italic mb-12">
            {t.contact.body}
          </p>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-parchment/10" />
            <a
              href="https://wa.me/4367764292055"
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[10px] tracking-regal uppercase text-parchment/25 hover:text-gold transition-colors"
            >
              {t.contact.whatsapp}
            </a>
            <div className="w-8 h-px bg-parchment/10" />
          </div>
          <Link
            href="/admin"
            className="mt-16 inline-block font-sans text-[10px] tracking-regal uppercase text-parchment/20 border-b border-parchment/10 pb-1 hover:text-gold hover:border-gold transition-colors"
          >
            {t.contact.adminLink}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-parchment/8 bg-onyx">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-[10px] tracking-regal uppercase text-parchment/20">
            © {new Date().getFullYear()} ORIZ · {t.footer.copy}
          </p>
          <div className="flex gap-6">
            {t.footer.nav.map(({ href, label }) => (
              <a key={href} href={href} className="font-sans text-[10px] tracking-regal uppercase text-parchment/20 hover:text-gold transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 mt-4 flex justify-center sm:justify-end">
          <LegalLinks />
        </div>
      </footer>

    </main>
  );
}

export default function Landing() {
  return (
    <LocaleProvider>
      <LanguageSwitcher />
      <LandingContent />
    </LocaleProvider>
  );
}
