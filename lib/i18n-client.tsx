"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Locale, T } from "./i18n";
import { dict } from "./i18n";

interface LangCtx {
  locale: Locale;
  t: T;
  setLocale: (l: Locale) => void;
}

const LangContext = createContext<LangCtx>({
  locale: "ko",
  t: dict.ko as T,
  setLocale: () => {},
});

export function LangProvider({ locale: initial, children }: { locale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000`;
  }, []);

  return (
    <LangContext.Provider value={{ locale, t: dict[locale] as T, setLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
