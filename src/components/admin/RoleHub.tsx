import Link from "next/link";
import { SignOutButton } from "@/components/admin/SignOutButton";

type Props = {
  user: string;
  carta: { slug: string }[];
  casa: { slug: string }[];
};

// Owner hub shown when the logged-in user owns BOTH a Carta venue and
// a Casa property (and isn't super admin). Lets them pick which to edit.
export function RoleHub({ user, carta, casa }: Props) {
  return (
    <main className="min-h-screen bg-parchment text-onyx flex flex-col">
      <header className="border-b border-onyx/8 px-6 py-5 flex items-center justify-between">
        <div>
          <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
            ORIZ · Mein Bereich
          </span>
          <h1 className="font-display text-2xl font-light mt-1">{user}</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl">
          <p className="text-center font-display italic text-onyx/55 text-lg mb-12">
            Was möchten Sie heute bearbeiten?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {carta.map((v) => (
              <Link
                key={v.slug}
                href="/admin"
                className="group block bg-onyx text-parchment p-10 transition-transform hover:-translate-y-1"
              >
                <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
                  Carta
                </span>
                <h2 className="font-display text-2xl mt-3 mb-6 font-light">
                  Digitale Speisekarte
                </h2>
                <div className="w-10 h-px bg-gold/40 mb-5 transition-all group-hover:w-full group-hover:bg-gold/80" />
                <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/50">
                  /{v.slug} →
                </span>
              </Link>
            ))}

            {casa.map((p) => (
              <Link
                key={p.slug}
                href={`/admin/casa/${p.slug}`}
                className="group block bg-onyx text-parchment p-10 transition-transform hover:-translate-y-1"
              >
                <span className="font-sans text-[10px] tracking-regal uppercase text-gold">
                  Casa
                </span>
                <h2 className="font-display text-2xl mt-3 mb-6 font-light">
                  Digitale Begrüßungskarte
                </h2>
                <div className="w-10 h-px bg-gold/40 mb-5 transition-all group-hover:w-full group-hover:bg-gold/80" />
                <span className="font-sans text-[10px] tracking-regal uppercase text-parchment/50">
                  /casa/{p.slug} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
