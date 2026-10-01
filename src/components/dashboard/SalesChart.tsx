"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type DotItemDotProps } from "recharts";
import { TableIcon } from "@/components/icons";
import { useT } from "@/i18n";
import { money } from "@/lib/format";
import { HOURS } from "@/lib/period";
import type { DailyStats } from "@/lib/schemas";
import { COLORS } from "@/lib/theme";
import styles from "./dashboard.module.css";

interface Point {
  label: string;
  current: number;
  previous: number | null;
}

interface Props {
  current: DailyStats[];
  previous: DailyStats[];
  /** Un solo día: se grafica por hora. */
  hourly: boolean;
  dayLabel: (iso: string) => string;
}

function buildPoints({ current, previous, hourly, dayLabel }: Props): Point[] {
  if (hourly) {
    const cur = current[0];
    const prev = previous[0];
    return HOURS.map((h, i) => ({
      label: `${h} h`,
      current: cur?.hourSales[i] ?? 0,
      previous: prev ? prev.hourSales[i] : null,
    }));
  }
  return current.map((d, i) => ({
    label: dayLabel(d.date),
    current: d.sales,
    previous: previous[i]?.sales ?? null,
  }));
}

export function SalesChart(props: Props) {
  const t = useT();
  const points = buildPoints(props);
  const bestIndex = points.reduce((best, p, i) => (p.current > points[best].current ? i : best), 0);
  const best = points[bestIndex];
  const compact = (v: number) => new Intl.NumberFormat(t.locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);

  function Dot(dot: DotItemDotProps) {
    const { cx, cy, index } = dot;
    if (cx === undefined || cy === undefined) return null;
    if (index === bestIndex) {
      return <circle key={`dot-${index}`} cx={cx} cy={cy} r={6.5} fill={COLORS.accent} stroke={COLORS.surface} strokeWidth={3} />;
    }
    if (points.length > 16) return <g key={`dot-${index}`} />;
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3.5} fill={COLORS.surface} stroke={COLORS.fg} strokeWidth={2} />;
  }

  return (
    <>
      <div className={styles.chartBox}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
            <title>{t.charts.salesTitle}</title>
            <desc>{best ? t.charts.best(best.label, money(best.current, t.locale)) : ""}</desc>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: COLORS.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.border }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={compact}
              tick={{ fill: COLORS.muted, fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: COLORS.border }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className={styles.tooltip}>
                    <strong>{label}</strong>
                    {payload.map((p) => (
                      <div key={String(p.dataKey)} className="mono">
                        {p.dataKey === "current" ? t.charts.current : t.charts.previous}: {money(Number(p.value), t.locale)}
                      </div>
                    ))}
                  </div>
                ) : null
              }
            />
            <Line
              className={styles.legendPrevItem}
              type="monotone"
              dataKey="previous"
              stroke={COLORS.muted}
              strokeWidth={1.5}
              strokeDasharray="4 5"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke={COLORS.fg}
              strokeWidth={2.5}
              dot={Dot}
              activeDot={{ r: 5, fill: COLORS.fg, stroke: COLORS.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {best && <p className="sr-only">{t.charts.best(best.label, money(best.current, t.locale))}</p>}
      <details className="data">
        <summary>
          <TableIcon size={16} /> {t.charts.viewData}
        </summary>
        <div className={styles.scrollX}>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{props.hourly ? t.charts.colHour : t.charts.colDate}</th>
                <th scope="col" className="num">
                  {t.charts.colCurrent}
                </th>
                <th scope="col" className="num">
                  {t.charts.colPrevious}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.label}>
                  <th scope="row">{p.label}</th>
                  <td className="num">{money(p.current, t.locale)}</td>
                  <td className="num">{p.previous === null ? "—" : money(p.previous, t.locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
