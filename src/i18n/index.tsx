"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useStoredValue } from "@/lib/storage";
import { en } from "./en";
import { es } from "./es";

export type Dictionary = typeof es;
export type Lang = "es" | "en";

const DICTIONARIES: Record<Lang, Dictionary> = { es, en };
const STORAGE_KEY = "grano-lang";

interface I18nValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [saved, save] = useStoredValue("local", STORAGE_KEY);
  const lang: Lang = saved === "en" ? "en" : "es";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => save(next), [save]);

  const value = useMemo(() => ({ lang, t: DICTIONARIES[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n tiene que usarse dentro de I18nProvider");
  return ctx;
}

/** Atajo para leer solo el diccionario: `const t = useT(); t.kpi.sales`. */
export function useT(): Dictionary {
  return useI18n().t;
}
