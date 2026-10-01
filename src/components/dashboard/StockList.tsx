"use client";

import { WarnIcon } from "@/components/icons";
import { useI18n } from "@/i18n";
import { integer } from "@/lib/format";
import type { StockItem } from "@/lib/schemas";
import styles from "./dashboard.module.css";

/** Insumos por debajo del mínimo, del que se agota antes al que dura más. */
export function lowStock(items: StockItem[]): StockItem[] {
  return items.filter((s) => s.onHand < s.minimum).sort((a, b) => a.onHand / a.dailyUse - b.onHand / b.dailyUse);
}

export function StockList({ items }: { items: StockItem[] }) {
  const { t, lang } = useI18n();
  if (items.length === 0) return <p className="muted">{t.stock.empty}</p>;
  return (
    <ul className={styles.stockList}>
      {items.map((s) => {
        const days = Math.max(1, Math.floor(s.onHand / s.dailyUse));
        return (
          <li key={s.id} className={styles.stockItem}>
            <span className={styles.stockIcon}>
              <WarnIcon />
            </span>
            <span className={styles.stockName}>{s.name[lang]}</span>
            <span className={styles.stockLeft}>{t.stock.days(days)}</span>
            <span className={styles.stockMeta}>
              {t.stock.left(integer(s.onHand, t.locale), s.unit[lang])} · {t.stock.lasts(t.stock.days(days))} ·{" "}
              {t.stock.minimum(integer(s.minimum, t.locale), s.unit[lang])}
            </span>
            <span className={styles.level} aria-hidden="true">
              <span style={{ width: `${Math.min(100, (s.onHand / s.minimum) * 100)}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
