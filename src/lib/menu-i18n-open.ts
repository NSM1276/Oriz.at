// "Open now · until 22:00" in every guest-menu language. Separate from menu-i18n.ts so the
// opening line can grow without touching the big interface table.
import type { OpenStatus } from "./opening-status.ts";

type OpenStrings = {
  /** "{t}" = closing time */
  openUntil: string;
  /** "{t}" = opening time today */
  opensToday: string;
  /** "{d}" = weekday, "{t}" = time */
  opensOn: string;
  closed: string;
  /** Sunday first, as Date.getDay(). */
  days: [string, string, string, string, string, string, string];
};

const S: Record<string, OpenStrings> = {
  de: { openUntil: "Jetzt geöffnet · bis {t}", opensToday: "Geschlossen · öffnet um {t}", opensOn: "Geschlossen · öffnet {d} um {t}", closed: "Geschlossen", days: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] },
  en: { openUntil: "Open now · until {t}", opensToday: "Closed · opens at {t}", opensOn: "Closed · opens {d} at {t}", closed: "Closed", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  it: { openUntil: "Aperto ora · fino alle {t}", opensToday: "Chiuso · apre alle {t}", opensOn: "Chiuso · apre {d} alle {t}", closed: "Chiuso", days: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"] },
  fr: { openUntil: "Ouvert · jusqu’à {t}", opensToday: "Fermé · ouvre à {t}", opensOn: "Fermé · ouvre {d} à {t}", closed: "Fermé", days: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."] },
  es: { openUntil: "Abierto · hasta las {t}", opensToday: "Cerrado · abre a las {t}", opensOn: "Cerrado · abre el {d} a las {t}", closed: "Cerrado", days: ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."] },
  pt: { openUntil: "Aberto · até às {t}", opensToday: "Fechado · abre às {t}", opensOn: "Fechado · abre {d} às {t}", closed: "Fechado", days: ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."] },
  nl: { openUntil: "Nu open · tot {t}", opensToday: "Gesloten · open om {t}", opensOn: "Gesloten · open {d} om {t}", closed: "Gesloten", days: ["zo", "ma", "di", "wo", "do", "vr", "za"] },
  pl: { openUntil: "Otwarte · do {t}", opensToday: "Zamknięte · otwarcie o {t}", opensOn: "Zamknięte · otwarcie {d} o {t}", closed: "Zamknięte", days: ["nd.", "pn.", "wt.", "śr.", "czw.", "pt.", "sob."] },
  cs: { openUntil: "Otevřeno · do {t}", opensToday: "Zavřeno · otevírá v {t}", opensOn: "Zavřeno · otevírá {d} v {t}", closed: "Zavřeno", days: ["ne", "po", "út", "st", "čt", "pá", "so"] },
  sk: { openUntil: "Otvorené · do {t}", opensToday: "Zatvorené · otvára o {t}", opensOn: "Zatvorené · otvára {d} o {t}", closed: "Zatvorené", days: ["ne", "po", "ut", "st", "št", "pi", "so"] },
  sl: { openUntil: "Odprto · do {t}", opensToday: "Zaprto · odpre ob {t}", opensOn: "Zaprto · odpre {d} ob {t}", closed: "Zaprto", days: ["ned.", "pon.", "tor.", "sre.", "čet.", "pet.", "sob."] },
  hu: { openUntil: "Nyitva · {t}-ig", opensToday: "Zárva · nyit {t}-kor", opensOn: "Zárva · nyit {d} {t}-kor", closed: "Zárva", days: ["V", "H", "K", "Sze", "Cs", "P", "Szo"] },
  ro: { openUntil: "Deschis · până la {t}", opensToday: "Închis · se deschide la {t}", opensOn: "Închis · se deschide {d} la {t}", closed: "Închis", days: ["dum.", "lun.", "mar.", "mie.", "joi", "vin.", "sâm."] },
  hr: { openUntil: "Otvoreno · do {t}", opensToday: "Zatvoreno · otvara u {t}", opensOn: "Zatvoreno · otvara {d} u {t}", closed: "Zatvoreno", days: ["ned", "pon", "uto", "sri", "čet", "pet", "sub"] },
  sr: { openUntil: "Отворено · до {t}", opensToday: "Затворено · отвара у {t}", opensOn: "Затворено · отвара {d} у {t}", closed: "Затворено", days: ["нед", "пон", "уто", "сре", "чет", "пет", "суб"] },
  el: { openUntil: "Ανοιχτό · έως τις {t}", opensToday: "Κλειστό · ανοίγει στις {t}", opensOn: "Κλειστό · ανοίγει {d} στις {t}", closed: "Κλειστό", days: ["Κυρ", "Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ"] },
  tr: { openUntil: "Şu an açık · {t}'e kadar", opensToday: "Kapalı · {t}'de açılır", opensOn: "Kapalı · {d} {t}'de açılır", closed: "Kapalı", days: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] },
  ru: { openUntil: "Сейчас открыто · до {t}", opensToday: "Закрыто · откроется в {t}", opensOn: "Закрыто · откроется в {d} в {t}", closed: "Закрыто", days: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] },
  uk: { openUntil: "Зараз відчинено · до {t}", opensToday: "Зачинено · відчиниться о {t}", opensOn: "Зачинено · відчиниться {d} о {t}", closed: "Зачинено", days: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"] },
  ar: { openUntil: "مفتوح الآن · حتى {t}", opensToday: "مغلق · يفتح الساعة {t}", opensOn: "مغلق · يفتح {d} الساعة {t}", closed: "مغلق", days: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] },
  zh: { openUntil: "营业中 · 至 {t}", opensToday: "已打烊 · {t} 开门", opensOn: "已打烊 · {d} {t} 开门", closed: "已打烊", days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] },
  ja: { openUntil: "営業中 · {t}まで", opensToday: "準備中 · {t}開店", opensOn: "準備中 · {d} {t}開店", closed: "閉店", days: ["日", "月", "火", "水", "木", "金", "土"] },
  ko: { openUntil: "영업 중 · {t}까지", opensToday: "영업 종료 · {t} 오픈", opensOn: "영업 종료 · {d} {t} 오픈", closed: "영업 종료", days: ["일", "월", "화", "수", "목", "금", "토"] },
};

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const;

export function openText(status: OpenStatus, locale: string): string {
  const s = S[locale] ?? S.en;
  if (status.open) return s.openUntil.replace("{t}", status.until);
  if (status.opensAt === null) return s.closed;
  if (status.today) return s.opensToday.replace("{t}", status.opensAt);
  return s.opensOn.replace("{d}", s.days[DAY_INDEX[status.day]]).replace("{t}", status.opensAt);
}

export const OPEN_LOCALES = Object.keys(S);
