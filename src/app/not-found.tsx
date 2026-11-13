import Link from "next/link";

export const metadata = { title: "Seite nicht gefunden | ORIZ", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/oriz-horizontal.svg" alt="ORIZ" className="h-9 w-auto" />
      <h1 className="mt-8 font-display text-4xl font-medium text-onyx">Diese Seite gibt es nicht.</h1>
      <p className="mt-3 max-w-sm text-lg text-onyx/75">Vielleicht ist die Adresse falsch geschrieben oder die Seite wurde verschoben.</p>
      <Link href="/" className="mt-8 inline-flex min-h-14 items-center rounded-xl bg-onyx px-7 text-lg font-semibold text-parchment">
        Zur Startseite
      </Link>
    </main>
  );
}
