// Every language the guest menu can show, and which of them a plan includes.
// German is the base every menu is written in; it is never stored in enabled_locales.
//
// Package (every plan): EN, IT, FR, ES — fixed, the owner cannot swap one for another.
// "20+ Sprachen" (add-on): all languages below.

export const MENU_LOCALES = [
  "en", "it", "fr", "es",
  "pt", "nl", "pl", "cs", "sk", "sl", "hu", "ro", "hr", "sr", "el", "tr", "ru", "uk", "ar", "zh", "ja", "ko",
] as const;
export type MenuLocale = (typeof MENU_LOCALES)[number];

/** The languages every plan includes (besides German). Fixed set — see the pricing decision of 2026-10-24. */
export const PACKAGE_LOCALES: readonly MenuLocale[] = ["en", "it", "fr", "es"];

/** How the owner's German admin names each language. */
export const LOCALE_NAMES: Record<MenuLocale, string> = {
  en: "Englisch", it: "Italienisch", fr: "Französisch", es: "Spanisch",
  pt: "Portugiesisch", nl: "Niederländisch", pl: "Polnisch", cs: "Tschechisch", sk: "Slowakisch", sl: "Slowenisch",
  hu: "Ungarisch", ro: "Rumänisch", hr: "Kroatisch", sr: "Serbisch", el: "Griechisch", tr: "Türkisch",
  ru: "Russisch", uk: "Ukrainisch", ar: "Arabisch", zh: "Chinesisch", ja: "Japanisch", ko: "Koreanisch",
};

/** How a guest sees each language in the picker: its own name, in its own script. */
export const LOCALE_NATIVE: Record<string, string> = {
  de: "Deutsch", en: "English", it: "Italiano", fr: "Français", es: "Español",
  pt: "Português", nl: "Nederlands", pl: "Polski", cs: "Čeština", sk: "Slovenčina", sl: "Slovenščina",
  hu: "Magyar", ro: "Română", hr: "Hrvatski", sr: "Српски", el: "Ελληνικά", tr: "Türkçe",
  ru: "Русский", uk: "Українська", ar: "العربية", zh: "中文", ja: "日本語", ko: "한국어",
};

/** Short code on the pill when there are few languages (UA is what Ukrainians expect, not UK). */
export const LOCALE_SHORT: Record<string, string> = { uk: "UA", zh: "中文", ja: "日本", ko: "한국", ar: "ع" };

export function localeShort(code: string): string {
  return LOCALE_SHORT[code] ?? code.toUpperCase();
}

/** Languages written right-to-left; the guest menu flips its text direction for them. */
export const RTL_LOCALES: ReadonlySet<string> = new Set(["ar"]);

export function isMenuLocale(x: unknown): x is MenuLocale {
  return typeof x === "string" && (MENU_LOCALES as readonly string[]).includes(x);
}
