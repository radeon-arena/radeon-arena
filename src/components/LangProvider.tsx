"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  // The account pages (/me, /login, /device) are rendered by the API service,
  // which reads this cookie to answer in the language the visitor last used here.
  useEffect(() => {
    document.cookie = `ra_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}
