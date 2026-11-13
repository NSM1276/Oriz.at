import Link from "next/link";
import { serviceClient } from "@/lib/auth";
import { allowedLocales } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { parseAllergens } from "@/lib/guest-menu";
import { LOCALE_NAMES } from "@/lib/locales";
import { cleanLocales } from "@/lib/menu-edit";
import { dayRange, formatWait, summarizeCalls, summarizeViews, type CallRow, type StatRow } from "@/lib/stats";
import { profileChecklist, type ProfileFacts } from "@/lib/venue-profile";
import { requireVenue } from "../venue";
import { StockCard, type StockItem } from "./StockCard";
import { Card, CardLink, Delta, Label, Progress, RowLink, StatTile } from "./ui";
import { venueHost } from "@/lib/venue-host";

export const dynamic = "force-dynamic";

// The owner's start page — built like the "today" screens of Toast Now, Square and Shopify:
// what to finish setting up, today's numbers against last week, the one thing done most
// during service (sold out), and concrete tips from the venue's own data.

type ItemRow = { id: string; name: string; section_id: string; is_active: boolean; image_url: string | null; allergens: string | null; translations: Record<string, { name?: string }> | null };

const dateFmt = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Vienna" });
const nf = new Intl.NumberFormat("de-AT");

function greeting(now: Date): string {
  const h = Number(new Intl.DateTimeFormat("de-AT", { hour: "numeric", hour12: false, timeZone: "Europe/Vienna" }).format(now));
  return h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
}

import { PRICE_MONTH, PRICE_YEAR } from "@/lib/offer";

export default async function VenueHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const db = serviceClient();
  const now = new Date();
  const days14 = dayRange(14, now);
  const thisWeek = days14.slice(7);
  const lastWeek = days14.slice(0, 7);
  const today = thisWeek[6];

  const [ent, { data: v }, { data: sections }, { data: items }, { count: tableCount }, { count: deviceCount }, { data: stats }, { data: calls }] = await Promise.all([
    getEntitlements(venue.id),
    db.from("venues").select("enabled_locales, service_calls_enabled, logo_url, logo_svg, about, cover_url, gallery, phone, address, opening_hours, website_url, instagram_url, google_review_url").eq("id", venue.id).single<{ enabled_locales: string[] | null; service_calls_enabled: boolean; logo_url: string | null; logo_svg: string | null } & ProfileFacts>(),
    db.from("sections").select("id, name").eq("venue_id", venue.id).order("position").returns<{ id: string; name: string }[]>(),
    db.from("items").select("id, name, section_id, is_active, image_url, allergens, translations").eq("venue_id", venue.id).order("position").returns<ItemRow[]>(),
    db.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id),
    db.from("staff_devices").select("id", { count: "exact", head: true }).eq("venue_id", venue.id).is("revoked_at", null),
    db.from("menu_stats").select("day, kind, ref, n").eq("venue_id", venue.id).eq("kind", "view").gte("day", days14[0]).returns<StatRow[]>(),
    db.from("service_calls").select("kind, status, created_at, accepted_at, closed_at").eq("venue_id", venue.id).gte("created_at", new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()).returns<CallRow[]>(),
  ]);

  const list = items ?? [];
  const sectionName = new Map((sections ?? []).map((s) => [s.id, s.name]));
  const locales = cleanLocales(v?.enabled_locales ?? [], allowedLocales(ent));

  // ── numbers ──
  const viewsThis = summarizeViews(stats ?? [], thisWeek);
  const viewsLast = summarizeViews(stats ?? [], lastWeek);
  const todayViews = viewsThis.perDay[6]?.n ?? 0;
  const sameDayViews = viewsLast.perDay[6]?.n ?? 0;
  const viennaDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date(iso));
  const weekSet = new Set(thisWeek);
  const callsWeek = summarizeCalls((calls ?? []).filter((c) => weekSet.has(viennaDay(c.created_at))));
  const callsToday = (calls ?? []).filter((c) => viennaDay(c.created_at) === today).length;
  const openCalls = (calls ?? []).filter((c) => c.status === "open" && Date.now() - Date.parse(c.created_at) < 30 * 60_000).length;

  // ── setup guide ──
  const declared = list.filter((it) => parseAllergens(it.allergens) !== null).length;
  const steps = [
    { done: list.length > 0, title: "Speisekarte anlegen", hint: "Als Text einfügen oder Gericht für Gericht", href: `/app/${venue.slug}/start` },
    { done: !!(v?.logo_url || v?.logo_svg), title: "Logo und Farben", hint: "So erkennt man Ihr Lokal sofort", href: `/app/${venue.slug}/aussehen` },
    { done: list.length > 0 && declared / list.length >= 0.8, title: "Allergene eintragen", hint: `${declared} von ${list.length} Gerichten`, href: `/app/${venue.slug}/speisekarte` },
    { done: (tableCount ?? 0) > 0, title: "Tische und QR-Codes", hint: "Ein Aufkleber je Tisch", href: `/app/${venue.slug}/tische` },
    { done: !!v?.service_calls_enabled && (deviceCount ?? 0) > 0, title: "Service-Ruf verbinden", hint: "Handy oder Tablet des Teams koppeln", href: `/app/${venue.slug}/service` },
    { done: locales.length > 0, title: "Sprachen einschalten", hint: "Englisch, Italienisch, Französisch, Spanisch", href: `/app/${venue.slug}/speisekarte` },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const setupOpen = doneCount < steps.length;

  // ── tips from the venue's own data (like Wolt's growth hints, without guesses about revenue) ──
  const noPhoto = list.filter((it) => !it.image_url).length;
  const tips: { title: string; hint: string; href: string }[] = [];
  if (list.length > 0 && noPhoto > 0 && noPhoto < list.length) {
    tips.push({ title: `${noPhoto} Gerichte ohne Foto`, hint: "Gerichte mit Foto werden öfter angetippt", href: `/app/${venue.slug}/speisekarte` });
  }
  for (const l of locales) {
    const missing = list.filter((it) => !it.translations?.[l]?.name).length;
    if (missing > 0) tips.push({ title: `${LOCALE_NAMES[l]}: ${missing} Gerichte ohne Übersetzung`, hint: "Gäste sehen dort den deutschen Text", href: `/app/${venue.slug}/speisekarte` });
  }
  if (list.length > 0 && declared < list.length && !setupOpen) {
    tips.push({ title: `${list.length - declared} Gerichte ohne Allergene`, hint: "Gäste sehen dort „bitte nachfragen“", href: `/app/${venue.slug}/speisekarte` });
  }

  if (v) {
    const missingProfile = profileChecklist(v).filter((c) => !c.done);
    if (missingProfile.length > 0) {
      tips.unshift({ title: `Ihr Lokal: ${missingProfile.length} Angaben fehlen`, hint: missingProfile.slice(0, 3).map((c) => c.label).join(", "), href: `/app/${venue.slug}/lokal` });
    }
  }

  const stock: StockItem[] = list.map((it) => ({ id: it.id, name: it.name, section: sectionName.get(it.section_id) ?? "", available: it.is_active }));
  const planText =
    ent.tier === "trial"
      ? ent.trialEndsAt
        ? `Testphase · noch ${Math.max(0, Math.ceil((ent.trialEndsAt.getTime() - now.getTime()) / 86_400_000))} Tage`
        : "Testphase"
      : ent.locked
        ? "Testphase beendet"
        : "Abo aktiv";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-base text-onyx/60">{dateFmt.format(now)}</p>
          <h1 className="font-display text-4xl font-medium leading-tight">{greeting(now)}</h1>
        </div>
        <Link href={`/app/${venue.slug}/konto`} className="inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-base font-medium text-onyx/80 ring-1 ring-onyx/15">
          {planText}
        </Link>
      </div>

      {setupOpen && (
        <Card padded={false}>
          <div className="px-5 pt-5">
            <Label action={<span className="text-base font-medium tabular-nums text-onyx/75">{doneCount} von {steps.length}</span>}>Einrichtung</Label>
            <div className="mt-3"><Progress value={doneCount} max={steps.length} /></div>
          </div>
          <ul className="mt-3 divide-y divide-onyx/10">
            {steps.map((s) => (
              <li key={s.title}>
                <Link href={s.href} className="flex min-h-16 items-center gap-3 px-5 py-3 active:bg-onyx/5">
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base ${s.done ? "bg-emerald-600 text-white" : "ring-2 ring-onyx/25"}`}
                  >
                    {s.done ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[17px] font-semibold leading-snug ${s.done ? "font-normal text-onyx/40 line-through" : ""}`}>{s.title}</span>
                    {!s.done && <span className="block text-base leading-snug text-onyx/60">{s.hint}</span>}
                  </span>
                  {!s.done && <span aria-hidden className="text-xl text-onyx/40">›</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {openCalls > 0 && (
        <Link href={`/app/${venue.slug}/service`} className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-300">
          <span>
            <span className="block text-lg font-semibold text-amber-950">{openCalls === 1 ? "1 Gast wartet" : `${openCalls} Gäste warten`}</span>
            <span className="block text-base text-amber-900">Offene Service-Rufe der letzten 30 Minuten</span>
          </span>
          <span aria-hidden className="text-amber-700">›</span>
        </Link>
      )}

      {list.length > 0 && (
        <div>
          <Label action={<CardLink href={`/app/${venue.slug}/statistik?tage=7`}>Statistik ›</CardLink>}>Heute</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <StatTile value={nf.format(todayViews)} title="Aufrufe" delta={<Delta now={todayViews} before={sameDayViews} />} href={`/app/${venue.slug}/statistik?tage=7`} />
            <StatTile value={nf.format(callsToday)} title="Service-Rufe" href={`/app/${venue.slug}/statistik?tage=7`} />
            <StatTile value={nf.format(viewsThis.total)} title="Aufrufe, 7 Tage" delta={<Delta now={viewsThis.total} before={viewsLast.total} />} href={`/app/${venue.slug}/statistik?tage=7`} />
          </div>
        </div>
      )}

      {list.length > 0 && <StockCard slug={venue.slug} items={stock} />}

      {tips.length > 0 && (
        <Card padded={false}>
          <div className="px-5 pt-5"><Label>Besser werden</Label></div>
          <div className="mt-2 divide-y divide-onyx/10">
            {tips.slice(0, 2).map((t) => <RowLink key={t.title} href={t.href} title={t.title} hint={t.hint} />)}
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="px-5 pt-5"><Label>Schnell</Label></div>
        <div className="mt-2 divide-y divide-onyx/10">
          <RowLink href={`/${venue.slug}`} title="Karte ansehen" hint={venueHost(venue.slug)} external />
          <RowLink href={`/app/${venue.slug}/tische`} title="QR-Codes drucken" hint={`${nf.format(tableCount ?? 0)} Tische`} />
          <RowLink href={`/app/${venue.slug}/speisekarte/pdf`} title="Karte drucken" hint="PDF in A4" external />
          <RowLink href={`/app/${venue.slug}/lokal?teil=teilen`} title="Karte teilen" hint="Link, WhatsApp, QR-Code" />
        </div>
      </Card>

      {ent.tier === "trial" && (
        <p className="px-1 text-center text-base text-onyx/60">
          Danach {PRICE_MONTH} im Monat oder {PRICE_YEAR} im Jahr.
        </p>
      )}
    </div>
  );
}
