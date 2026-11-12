// "Jetzt geöffnet · bis 22:00" for the top of the guest menu. Pure — unit-tested.
// Hours are the venue's opening_hours: per weekday up to two ranges "HH:MM"; a range that ends
// at or before it starts runs past midnight (18:00–02:00).

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const; // Date.getDay() order
type Day = (typeof DAYS)[number];
export type OpeningHours = Partial<Record<Day, [string, string][]>>;

export type OpenStatus =
  | { open: true; until: string }
  | { open: false; opensAt: string; today: boolean; day: Day }
  | { open: false; opensAt: null };

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Weekday and minutes since midnight in Vienna. */
export function viennaClock(now: Date): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday").slice(0, 3).toLowerCase() as Day;
  return { day, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

export function openStatus(hours: OpeningHours | null | undefined, now: Date): OpenStatus | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const { day, minutes } = viennaClock(now);
  const d = DAYS.indexOf(day);
  const yesterday = DAYS[(d + 6) % 7];

  // Still open from a range that started yesterday and runs past midnight.
  for (const [from, to] of hours[yesterday] ?? []) {
    if (toMin(to) <= toMin(from) && minutes < toMin(to)) return { open: true, until: to };
  }
  for (const [from, to] of hours[day] ?? []) {
    const a = toMin(from);
    const b = toMin(to);
    const overnight = b <= a;
    if (minutes >= a && (overnight || minutes < b)) return { open: true, until: to };
  }
  // Closed: the next opening today, else on one of the next six days.
  const later = (hours[day] ?? []).map(([from]) => from).filter((f) => toMin(f) > minutes).sort();
  if (later.length) return { open: false, opensAt: later[0], today: true, day };
  for (let i = 1; i <= 7; i++) {
    const next = DAYS[(d + i) % 7];
    const slots = hours[next];
    if (slots?.length) return { open: false, opensAt: [...slots].map(([f]) => f).sort()[0], today: false, day: next };
  }
  return { open: false, opensAt: null };
}
