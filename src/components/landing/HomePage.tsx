import Link from "next/link";
import { LegalLinks } from "@/components/landing/LegalLinks";
import { SITE_URL } from "@/lib/site";
import { SETUP_PRICE, type HomeCopy } from "@/lib/home-copy";
import { jsonLdScript } from "@/lib/seo";

// Main page layout, shared by the German (/) and English (/en) versions: only the texts differ.
// The earlier three-product page is kept in src/legacy/home-umbrella-page.tsx
// (and at the git tag homepage-umbrella-2026-10-22) in case it has to come back.

const container = "mx-auto w-full max-w-6xl px-5 md:px-8";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-onyx";
const btnPrimary = `inline-flex min-h-14 items-center justify-center bg-gold px-8 text-lg font-semibold text-onyx transition hover:brightness-95 ${focus}`;
const btnGhost = `inline-flex min-h-14 items-center justify-center border-2 border-onyx/80 px-8 text-lg font-semibold text-onyx transition hover:bg-onyx hover:text-parchment ${focus}`;
const eyebrow = "text-sm font-semibold uppercase tracking-[0.16em] text-[#7A5C14]";
const h2 = "font-display text-4xl font-medium leading-[1.1] md:text-5xl";

function Phone({ title }: { title: string }) {
  return (
    <div className="mx-auto w-[310px] shrink-0 bg-onyx p-[10px] shadow-[0_30px_80px_-20px_rgba(10,10,10,0.45)]">
      <div className="relative h-[600px] w-[290px] overflow-hidden bg-white">
        <iframe
          title={title}
          src="/belvedere"
          loading="lazy"
          className="absolute left-0 top-0 h-[807px] w-[390px] origin-top-left border-0"
          style={{ transform: "scale(0.7436)" }}
        />
      </div>
    </div>
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
        email: "office@oriz.at",
        telephone: "+43 677 64292055",
        address: { "@type": "PostalAddress", streetAddress: "Tscherttegasse 39", postalCode: "1120", addressLocality: "Wien", addressCountry: "AT" },
      },
      {
        "@type": "SoftwareApplication",
        name: "ORIZ Carta",
        url: `${SITE_URL}${c.path}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: c.jsonLd.inLanguage,
        description: c.jsonLd.description,
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
  const price = SETUP_PRICE?.[c.lang];
  return (
    // lang on the wrapper: the document itself is declared German in the root layout.
    <div lang={c.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData(c)) }} />
      <a href="#inhalt" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-onyx focus:px-5 focus:py-3 focus:text-parchment ${focus}`}>
        {c.skip}
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-onyx/10 bg-parchment/95 backdrop-blur">
        <div className={`${container} flex h-[72px] items-center justify-between gap-4`}>
          <Link href={c.path} className={`inline-flex min-h-11 items-center ${focus}`} aria-label={c.homeLabel}>
            {/* 500×150 SVG: mark left, name right */}
            <img src="/brand/oriz-horizontal.svg" alt="ORIZ" width={167} height={50} className="h-10 w-auto sm:h-[50px]" />
          </Link>
          <nav aria-label={c.navLabel} className="hidden items-center gap-8 text-base font-medium md:flex">
            <a href="#funktionen" className={`hover:underline ${focus}`}>{c.nav.features}</a>
            <a href="#ablauf" className={`hover:underline ${focus}`}>{c.nav.steps}</a>
            <a href="#faq" className={`hover:underline ${focus}`}>{c.nav.faq}</a>
            <Link href="/admin/login" className={`hover:underline ${focus}`}>{c.nav.login}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={c.switcher.href}
              hrefLang={c.switcher.hrefLang}
              lang={c.switcher.hrefLang}
              aria-label={c.switcher.ariaLabel}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center border border-onyx/25 px-3 text-sm font-semibold ${focus}`}
            >
              {c.switcher.label}
            </Link>
            <Link href="/registrieren" className={`inline-flex min-h-11 items-center bg-onyx px-5 text-base font-semibold text-parchment ${focus}`}>
              {c.headerCta}
            </Link>
          </div>
        </div>
      </header>

      <main id="inhalt" className="text-onyx">
        {/* ══ Hero ══ */}
        <section className="overflow-hidden pb-16 pt-12 md:pb-24 md:pt-20">
          <div className={`${container} grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]`}>
            <div>
              <p className={eyebrow}>{c.hero.eyebrow}</p>
              <h1 className="mt-5 font-display text-[2.9rem] font-medium leading-[1.04] sm:text-6xl lg:text-7xl">
                {c.hero.h1[0]}
                <br />
                {c.hero.h1[1]}
                <br />
                <span className="text-[#7A5C14]">{c.hero.h1[2]}</span>
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-relaxed text-onyx/80">{c.hero.lead}</p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link href="/registrieren" className={btnPrimary}>{c.hero.ctaPrimary}</Link>
                <a href="#demo" className={btnGhost}>{c.hero.ctaDemo}</a>
              </div>
              <p className="mt-6 text-base text-onyx/70">{c.hero.note}</p>
              {c.hero.langNote && <p className="mt-2 text-base text-onyx/70">{c.hero.langNote}</p>}
            </div>

            <div id="demo" className="scroll-mt-28">
              <Phone title={c.hero.demoTitle} />
              <p className="mt-5 text-center text-base text-onyx/70">
                {c.hero.demoCaption}{" "}
                <Link href="/belvedere" target="_blank" className={`font-semibold underline underline-offset-4 ${focus}`}>{c.hero.demoFull}</Link>
              </p>
            </div>
          </div>
        </section>

        {/* ══ Facts ══ */}
        <section aria-label={c.factsLabel} className="border-y border-onyx/10 bg-white/60">
          <dl className={`${container} grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-4`}>
            {c.facts.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-display text-6xl font-medium leading-none text-[#7A5C14]">{f.big}</span>
                  <span className="mt-2 block text-lg font-semibold">{f.label}</span>
                  <span className="mt-1 block text-base leading-snug text-onyx/70">{f.body}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ══ Problem ══ */}
        <section className="bg-onyx py-20 text-parchment md:py-28">
          <div className={container}>
            <h2 className={`${h2} max-w-3xl`}>{c.painsHeading}</h2>
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {c.pains.map((p) => (
                <li key={p.title} className="border border-parchment/15 p-7">
                  <h3 className="text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-parchment/75">{p.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 font-display text-3xl italic text-gold md:text-4xl">{c.painsClosing}</p>
          </div>
        </section>

        {/* ══ Features ══ */}
        <section id="funktionen" className="scroll-mt-20 py-20 md:py-28">
          <div className={container}>
            <p className={eyebrow}>{c.featuresEyebrow}</p>
            <h2 className={`${h2} mt-4 max-w-3xl`}>{c.featuresHeading}</h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.features.map((f) => (
                <li key={f.title} className="border-t-2 border-onyx bg-white p-7 shadow-sm ring-1 ring-onyx/10">
                  <h3 className="font-display text-2xl font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-onyx/75">{f.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg text-onyx/70">{c.featuresTv}</p>
          </div>
        </section>

        {/* ══ Steps ══ */}
        <section id="ablauf" className="scroll-mt-20 bg-white/60 py-20 md:py-28">
          <div className={container}>
            <p className={eyebrow}>{c.stepsEyebrow}</p>
            <h2 className={`${h2} mt-4 max-w-3xl`}>{c.stepsHeading}</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {c.steps.map((s) => (
                <li key={s.n} className="border-t-2 border-onyx pt-6">
                  <span className="font-display text-5xl font-medium text-[#7A5C14]" aria-hidden>{s.n}</span>
                  <h3 className="mt-3 text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-onyx/75">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12"><Link href="/registrieren" className={btnPrimary}>{c.stepsCta}</Link></div>
          </div>
        </section>

        {/* ══ Done-for-you ══ */}
        <section className="py-20 md:py-28">
          <div className={container}>
            <div className="bg-onyx p-8 text-parchment md:p-14">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">{c.done.eyebrow}</p>
              <h2 className={`${h2} mt-4 max-w-3xl`}>{c.done.heading}</h2>
              <p className="mt-6 max-w-2xl text-xl leading-relaxed text-parchment/80">{c.done.body}</p>
              <p className="mt-4 text-lg text-parchment/70">
                {price ? `${price} · ` : ""}{c.done.note}
              </p>
              <div className="mt-8"><Link href="/registrieren" className={btnPrimary}>{c.done.cta}</Link></div>
            </div>
          </div>
        </section>

        {/* ══ Who ══ */}
        <section className="pb-20 md:pb-28">
          <div className={container}>
            <h2 className={`${h2} max-w-3xl`}>{c.whoHeading}</h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {c.venues.map((v) => (
                <li key={v} className="border-2 border-onyx/15 bg-white px-6 py-3 text-lg font-medium">{v}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="scroll-mt-20 bg-white/60 py-20 md:py-28">
          <div className={`${container} max-w-3xl`}>
            <p className={eyebrow}>{c.faqEyebrow}</p>
            <h2 className={`${h2} mt-4`}>{c.faqHeading}</h2>
            <div className="mt-10 divide-y divide-onyx/15 border-y border-onyx/15">
              {c.faq.map((f) => (
                <details key={f.q} className="group py-2">
                  <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold ${focus}`}>
                    {f.q}
                    <span aria-hidden className="shrink-0 text-3xl font-light leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-5 pr-8 text-lg leading-relaxed text-onyx/80">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Final CTA ══ */}
        <section className="py-20 text-center md:py-28">
          <div className={`${container} max-w-3xl`}>
            <h2 className={h2}>{c.final.heading}</h2>
            <p className="mt-6 text-xl text-onyx/75">{c.final.body}</p>
            <div className="mt-9"><Link href="/registrieren" className={btnPrimary}>{c.final.cta}</Link></div>
            <p className="mt-8 text-lg text-onyx/75">
              {c.final.questions} <a className={`font-semibold underline underline-offset-4 ${focus}`} href="mailto:office@oriz.at">office@oriz.at</a> {c.final.or}{" "}
              <a className={`font-semibold underline underline-offset-4 ${focus}`} href="tel:+4367764292055">+43 677 64292055</a>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-onyx py-12 text-parchment">
        <div className={`${container} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
          <div>
            <img src="/brand/oriz-horizontal-dark.svg" alt="ORIZ" width={200} height={60} className="h-[60px] w-auto" />
            <p className="mt-3 text-base text-parchment/70">{c.footer.tagline}</p>
          </div>
          <nav aria-label={c.footer.label} className="flex flex-wrap items-center gap-x-8 gap-y-1 text-base">
            <Link href="/carta" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>{c.footer.pricing}</Link>
            <Link href="/admin/login" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>{c.footer.login}</Link>
            <div className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:!text-base [&_a]:!normal-case [&_a]:!tracking-normal [&_a]:!text-parchment [&_a:hover]:underline">
              <LegalLinks />
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
