"use client";

import { useT } from "@/i18n";
import { money, pct } from "@/lib/format";
import type { CategoryShare } from "@/lib/kpis";
import { CATEGORY_VAR } from "@/lib/theme";
import styles from "./dashboard.module.css";

/** Barras horizontales con etiqueta directa: el valor siempre se lee como texto. */
export function CategoryBars({ shares }: { shares: CategoryShare[] }) {
  const t = useT();
  const max = Math.max(...shares.map((s) => s.pct), 1);
  return (
    <ul className={styles.cats}>
      {shares.map((s) => (
        <li key={s.category} className={styles.catRow}>
          <span className={styles.catName}>
            <span className={styles.dot} style={{ background: CATEGORY_VAR[s.category] }} aria-hidden="true" />
            {t.categories[s.category]}
          </span>
          <span className={styles.catVal}>
            {pct(s.pct, t.locale)} · {money(s.sales, t.locale)}
          </span>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.bar} style={{ display: "block", width: `${(s.pct / max) * 100}%`, background: CATEGORY_VAR[s.category] }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
