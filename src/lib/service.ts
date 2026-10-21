// Guest → staff calls. No runtime imports — shared by server and browser, unit-tested.

export const CALL_KINDS = ["order", "bill", "help"] as const;
export type CallKind = (typeof CALL_KINDS)[number];
export type CallStatus = "open" | "accepted" | "done" | "cancelled";

export function isCallKind(v: unknown): v is CallKind {
  return typeof v === "string" && (CALL_KINDS as readonly string[]).includes(v);
}

/** Staff side is German only; the guest side follows the menu language. */
export const KIND_LABEL_DE: Record<CallKind, string> = {
  order: "Bestellen",
  bill: "Zahlen",
  help: "Frage",
};

// A call nobody touched for this long is old news; it drops off the board and
// no longer blocks the table from calling again.
export const CALL_STALE_MINUTES = 30;
// Finished calls stay greyed out on the board for a moment, so staff see who took what.
export const CALL_DONE_VISIBLE_MINUTES = 10;
// Anti-spam per table: at most this many new calls in the window.
export const TABLE_CALL_LIMIT = 6;
export const TABLE_CALL_WINDOW_MINUTES = 10;

export const STAFF_COOKIE = "oriz_staff";
export const STAFF_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
export const PAIRING_MINUTES = 10;
export const DEVICE_NAME_MAX = 40;

type RecentCall = { kind: CallKind; status: CallStatus; created_at: string };

export type CallDecision =
  | { action: "create" }
  | { action: "reuse"; index: number }
  | { action: "limit" };

/** Whether a table may place a new call, given its recent calls (newest first). */
export function decideCall(kind: CallKind, recent: RecentCall[], now = Date.now()): CallDecision {
  const staleBefore = now - CALL_STALE_MINUTES * 60_000;
  const pending = recent.findIndex(
    (c) => c.kind === kind && (c.status === "open" || c.status === "accepted") && Date.parse(c.created_at) > staleBefore,
  );
  // Pressing "Zahlen" twice is one wish, not two calls.
  if (pending !== -1) return { action: "reuse", index: pending };

  const windowStart = now - TABLE_CALL_WINDOW_MINUTES * 60_000;
  const inWindow = recent.filter((c) => Date.parse(c.created_at) > windowStart).length;
  if (inWindow >= TABLE_CALL_LIMIT) return { action: "limit" };
  return { action: "create" };
}

/** Whether a call still belongs on the staff board. */
export function onBoard(call: { status: CallStatus; created_at: string; closed_at: string | null }, now = Date.now()): boolean {
  if (call.status === "open" || call.status === "accepted") {
    return Date.parse(call.created_at) > now - CALL_STALE_MINUTES * 60_000;
  }
  return call.closed_at !== null && Date.parse(call.closed_at) > now - CALL_DONE_VISIBLE_MINUTES * 60_000;
}

/** Trimmed, single-spaced device name, or null. */
export function normalizeDeviceName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  return name.length >= 1 && name.length <= DEVICE_NAME_MAX ? name : null;
}
