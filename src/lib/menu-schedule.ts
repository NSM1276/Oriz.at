import type { MenuData } from "@/lib/supabase/types";

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Returns the menu id that is currently active based on day+time.
 *  Falls back to the first menu by position if none match. */
export function getActiveMenuId(menus: MenuData[]): string | null {
  if (!menus.length) return null;
  const now = new Date();
  const day = DAY_KEYS[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const active = menus.find(
    (m) =>
      m.active_days.includes(day) &&
      m.time_from &&
      m.time_to &&
      timeStr >= m.time_from.slice(0, 5) &&
      timeStr <= m.time_to.slice(0, 5),
  );
  return active?.id ?? menus[0]?.id ?? null;
}

/** Human-readable schedule summary, e.g. "Mo–So 15:00–21:30" */
export function formatSchedule(menu: MenuData): string {
  const dayLabels: Record<string, string> = {
    mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So',
  };
  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const days = menu.active_days
    .slice()
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
    .map((d) => dayLabels[d] ?? d);

  const daysStr = days.length
    ? days.length === 7
      ? 'Mo–So'
      : days.join('/')
    : '';

  const timeStr =
    menu.time_from && menu.time_to
      ? ` ${menu.time_from.slice(0, 5)}–${menu.time_to.slice(0, 5)}`
      : '';

  return `${daysStr}${timeStr}`.trim();
}
