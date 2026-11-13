import Link from "next/link";
import { UPGRADE_MAIL, allowedLocales, upgradeMailto } from "@/lib/entitlements";
import { PRICE_MONTH, PRICE_YEAR } from "@/lib/offer";
import { getEntitlements } from "@/lib/entitlements-server";
import { LOCALE_NAMES, MENU_LOCALES, PACKAGE_LOCALES } from "@/lib/locales";
import { whatsappUrl } from "@/lib/contact-info";
import { requireUser, requireVenue } from "../../venue";
import { AccountForms } from "./AccountForms";
import { venueHost } from "@/lib/venue-host";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric" });

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ gesperrt?: string }> }) {
  const { slug } = await params;
  const { gesperrt } = await searchParams;
  const { venue, venueCount } = await requireVenue(slug);
  const user = await requireUser(`/app/${slug}/konto`);
  const ent = await getEntitlements(venue.id);

  // One plan: a running subscription is "paid", a trial or a closed admin still has to choose.
  const paid = ent.tier !== "trial" && !ent.locked;
  const packageNames = PACKAGE_LOCALES.map((l) => LOCALE_NAMES[l]).join(", ");
  const extraCount = MENU_LOCALES.length - PACKAGE_LOCALES.length;
  const allowed = allowedLocales(ent);

  const order = (what: string) => upgradeMailto(venue.name, `${what} für ${venue.name}`);
  const wa = (what: string) => whatsappUrl(`Hallo, ich möchte ${what} für ${venue.name} (${venueHost(venue.slug)}).`);

  return (
    <div className="space-y-4">
      {(ent.locked || gesperrt) && (
        <section className="rounded-2xl bg-onyx p-5 text-parchment">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Testphase beendet</p>
          <p className="mt-1 text-lg font-semibold">Ihre Karte bleibt für Gäste online.</p>
          <p className="mt-1 text-base text-parchment/75">
            Zum Weiterarbeiten — Gerichte ändern, Fotos, Tische, Service-Ruf — bestellen Sie unten das Abo. Wir schalten es nach der Zahlung frei, meist am selben Tag.
          </p>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
        <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">Ihr Abo</p>
        <p className="mt-1 text-lg font-semibold">
          {ent.tier === "trial" ? "Testphase · alle Funktionen" : ent.locked ? "Kein Abo" : "ORIZ · alle Funktionen"}
        </p>
        {ent.tier === "trial" && ent.trialEndsAt && (
          <p className="mt-0.5 text-base text-onyx/70">Kostenlos bis {dateFmt.format(ent.trialEndsAt)}.</p>
        )}

        <div className={`mt-4 rounded-xl p-4 ring-1 ${paid ? "bg-onyx/[0.03] ring-onyx" : "ring-onyx/10"}`}>
          <p className="font-display text-3xl font-medium leading-tight">{PRICE_MONTH} <span className="font-sans text-base font-normal text-onyx/70">im Monat</span></p>
          <p className="text-base text-onyx/70">oder {PRICE_YEAR} im Jahr</p>
          <p className="mt-2 text-base text-onyx/70">
            Alles dabei: beliebig viele Gerichte und Fotos, mehrere Karten (z. B. Mittag, Abend, Getränke), QR-Codes für die Tische, Service-Ruf, Druck-PDF und Druck-Design.
          </p>
          {paid ? (
            <p className="mt-3 text-sm font-medium uppercase tracking-wide text-onyx/80">Ihr Abo läuft</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={wa("das Abo bestellen")} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-onyx px-4 text-base font-medium text-parchment">
                Per WhatsApp bestellen
              </a>
              <a href={order("Abo")} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-base font-medium ring-1 ring-onyx/20">
                Per E-Mail
              </a>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-onyx/60">Endpreise, keine Umsatzsteuer (Kleinunternehmerregelung). Monatlich kündbar.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
        <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">Sprachen</p>
        <p className="mt-1 font-semibold">{ent.allLanguages ? "20+ Sprachen freigeschaltet" : "Deutsch + 4 Sprachen im Abo"}</p>
        <p className="mt-1 text-base text-onyx/70">
          {ent.allLanguages
            ? `Sie können alle ${MENU_LOCALES.length} Sprachen für Ihre Karte einschalten. Welche gerade aktiv sind, stellen Sie unter „Speisekarte“ ein.`
            : `Im Abo: Deutsch, ${packageNames}. Dieser Satz ist fest — dafür halten wir diese Sprachen besonders gut gepflegt.`}
        </p>
        {!ent.allLanguages && (
          <div className="mt-3 rounded-xl bg-onyx/[0.03] p-3 ring-1 ring-onyx/10">
            <p className="text-base font-medium">Zusatzpaket „20+ Sprachen“</p>
            <p className="mt-0.5 text-base text-onyx/70">
              Noch {extraCount} Sprachen dazu — von Polnisch und Türkisch bis Arabisch, Chinesisch und Japanisch. Preis auf Anfrage.
            </p>
            <a href={order("Zusatzpaket 20+ Sprachen")} className="mt-2 inline-flex min-h-10 items-center rounded-xl px-3 text-base font-medium ring-1 ring-onyx/20">
              20+ Sprachen anfragen
            </a>
          </div>
        )}
        <p className="mt-3 text-sm text-onyx/60">Aktiv möglich: {allowed.map((l) => LOCALE_NAMES[l]).join(", ")}.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-onyx/10">
        <p className="text-sm font-medium uppercase tracking-widest text-onyx/60">So bezahlen Sie</p>
        <ul className="mt-2 space-y-3 text-base">
          <li>
            <p className="font-medium">Überweisung</p>
            <p className="text-onyx/70">Sie bekommen eine Rechnung mit Bankverbindung per E-Mail. Nach Eingang schalten wir das Abo frei.</p>
          </li>
          <li>
            <p className="font-medium">Persönlich</p>
            <p className="text-onyx/70">
              In Wien kommen wir gern vorbei und richten alles mit Ihnen ein.{" "}
              <a href={wa("einen Termin vereinbaren")} target="_blank" rel="noreferrer" className="font-medium text-onyx underline">Termin per WhatsApp</a>
            </p>
          </li>
        </ul>
        <p className="mt-3 text-sm text-onyx/60">
          Fragen zum Abo: <a href={`mailto:${UPGRADE_MAIL}`} className="underline">{UPGRADE_MAIL}</a>
        </p>
      </section>

      <AccountForms email={user.email ?? ""} showVenues={venueCount > 1} />

      <p className="text-center text-base text-onyx/70">
        <Link href={`/app/${venue.slug}`} className="underline">Zurück zur Übersicht</Link>
      </p>
    </div>
  );
}
