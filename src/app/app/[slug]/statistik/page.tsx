import Link from "next/link";
import { serviceClient } from "@/lib/auth";
import { KIND_LABEL_DE } from "@/lib/service";
import {
  STAT_PERIODS,
  cleanPeriod,
  dayRange,
  formatWait,
  summarizeCalls,
  summarizeViews,
  topDishes,
  type CallRow,
  type StatRow,
} from "@/lib/stats";
import { tableDisplayName } from "@/lib/tables";
import { requireVenue } from "../../venue";
import { Delta, StatTile } from "../ui";

export const dynamic = "force-dynamic";

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";
const label = "text-xs font-medium uppercase tracking-widest text-stone-500";
const dayFmt = new Intl.DateTimeFormat("de-AT", { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" });
const nf = new Intl.NumberFormat("de-AT");

export default async function StatsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tage?: string }> }) {
  const { slug } = await params;
  const period = cleanPeriod((await searchParams).tage);
  const { venue } = await requireVenue(slug);
  const db = serviceClient();

  const both = dayRange(period * 2, new Date());
  const days = both.slice(period);
  const previous = both.slice(0, period);
  const from = both[0];
  // Calls are stored with a timestamp; one day of margin covers the Vienna/UTC offset, the
  // summary then only counts calls of the period's days.
  const sinceIso = new Date(Date.parse(`${from}T00:00:00Z`) - 24 * 3600 * 1000).toISOString(); // both periods

  const [{ data: stats }, { data: calls }, { data: tables }] = await Promise.all([
    db.from("menu_stats").select("day, kind, ref, n").eq("venue_id", venue.id).gte("day", from).returns<StatRow[]>(),
    db
      .from("service_calls")
      .select("kind, status, created_at, accepted_at, closed_at")
      .eq("venue_id", venue.id)
      .gte("created_at", sinceIso)
      .returns<CallRow[]>(),
    db.from("venue_tables").select("id, label").eq("venue_id", venue.id).returns<{ id: string; label: string }[]>(),
  ]);

  const rows = stats ?? [];
  const views = summarizeViews(rows, days);
  const viewsBefore = summarizeViews(rows, previous);
  const dishes = topDishes(rows, days, 10);
  const viennaDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date(iso));
  const inPeriod = new Set(days);
  const callSummary = summarizeCalls((calls ?? []).filter((c) => inPeriod.has(viennaDay(c.created_at))));
  const inBefore = new Set(previous);
  const callsBefore = summarizeCalls((calls ?? []).filter((c) => inBefore.has(viennaDay(c.created_at))));

  const { data: items } = dishes.length
    ? await db.from("items").select("id, name").in("id", dishes.map((d) => d.ref)).returns<{ id: string; name: string }[]>()
    : { data: [] as { id: string; name: string }[] };
  const itemName = new Map((items ?? []).map((i) => [i.id, i.name]));
  const tableName = new Map((tables ?? []).map((t) => [t.id, tableDisplayName(t.label)]));

  const maxDay = Math.max(1, ...views.perDay.map((d) => d.n));
  const maxDish = Math.max(1, ...dishes.map((d) => d.n));
  const tableTotal = views.total - views.noTable;
  const nothingYet = views.total === 0 && callSummary.total === 0 && dishes.length === 0;
  // With 90 days the bars get thin; a week of bars per row would be clearer, but one bar per day stays honest.
  const showDayLabels = period <= 30;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <nav className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-stone-200" aria-label="Zeitraum">
          {STAT_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/app/${venue.slug}/statistik?tage=${p}`}
              aria-current={p === period ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${p === period ? "bg-stone-900 text-white" : "text-stone-600"}`}
            >
              {p} Tage
            </Link>
          ))}
        </nav>
      </div>

      {nothingYet && (
        <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-200">
          Noch keine Zahlen in diesem Zeitraum. Sobald Gäste Ihre Karte öffnen, erscheinen sie hier — gezählt wird ab dem 24. Oktober 2026.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Kennzahlen">
        <StatTile value={nf.format(views.total)} title="Karte geöffnet" hint={`gegenüber den ${period} Tagen davor`} delta={<Delta now={views.total} before={viewsBefore.total} />} />
        <StatTile value={nf.format(tableTotal)} title="davon am Tisch" hint="über den QR-Code am Tisch" />
        <StatTile value={nf.format(callSummary.total)} title="Service-Rufe" delta={<Delta now={callSummary.total} before={callsBefore.total} />} />
        <StatTile value={callSummary.medianSeconds === null ? "–" : formatWait(callSummary.medianSeconds)} title="Reaktionszeit" hint="Median bis zur Annahme" />
      </section>

      <section className={card}>
        <p className={label}>Karte geöffnet pro Tag</p>
        {views.busiestDay && (
          <p className="mt-1 text-sm text-stone-600">
            Stärkster Tag: {dayFmt.format(new Date(`${views.busiestDay.day}T00:00:00Z`))} mit {nf.format(views.busiestDay.n)}
          </p>
        )}
        <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label={`Aufrufe pro Tag, insgesamt ${views.total}`}>
          {views.perDay.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${dayFmt.format(new Date(`${d.day}T00:00:00Z`))}: ${d.n}`}>
              <div className="w-full rounded-t-sm bg-stone-900" style={{ height: `${(d.n / maxDay) * 100}%`, minHeight: d.n > 0 ? 3 : 0 }} />
            </div>
          ))}
        </div>
        {showDayLabels && (
          <div className="mt-1 flex justify-between text-[11px] text-stone-500">
            <span>{dayFmt.format(new Date(`${days[0]}T00:00:00Z`))}</span>
            <span>heute</span>
          </div>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Jeder Aufruf der Karte zählt einmal. Gezählt wird nur, wie oft — keine Daten über Ihre Gäste.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className={card}>
          <p className={label}>Service-Rufe</p>
          {callSummary.total === 0 ? (
            <p className="mt-2 text-sm text-stone-600">
              Keine Rufe in diesem Zeitraum.{" "}
              <Link href={`/app/${venue.slug}/service`} className="underline">Service-Ruf einstellen</Link>
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-sm">
                {(["order", "bill", "help"] as const).map((k) => (
                  <li key={k} className="flex justify-between">
                    <span>{KIND_LABEL_DE[k]}</span>
                    <span className="font-medium tabular-nums">{nf.format(callSummary.byKind[k])}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-600">
                {callSummary.withinTwoMinutes !== null && (
                  <p>{Math.round(callSummary.withinTwoMinutes * 100)} % innerhalb von 2 Minuten angenommen</p>
                )}
                {callSummary.unanswered > 0 && (
                  <p className="text-amber-800">{nf.format(callSummary.unanswered)} ohne Reaktion (abgelaufen oder vom Gast zurückgenommen)</p>
                )}
              </div>
            </>
          )}
        </section>

        <section className={card}>
          <p className={label}>Tische</p>
          {views.byTable.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">
              Noch keine Aufrufe über Tisch-QR-Codes.{" "}
              <Link href={`/app/${venue.slug}/tische`} className="underline">QR-Codes drucken</Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {views.byTable.slice(0, 8).map((t) => (
                <li key={t.ref} className="flex justify-between gap-3">
                  <span className="truncate">{tableName.get(t.ref) ?? "Gelöschter Tisch"}</span>
                  <span className="font-medium tabular-nums">{nf.format(t.n)}</span>
                </li>
              ))}
            </ul>
          )}
          {views.noTable > 0 && (
            <p className="mt-3 border-t border-stone-100 pt-3 text-sm text-stone-600">
              Ohne Tisch (Link, Google, Website): <span className="font-medium tabular-nums">{nf.format(views.noTable)}</span>
            </p>
          )}
        </section>
      </div>

      <section className={card}>
        <p className={label}>Beliebteste Gerichte</p>
        <p className="mt-1 text-sm text-stone-600">Wie oft Gäste ein Gericht angetippt haben, um mehr zu sehen.</p>
        {dishes.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Noch keine Daten.</p>
        ) : (
          <ol className="mt-4 space-y-2.5">
            {dishes.map((d, i) => (
              <li key={d.ref} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="truncate"><span className="mr-2 tabular-nums text-stone-400">{i + 1}.</span>{itemName.get(d.ref) ?? "Gelöschtes Gericht"}</span>
                  <span className="font-medium tabular-nums">{nf.format(d.n)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                  <div className="h-1.5 rounded-full bg-stone-900" style={{ width: `${(d.n / maxDish) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
