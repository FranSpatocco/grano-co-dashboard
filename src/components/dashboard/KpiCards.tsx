"use client";

import { DownIcon, FlatIcon, UpIcon } from "@/components/icons";
import { useI18n } from "@/i18n";
import { PRODUCT_BY_ID } from "@/lib/catalog";
import { integer, money, signedPct } from "@/lib/format";
import { pctChange, topProduct, trendOf, type Totals } from "@/lib/kpis";
import styles from "./dashboard.module.css";

function Delta({ pct }: { pct: number | null }) {
  const { t } = useI18n();
  if (pct === null) return <span className="muted">{t.kpi.noCompare}</span>;
  const trend = trendOf(pct);
  const Icon = trend === "up" ? UpIcon : trend === "down" ? DownIcon : FlatIcon;
  return (
    <span className={`pill trend-${trend}`}>
      <Icon size={14} />
      <span className="sr-only">{t.kpi[trend]}</span>
      {signedPct(pct, t.locale)}
      <span className="sr-only">
        {" "}
        {t.kpi.vs}
      </span>
    </span>
  );
}

export function KpiCards({ current, previous, vsLabel }: { current: Totals; previous: Totals; vsLabel: string }) {
  const { t, lang } = useI18n();
  const top = topProduct(current);
  const topPrev = top ? (previous.products[top.id] ?? 0) : 0;

  const cards = [
    { label: t.kpi.sales, value: money(current.sales, t.locale), pct: pctChange(current.sales, previous.sales), hero: true },
    { label: t.kpi.avgTicket, value: money(current.avgTicket, t.locale), pct: pctChange(current.avgTicket, previous.avgTicket) },
    { label: t.kpi.orders, value: integer(current.orders, t.locale), pct: pctChange(current.orders, previous.orders) },
  ];

  return (
    <section className={styles.kpis} aria-label={t.kpi.region}>
      {cards.map((c) => (
        <article key={c.label} className={`card ${c.hero ? styles.kpiHero : ""}`}>
          <h2 className={styles.kpiLabel} style={{ margin: 0, fontWeight: 400 }}>
            {c.label}
          </h2>
          <p className={styles.kpiValue}>{c.value}</p>
          <div className={styles.delta}>
            <Delta pct={c.pct} />
            <span className={`muted ${styles.vs}`} aria-hidden="true">
              {vsLabel}
            </span>
          </div>
        </article>
      ))}
      <article className="card">
        <h2 className={styles.kpiLabel} style={{ margin: 0, fontWeight: 400 }}>
          {t.kpi.topProduct}
        </h2>
        <p className={`${styles.kpiValue} ${styles.kpiText}`}>{top ? PRODUCT_BY_ID[top.id]?.name[lang] ?? top.id : "—"}</p>
        <div className={styles.delta}>
          <Delta pct={top ? pctChange(top.qty, topPrev) : null} />
          {top && <span className="muted mono">{t.kpi.units(integer(top.qty, t.locale))}</span>}
        </div>
      </article>
    </section>
  );
}
