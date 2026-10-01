"use client";

import { useI18n } from "@/i18n";
import styles from "./LanguageSwitch.module.css";

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={styles.seg} role="group" aria-label={t.header.language}>
      {(["es", "en"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
