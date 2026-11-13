// "Ausverkauft" has two forms, as in every ordering app an owner already knows:
//   today — the dish comes back by itself the next morning;
//   open  — it stays off until somebody switches it on again.
// No runtime imports — unit-tested.

export type SoldOutScope = "today" | "open";

/** Hour (UTC) of the nightly run in vercel.json that switches "today" dishes back on: 04:30 / 05:30 in Vienna. */
export const RESET_HOUR_UTC = 3;
export const RESET_MINUTE_UTC = 30;

/** The next nightly run after `now`: the moment a dish marked "heute aus" may come back. */
export function soldOutUntil(now: Date = new Date()): Date {
  const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_HOUR_UTC, RESET_MINUTE_UTC));
  if (at.getTime() <= now.getTime()) at.setUTCDate(at.getUTCDate() + 1);
  return at;
}

export type Availability = "on" | "today" | "open";

/** What the owner sees next to a dish. */
export function availabilityOf(item: { is_active: boolean; sold_out_until?: string | null }): Availability {
  if (item.is_active) return "on";
  return item.sold_out_until ? "today" : "open";
}

export const AVAILABILITY_LABEL: Record<Availability, string> = { on: "verfügbar", today: "heute aus", open: "aus" };
