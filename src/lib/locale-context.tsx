"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale, type T } from "./i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: T;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "de",
  setLocale: () => {},
  t: translations.de,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const saved = localStorage.getItem("oriz-locale") as Locale | null;
    if (saved === "en" || saved === "de") setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("oriz-locale", l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] as unknown as T }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  return useContext(LocaleContext);
}
