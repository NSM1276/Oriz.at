import Link from "next/link";
import { LegalLinks } from "@/components/landing/LegalLinks";
import { whatsappUrl } from "@/lib/contact-info";
import type { HomeCopy } from "@/lib/home-copy";
import { PRICE_MONTH_CENTS } from "@/lib/offer";
import { PERSON, personName, phoneHref } from "@/lib/person";
import { jsonLdScript } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { venueUrl } from "@/lib/venue-host";

// Main page layout, shared by the German (/) and English (/en) versions: only the texts differ.
// Short on purpose: what it is, three steps, four reasons, one price, one person to talk to.
// There is no sign-up button — every call to action opens WhatsApp or the phone.
// Earlier versions: git tag homepage-umbrella-2026-10-22 and src/legacy/home-umbrella-page.tsx.

const DEMO = venueUrl("belvedere");

const container = "mx-auto w-full max-w-6xl px-5 md:px-8";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-onyx";
const btn = `inline-flex min-h-14 items-center justify-center gap-3 whitespace-nowrap px-7 text-xl font-semibold transition ${focus}`;
const btnPrimary = `${btn} bg-gold text-onyx hover:brightness-95`;
const btnGhost = `${btn} border-2 border-onyx text-onyx hover:bg-onyx hover:text-parchment`;
const eyebrow = "text-base font-semibold uppercase tracking-[0.16em] text-[#7A5C14]";
const h2 = "font-display text-4xl font-medium leading-[1.1] md:text-6xl";
const body = "text-xl leading-relaxed md:text-[22px]";

function Phone({ title }: { title: string }) {
  return (
    <div className="mx-auto w-[310px] shrink-0 bg-onyx p-[10px] shadow-[0_30px_80px_-20px_rgba(10,10,10,0.45)]">
      <div className="relative h-[600px] w-[290px] overflow-hidden bg-white">
        <iframe
          title={title}
          src="/belvedere" // same site, so it also shows on a local copy; the proxy leaves framed pages where they are
          loading="lazy"
          className="absolute left-0 top-0 h-[807px] w-[390px] origin-top-left border-0"
          style={{ transform: "scale(0.7436)" }}
        />
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z" />
    </svg>
  );
}

function structuredData(c: HomeCopy) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "ORIZ",
        url: SITE_URL,
        email: PERSON.email,
        telephone: PERSON.phone,
        address: { "@type": "PostalAddress", streetAddress: "Tscherttegasse 39", postalCode: "1120", addressLocality: "Wien", addressCountry: "AT" },
      },
      {
        "@type": "SoftwareApplication",
        name: "ORIZ",
        url: `${SITE_URL}${c.path === "/" ? "" : c.path}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: c.jsonLd.inLanguage,
        description: c.jsonLd.description,
        offers: { "@type": "Offer", price: (PRICE_MONTH_CENTS / 100).toFixed(2), priceCurrency: "EUR" },
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "FAQPage",
        inLanguage: c.lang,
        mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

export function HomePage({ c }: { c: HomeCopy }) {
  const whatsapp = whatsappUrl(c.whatsappText);
  return (
    // lang on the wrapper: the document itself is declared German in the root layout.
    <div lang={c.lang} className="bg-parchment text-onyx">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData(c)) }} />
      <a href="#inhalt" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-onyx focus:px-5 focus:py-3 focus:text-parchment ${focus}`}>
        {c.skip}
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-onyx/10 bg-parchment/95 backdrop-blur">
        <div className={`${container} flex h-[72px] items-center justify-between gap-4`}>
          <Link href={c.path} className={`inline-flex min-h-11 items-center ${focus}`} aria-label={c.homeLabel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/oriz-horizontal.svg" alt="ORIZ" width={167} height={50} className="h-10 w-auto sm:h-[50px]" />
          </Link>
          <nav aria-label={c.navLabel} className="hidden items-center gap-9 text-lg font-medium md:flex">
            <a href="#ablauf" className={`hover:underline ${focus}`}>{c.nav.steps}</a>
            <a href="#preis" className={`hover:underline ${focus}`}>{c.nav.price}</a>
            <a href="#faq" className={`hover:underline ${focus}`}>{c.nav.faq}</a>
            <Link href="/admin/login" className={`hover:underline ${focus}`}>{c.nav.login}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={c.switcher.href}
              hrefLang={c.switcher.hrefLang}
              lang={c.switcher.hrefLang}
              aria-label={c.switcher.ariaLabel}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center border border-onyx/25 px-3 text-base font-semibold ${focus}`}
            >
              {c.switcher.label}
            </Link>
            <a href={whatsapp} className={`inline-flex min-h-11 items-center gap-2 bg-onyx px-5 text-lg font-semibold text-parchment ${focus}`}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main id="inhalt">
        {/* ══ Hero ══ */}
        <section className="overflow-hidden pb-16 pt-12 md:pb-24 md:pt-20">
          <div className={`${container} grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]`}>
            <div>
              <p className={eyebrow}>{c.hero.eyebrow}</p>
              <h1 className="mt-5 font-display text-[2.9rem] font-medium leading-[1.04] sm:text-6xl">
                {c.hero.h1[0]}
                <br />
                {c.hero.h1[1]}
                <br />
                <span className="text-[#7A5C14]">{c.hero.h1[2]}</span>
              </h1>
              <p className={`mt-7 max-w-xl ${body}`}>{c.hero.lead}</p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <a href={whatsapp} className={btnPrimary}>
                  <WhatsAppIcon /> {c.contact.whatsapp}
                </a>
                <a href="#demo" className={btnGhost}>{c.hero.ctaDemo}</a>
              </div>
              <p className="mt-6 text-lg text-onyx/75">{c.hero.note}</p>
              {c.hero.langNote && <p className="mt-2 text-lg text-onyx/75">{c.hero.langNote}</p>}
            </div>

            <div id="demo" className="scroll-mt-28">
              <Phone title={c.hero.demoTitle} />
              <p className="mt-5 text-center text-lg text-onyx/75">
                {c.hero.demoCaption}{" "}
                <a href={DEMO} target="_blank" rel="noopener" className={`font-semibold underline underline-offset-4 ${focus}`}>{c.hero.demoFull}</a>
              </p>
            </div>
          </div>
        </section>

        {/* ══ Steps ══ */}
        <section id="ablauf" className="scroll-mt-20 bg-white/70 py-16 md:py-24">
          <div className={container}>
            <h2 className={h2}>{c.stepsHeading}</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {c.steps.map((s, i) => (
                <li key={s.title} className="border-t-2 border-onyx pt-6">
                  <span className="font-display text-7xl font-medium leading-none text-[#7A5C14]" aria-hidden>{i + 1}</span>
                  <h3 className="mt-4 text-2xl font-semibold md:text-3xl">{s.title}</h3>
                  <p className={`mt-3 ${body}`}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ══ Reasons ══ */}
        <section className="bg-onyx py-16 text-parchment md:py-24">
          <div className={container}>
            <h2 className={h2}>{c.reasonsHeading}</h2>
            <ul className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {c.reasons.map((r) => (
                <li key={r.title} className="border-t border-parchment/25 pt-6">
                  <h3 className="font-display text-3xl font-medium leading-snug text-gold md:text-4xl">{r.title}</h3>
                  <p className={`mt-3 ${body} text-parchment/90`}>{r.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ Price ══ */}
        <section id="preis" className="scroll-mt-20 py-16 md:py-24">
          <div className={`${container} grid gap-12 lg:grid-cols-2 lg:items-start`}>
            <div>
              <p className={eyebrow}>{c.price.eyebrow}</p>
              <h2 className={`${h2} mt-4`}>{c.price.heading}</h2>
              <p className="mt-8 font-display text-5xl font-medium leading-tight md:text-7xl">{c.price.month}</p>
              <p className="mt-2 font-display text-3xl text-[#7A5C14] md:text-4xl">{c.price.year}</p>
              <p className={`mt-6 ${body}`}>{c.price.trial}</p>
              <div className="mt-8">
                <a href={whatsapp} className={btnPrimary}>
                  <WhatsAppIcon /> {c.contact.whatsapp}
                </a>
              </div>
              <p className="mt-5 text-base text-onyx/70">{c.price.note}</p>
            </div>
            <div className="bg-white p-7 ring-1 ring-onyx/10 md:p-10">
              <h3 className={eyebrow}>{c.price.includedLabel}</h3>
              <ul className="mt-4 space-y-3">
                {c.price.included.map((t) => (
                  <li key={t} className={`flex gap-3 ${body}`}>
                    <span className="font-semibold text-[#7A5C14]" aria-hidden>✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <h3 className={`${eyebrow} mt-9`}>{c.price.extraLabel}</h3>
              <ul className="mt-4 space-y-3">
                {c.price.extra.map((t) => (
                  <li key={t} className={`flex gap-3 ${body}`}>
                    <span className="font-semibold text-[#7A5C14]" aria-hidden>+</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══ Person ══ */}
        <section id="kontakt" className="scroll-mt-20 bg-white/70 py-16 md:py-24">
          <div className={`${container} max-w-4xl`}>
            <p className={eyebrow}>{c.person.eyebrow}</p>
            <h2 className={`${h2} mt-4`}>{c.person.heading}</h2>
            <div className="mt-10 flex items-center gap-5">
              {PERSON.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={PERSON.photo} alt={personName} className="h-24 w-24 shrink-0 rounded-full object-cover md:h-28 md:w-28" />
              ) : (
                <span className="grid h-24 w-24 md:h-28 md:w-28 shrink-0 place-items-center rounded-2xl bg-onyx p-4" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/oriz-mark-dark.svg" alt="" className="h-full w-full" />
            </span>
              )}
              <p>
                <span className="block font-display text-3xl font-medium md:text-4xl">{personName}</span>
                <span className="block text-xl text-onyx/75">{c.person.role}</span>
              </p>
            </div>
            <p className={`mt-8 max-w-2xl ${body}`}>{c.person.body}</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a href={whatsapp} className={btnPrimary}>
                <WhatsAppIcon /> {c.contact.whatsapp}
              </a>
              <a href={phoneHref} className={btnGhost}>
                {c.contact.call}: {PERSON.phone}
              </a>
            </div>
            <p className="mt-6 text-xl">
              {c.contact.mail}:{" "}
              <a href={`mailto:${PERSON.email}`} className={`font-semibold underline underline-offset-4 ${focus}`}>{PERSON.email}</a>
            </p>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="scroll-mt-20 py-16 md:py-24">
          <div className={`${container} max-w-4xl`}>
            <h2 className={h2}>{c.faqHeading}</h2>
            <div className="mt-10 divide-y divide-onyx/15 border-y border-onyx/15">
              {c.faq.map((f) => (
                <details key={f.q} className="group py-2">
                  <summary className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold md:text-2xl ${focus}`}>
                    {f.q}
                    <span aria-hidden className="shrink-0 text-4xl font-light leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className={`pb-6 pr-8 ${body}`}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-onyx py-12 text-parchment">
        <div className={`${container} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/oriz-horizontal-dark.svg" alt="ORIZ" width={200} height={60} className="h-[60px] w-auto" />
            <p className="mt-3 text-lg text-parchment/75">{c.footer.tagline}</p>
          </div>
          <nav aria-label={c.footer.label} className="flex flex-wrap items-center gap-x-8 gap-y-1 text-lg">
            <Link href="/admin/login" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>{c.footer.login}</Link>
            <div className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:!text-lg [&_a]:!normal-case [&_a]:!tracking-normal [&_a]:!text-parchment [&_a:hover]:underline">
              <LegalLinks />
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
