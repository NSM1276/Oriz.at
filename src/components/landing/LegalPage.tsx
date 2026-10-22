import Link from "next/link";

// Plain, readable shell for the legal pages (/impressum, /datenschutz).
// Server component; text lives in the page files so it can be edited in one place.

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-onyx";

export type LegalSection = { heading: string; paragraphs: string[] };

export function LegalPage({
  title,
  intro,
  sections,
  updated,
}: {
  title: string;
  intro?: string;
  sections: LegalSection[];
  updated: string;
}) {
  return (
    <>
      <header className="border-b border-onyx/10 bg-parchment">
        <div className="mx-auto flex h-[72px] w-full max-w-3xl items-center justify-between px-5 md:px-8">
          <Link href="/" className={`inline-flex min-h-11 items-center ${focus}`} aria-label="ORIZ — Startseite">
            <img src="/brand/oriz-horizontal.svg" alt="ORIZ" width={167} height={50} className="h-10 w-auto" />
          </Link>
          <Link href="/" className={`inline-flex min-h-11 items-center text-base font-medium hover:underline ${focus}`}>
            Zur Startseite
          </Link>
        </div>
      </header>

      <main className="bg-parchment text-onyx">
        <article className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8 md:py-20">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{title}</h1>
          {intro && <p className="mt-6 text-lg leading-relaxed text-onyx/80">{intro}</p>}

          <div className="mt-12 space-y-10">
            {sections.map(({ heading, paragraphs }) => (
              <section key={heading}>
                <h2 className="font-display text-2xl font-medium md:text-3xl">{heading}</h2>
                {paragraphs.map((p) => (
                  <p key={p} className="mt-3 whitespace-pre-line text-lg leading-relaxed text-onyx/85">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-16 text-base text-onyx/60">Stand: {updated}</p>
        </article>
      </main>

      <footer className="bg-onyx py-10 text-parchment">
        <nav
          aria-label="Fußzeile"
          className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-8 gap-y-1 px-5 text-base md:px-8"
        >
          <Link href="/impressum" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>Impressum</Link>
          <Link href="/datenschutz" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>Datenschutz</Link>
          <Link href="/" className={`inline-flex min-h-11 items-center hover:underline ${focus}`}>ORIZ Carta</Link>
        </nav>
      </footer>
    </>
  );
}
