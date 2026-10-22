// Several menus per venue (lunch, dinner, drinks…): checking what the owner types, and ordering.
// Pure — unit-tested.
//
// How guests see it: with two or more menus a switcher appears above the dishes, and the menu whose
// days and hours match "now" is preselected (see menu-schedule.ts: same day keys, "HH:MM", no
// overnight spans). A section belongs to one menu or to all of them (menu_id = null).

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_LABELS: Record<DayKey, string> = { mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa", sun: "So" };

export const MENU_NAME_MAX = 60;

export type MenuInput = { name: string; days: DayKey[]; from: string | null; to: string | null };
export type MenuCheck = { ok: true; menu: MenuInput } | { ok: false; error: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validates a menu from the browser. A schedule is either complete (days AND a from–to time, from before to)
 * or absent: half a schedule would never match and the menu would silently never be preselected.
 */
export function cleanMenuInput(raw: unknown): MenuCheck {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Ungültige Eingabe." };
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 1) return { ok: false, error: "Bitte einen Namen eingeben." };
  if (name.length > MENU_NAME_MAX) return { ok: false, error: `Der Name darf höchstens ${MENU_NAME_MAX} Zeichen haben.` };

  if (!Array.isArray(r.days) || r.days.some((d) => !(DAY_KEYS as readonly unknown[]).includes(d))) return { ok: false, error: "Ungültige Wochentage." };
  const days = DAY_KEYS.filter((d) => (r.days as unknown[]).includes(d));

  const from = r.from === null || r.from === undefined || r.from === "" ? null : r.from;
  const to = r.to === null || r.to === undefined || r.to === "" ? null : r.to;
  if ((from !== null && (typeof from !== "string" || !TIME.test(from))) || (to !== null && (typeof to !== "string" || !TIME.test(to)))) {
    return { ok: false, error: "Die Uhrzeit sieht nicht richtig aus." };
  }

  const anySchedule = days.length > 0 || from !== null || to !== null;
  if (anySchedule) {
    if (days.length === 0 || from === null || to === null) return { ok: false, error: "Für einen Zeitplan bitte Tage und Uhrzeit angeben, oder beides leer lassen." };
    if ((from as string) >= (to as string)) return { ok: false, error: "„Von“ muss vor „Bis“ liegen." };
  }
  return { ok: true, menu: { name, days, from: from as string | null, to: to as string | null } };
}

/** The ids in the new order after moving `id` one place up (-1) or down (1). */
export function reorder(ids: string[], id: string, direction: -1 | 1): string[] {
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = ids.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
