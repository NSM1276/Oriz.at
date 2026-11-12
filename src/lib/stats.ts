// The owner's statistics, from the daily counters (migration 0027) and the waiter calls.
// No runtime imports — unit-tested.

export const NO_TABLE = "00000000-0000-0000-0000-000000000000";
export const STAT_PERIODS = [7, 30, 90] as const;
export type StatPeriod = (typeof STAT_PERIODS)[number];

export function cleanPeriod(raw: unknown): StatPeriod {
  const n = Number(raw);
  return (STAT_PERIODS as readonly number[]).includes(n) ? (n as StatPeriod) : 30;
}

/** "2026-10-24" in Vienna for the given moment. */
export function viennaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

/** The last `days` calendar days ending today (Vienna), oldest first. */
export function dayRange(days: number, now: Date): string[] {
  const today = viennaDate(now);
  const [y, m, d] = today.split("-").map(Number);
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = new Date(Date.UTC(y, m - 1, d - i));
    out.push(t.toISOString().slice(0, 10));
  }
  return out;
}

export type StatRow = { day: string; kind: "view" | "dish"; ref: string; n: number };

export type ViewSummary = {
  total: number;
  perDay: { day: string; n: number }[];
  /** Opened through a table sticker, by table id. */
  byTable: { ref: string; n: number }[];
  /** Opened without a table (shared link, Google, website). */
  noTable: number;
  busiestDay: { day: string; n: number } | null;
};

export function summarizeViews(rows: StatRow[], days: string[]): ViewSummary {
  const inRange = new Set(days);
  const views = rows.filter((r) => r.kind === "view" && inRange.has(r.day));
  const perDayMap = new Map(days.map((d) => [d, 0]));
  const tableMap = new Map<string, number>();
  let noTable = 0;
  for (const r of views) {
    perDayMap.set(r.day, (perDayMap.get(r.day) ?? 0) + r.n);
    if (r.ref === NO_TABLE) noTable += r.n;
    else tableMap.set(r.ref, (tableMap.get(r.ref) ?? 0) + r.n);
  }
  const perDay = days.map((day) => ({ day, n: perDayMap.get(day) ?? 0 }));
  const total = perDay.reduce((s, d) => s + d.n, 0);
  const busiest = perDay.reduce<{ day: string; n: number } | null>((b, d) => (d.n > 0 && (!b || d.n > b.n) ? d : b), null);
  return {
    total,
    perDay,
    byTable: [...tableMap].map(([ref, n]) => ({ ref, n })).sort((a, b) => b.n - a.n),
    noTable,
    busiestDay: busiest,
  };
}

/** Dish cards opened in the period, most opened first. */
export function topDishes(rows: StatRow[], days: string[], limit = 10): { ref: string; n: number }[] {
  const inRange = new Set(days);
  const map = new Map<string, number>();
  for (const r of rows) if (r.kind === "dish" && inRange.has(r.day)) map.set(r.ref, (map.get(r.ref) ?? 0) + r.n);
  return [...map].map(([ref, n]) => ({ ref, n })).sort((a, b) => b.n - a.n).slice(0, limit);
}

export type CallRow = {
  kind: "order" | "bill" | "help";
  status: "open" | "accepted" | "done" | "cancelled";
  created_at: string;
  accepted_at: string | null;
  closed_at: string | null;
};

export type CallSummary = {
  total: number;
  byKind: Record<CallRow["kind"], number>;
  /** Median seconds from the call to the first reaction (taken, or done without taking). */
  medianSeconds: number | null;
  /** Share of calls answered within two minutes, 0–1. */
  withinTwoMinutes: number | null;
  /** Calls nobody reacted to (still open after the board dropped them, or withdrawn by the guest). */
  unanswered: number;
};

export function summarizeCalls(calls: CallRow[]): CallSummary {
  const byKind = { order: 0, bill: 0, help: 0 };
  const waits: number[] = [];
  let unanswered = 0;
  for (const c of calls) {
    byKind[c.kind]++;
    const reacted = c.accepted_at ?? (c.status === "done" ? c.closed_at : null);
    if (reacted) waits.push(Math.max(0, (Date.parse(reacted) - Date.parse(c.created_at)) / 1000));
    else unanswered++;
  }
  waits.sort((a, b) => a - b);
  const median = waits.length === 0 ? null : waits.length % 2 ? waits[(waits.length - 1) / 2] : (waits[waits.length / 2 - 1] + waits[waits.length / 2]) / 2;
  return {
    total: calls.length,
    byKind,
    medianSeconds: median,
    withinTwoMinutes: waits.length === 0 ? null : waits.filter((w) => w <= 120).length / waits.length,
    unanswered,
  };
}

/** "45 s", "2 min", "1 h 5 min". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}
