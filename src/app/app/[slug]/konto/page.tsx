import Link from "next/link";
import { PLAN_PRICE_EUR, UPGRADE_MAIL, allowedLocales, upgradeMailto } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { LOCALE_NAMES, MENU_LOCALES, PACKAGE_LOCALES } from "@/lib/locales";
import { whatsappUrl } from "@/lib/contact-info";
import { requireUser, requireVenue } from "../../venue";
import { AccountForms } from "./AccountForms";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric" });

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ gesperrt?: string }> }) {
  const { slug } = await params;
  const { gesperrt } = await searchParams;
  const { venue, venueCount } = await requireVenue(slug);
  const user = await requireUser(`/app/${slug}/konto`);
  const ent = await getEntitlements(venue.id);

  const current = ent.tier === "pro" || ent.tier === "trial" ? "pro" : "starter";
  const plans = [
    { id: "starter", name: "Starter", body: "Alles für ein Lokal: Karte mit unbegrenzten Gerichten, Aussehen, Allergene, QR-Codes für die Tische, Service-Ruf und Druck-PDF." },
    { id: "pro", name: "Pro", body: "Alles aus Starter, dazu bis zu fünf Karten (z. B. Mittag, Abend, Getränke), Druck-Design (Ihre Farben, Ihr Logo, Blatt für Blatt nachdrucken) und Screen (Ihre Karte auf dem Fernseher)." },
  ] as const;
  const packageNames = PACKAGE_LOCALES.map((l) => LOCALE_NAMES[l]).join(", ");
  const extraCount = MENU_LOCALES.length - PACKAGE_LOCALES.length;
  const allowed = allowedLocales(ent);

  const order = (what: string) => upgradeMailto(venue.name, `${what} für ${venue.name}`);
  const wa = (what: string) => whatsappUrl(`Hallo, ich möchte ${what} für ${venue.name} (oriz.at/${venue.slug}).`);

  return (
    <div className="space-y-4">
      {(ent.locked || gesperrt) && (
        <section className="rounded-2xl bg-stone-900 p-5 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Testphase beendet</p>
          <p className="mt-1 text-lg font-semibold">Ihre Karte bleibt für Gäste online.</p>
          <p className="mt-1 text-sm text-stone-300">
            Zum Weiterarbeiten — Gerichte ändern, Fotos, Tische, Service-Ruf — wählen Sie unten einen Tarif. Wir schalten ihn nach der Zahlung frei, meist am selben Tag.
          </p>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Ihr Tarif</p>
        <p className="mt-1 text-lg font-semibold">
          {ent.tier === "trial" ? "Testphase · alle Funktionen" : ent.label}
        </p>
        {ent.tier === "trial" && ent.trialEndsAt && (
          <p className="mt-0.5 text-sm text-stone-600">Kostenlos bis {dateFmt.format(ent.trialEndsAt)}. Danach wählen Sie Starter oder Pro.</p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const mine = p.id === current && ent.tier !== "trial" && !ent.locked;
            return (
              <div key={p.id} className={`flex flex-col rounded-xl p-4 ring-1 ${mine ? "bg-stone-50 ring-stone-900" : "ring-stone-200"}`}>
                <p className="font-semibold">
                  {p.name} <span className="font-normal text-stone-600">· {PLAN_PRICE_EUR[p.id]} € pro Monat</span>
                </p>
                <p className="mt-1 flex-1 text-sm text-stone-600">{p.body}</p>
                {mine ? (
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-700">Ihr Tarif</p>
                ) : (
                  <a href={order(`Tarif ${p.name}`)} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-white">
                    {p.name} wählen
                  </a>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-stone-500">Endpreise, keine Umsatzsteuer (Kleinunternehmerregelung). Monatlich kündbar.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Sprachen</p>
        <p className="mt-1 font-semibold">{ent.allLanguages ? "20+ Sprachen freigeschaltet" : "Deutsch + 4 Sprachen im Tarif"}</p>
        <p className="mt-1 text-sm text-stone-600">
          {ent.allLanguages
            ? `Sie können alle ${MENU_LOCALES.length} Sprachen für Ihre Karte einschalten. Welche gerade aktiv sind, stellen Sie unter „Speisekarte“ ein.`
            : `In jedem Tarif: Deutsch, ${packageNames}. Dieser Satz ist fest — dafür halten wir diese Sprachen besonders gut gepflegt.`}
        </p>
        {!ent.allLanguages && (
          <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
            <p className="text-sm font-medium">Zusatzpaket „20+ Sprachen“</p>
            <p className="mt-0.5 text-sm text-stone-600">
              Noch {extraCount} Sprachen dazu — von Polnisch und Türkisch bis Arabisch, Chinesisch und Japanisch. Preis auf Anfrage.
            </p>
            <a href={order("Zusatzpaket 20+ Sprachen")} className="mt-2 inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium ring-1 ring-stone-300">
              20+ Sprachen anfragen
            </a>
          </div>
        )}
        <p className="mt-3 text-xs text-stone-500">Aktiv möglich: {allowed.map((l) => LOCALE_NAMES[l]).join(", ")}.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">So bezahlen Sie</p>
        <ul className="mt-2 space-y-3 text-sm">
          <li>
            <p className="font-medium">Überweisung</p>
            <p className="text-stone-600">Sie bekommen eine Rechnung mit Bankverbindung per E-Mail. Nach Eingang schalten wir den Tarif frei.</p>
          </li>
          <li>
            <p className="font-medium">Persönlich</p>
            <p className="text-stone-600">
              In Wien kommen wir gern vorbei und richten alles mit Ihnen ein.{" "}
              <a href={wa("einen Termin vereinbaren")} target="_blank" rel="noreferrer" className="font-medium text-stone-900 underline">Termin per WhatsApp</a>
            </p>
          </li>
          <li>
            <p className="font-medium">Online mit Karte</p>
            <p className="text-stone-600">Kommt in Kürze. Bis dahin per Überweisung oder persönlich.</p>
          </li>
        </ul>
        <p className="mt-3 text-xs text-stone-500">
          Fragen zum Tarif: <a href={`mailto:${UPGRADE_MAIL}`} className="underline">{UPGRADE_MAIL}</a>
        </p>
      </section>

      <AccountForms email={user.email ?? ""} showVenues={venueCount > 1} />

      <p className="text-center text-sm text-stone-600">
        <Link href={`/app/${venue.slug}`} className="underline">Zurück zur Übersicht</Link>
      </p>
    </div>
  );
}
