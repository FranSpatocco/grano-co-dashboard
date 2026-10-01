"use client";

import { useMemo, useState } from "react";
import { WarnIcon } from "@/components/icons";
import { useDailyStats, useOrders, useStats, useStock } from "@/hooks/useDashboardData";
import { useI18n } from "@/i18n";
import { ORDERS_LIMIT } from "@/lib/data/source";
import { DEMO_HISTORY_DAYS } from "@/lib/demo/generator";
import { longDate, shortDate } from "@/lib/format";
import { categoryShares, totals } from "@/lib/kpis";
import { addDays, dayCount, localHour, rangeForPeriod, toISODate, weekdayIndex, type DateRange, type PeriodKey } from "@/lib/period";
import { AiSummary } from "./AiSummary";
import { CategoryBars } from "./CategoryBars";
import styles from "./dashboard.module.css";
import { defaultCustomRange, Header } from "./Header";
import { Heatmap } from "./Heatmap";
import { KpiCards } from "./KpiCards";
import { SalesChart } from "./SalesChart";
import { lowStock, StockList } from "./StockList";
import { OrdersTable } from "./OrdersTable";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Loading({ height = 220 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} aria-hidden="true" />;
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="state" role="alert">
      <span className="state-icon" style={{ color: "var(--down)" }}>
        <WarnIcon size={22} />
      </span>
      <p>{t.states.loadError}</p>
      <button type="button" className="btn" onClick={onRetry}>
        {t.states.retry}
      </button>
    </div>
  );
}

export function Dashboard() {
  const { t } = useI18n();
  // Se calcula una vez al montar: el panel no cambia de día solo mientras está abierto.
  const [now] = useState(() => new Date());
  const today = toISODate(now);
  const minDate = addDays(today, -DEMO_HISTORY_DAYS + 1);

  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [custom, setCustom] = useState<DateRange>(() => defaultCustomRange(today));
  const range = useMemo(() => rangeForPeriod(period, today, custom), [period, today, custom]);
  const days = dayCount(range);
  // El mapa de calor necesita al menos una semana para tener todos los días.
  const heatRange = days >= 7 ? range : { from: addDays(today, -6), to: today };

  const stats = useStats(range);
  const heat = useDailyStats(heatRange);
  const orders = useOrders(range);
  const stock = useStock();

  const hour = localHour(now);
  const greeting = hour < 12 ? t.hello.morning : hour < 20 ? t.hello.afternoon : t.hello.evening;
  const vsLabel = period === "today" ? t.hello.vsToday : period === "custom" ? t.hello.vsCustom : t.hello.vsRange(days);

  const current = stats.data ? totals(stats.data.current) : null;
  // Hoy se compara contra el mismo día de la semana pasada hasta la misma hora.
  const previous = stats.data ? totals(stats.data.previous, period === "today" ? hour : undefined) : null;

  const dayLabel = (iso: string) => (days <= 14 ? `${t.weekdays[weekdayIndex(iso)]} ${Number(iso.slice(8))}` : shortDate(iso, t.locale));
  const rangeText = days === 1 ? shortDate(range.from, t.locale) : `${shortDate(range.from, t.locale)} – ${shortDate(range.to, t.locale)}`;
  const low = stock.data ? lowStock(stock.data) : [];

  return (
    <div className={styles.wrap}>
      <Header
        period={period}
        custom={custom}
        today={today}
        minDate={minDate}
        onPeriod={setPeriod}
        onCustom={(r) => {
          setCustom(r);
          setPeriod("custom");
        }}
      />

      <section className={styles.hello}>
        <div>
          <h1 className="serif">{greeting}</h1>
          <p>
            {capitalize(longDate(today, t.locale))} · {vsLabel}
          </p>
        </div>
      </section>

      {stats.isError ? (
        <LoadError onRetry={() => stats.refetch()} />
      ) : current && previous ? (
        <KpiCards current={current} previous={previous} vsLabel={vsLabel} />
      ) : (
        <div className={styles.kpis}>
          {[0, 1, 2, 3].map((i) => (
            <Loading key={i} height={150} />
          ))}
        </div>
      )}

      <div className={styles.grid}>
        <section className={`card ${styles.s8} ${styles.oLine}`} aria-labelledby="sales-title">
          <div className="card-head">
            <div>
              <h2 id="sales-title" className="card-title">
                {t.charts.salesTitle}
              </h2>
              <div className="card-sub">
                {rangeText} · {days === 1 ? t.charts.salesHourly : t.charts.salesDaily}
              </div>
            </div>
            <div className={styles.legend} aria-hidden="true">
              <span>
                <i />
                {t.charts.current}
              </span>
              <span className={styles.legendPrevItem}>
                <i className={styles.legendPrev} />
                {t.charts.previous}
              </span>
            </div>
          </div>
          {stats.data ? (
            <SalesChart current={stats.data.current} previous={stats.data.previous} hourly={days === 1} dayLabel={dayLabel} />
          ) : (
            <Loading height={260} />
          )}
        </section>

        <section className={`card ${styles.s4} ${styles.oCat}`} aria-labelledby="cat-title">
          <div className="card-head">
            <div>
              <h2 id="cat-title" className="card-title">
                {t.charts.categoriesTitle}
              </h2>
              <div className="card-sub">
                {t.charts.categoriesSub} · {rangeText}
              </div>
            </div>
          </div>
          {current ? <CategoryBars shares={categoryShares(current)} /> : <Loading />}
        </section>

        <div className={`${styles.leftCol} ${styles.s7}`}>
          <section className={`card ${styles.oHeat}`} aria-labelledby="heat-title">
            <div className="card-head">
              <div>
                <h2 id="heat-title" className="card-title">
                  {t.charts.heatTitle}
                </h2>
                <div className="card-sub">{days >= 7 ? t.charts.heatSub : t.charts.heatSubMin}</div>
              </div>
            </div>
            {heat.data ? <Heatmap days={heat.data} /> : <Loading />}
          </section>

          <section className={`card ${styles.oStock}`} aria-labelledby="stock-title">
            <div className="card-head">
              <div>
                <h2 id="stock-title" className="card-title">
                  {t.stock.title}
                </h2>
                <div className="card-sub">{t.stock.sub(low.length)}</div>
              </div>
              {low.length > 0 && (
                <span className={`badge ${styles.stockBadge}`}>
                  <WarnIcon size={14} /> {t.stock.badge}
                </span>
              )}
            </div>
            {stock.data ? <StockList items={low} /> : <Loading height={180} />}
          </section>
        </div>

        <section className={`card ${styles.s5} ${styles.oAi}`} aria-labelledby="ai-title">
          <AiSummary />
        </section>

        <section className={`card ${styles.s12} ${styles.oOrders}`} aria-labelledby="orders-title">
          {orders.isError ? (
            <LoadError onRetry={() => orders.refetch()} />
          ) : orders.data ? (
            <OrdersTable key={`${range.from}-${range.to}`} orders={orders.data} limited={orders.data.length >= ORDERS_LIMIT} />
          ) : (
            <Loading height={420} />
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        <span>{t.footer.left}</span>
        <span>{t.footer.right}</span>
      </footer>
    </div>
  );
}
