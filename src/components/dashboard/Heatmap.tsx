"use client";

import { SparkIcon, TableIcon } from "@/components/icons";
import { useT } from "@/i18n";
import { money, pct } from "@/lib/format";
import { heatLevel, peakSlot, weekdayHourMatrix } from "@/lib/kpis";
import { HOURS } from "@/lib/period";
import type { DailyStats } from "@/lib/schemas";
import styles from "./dashboard.module.css";

/** Franjas para la versión mobile: 5 bloques de 3 horas. */
const BANDS = [
  { from: 7, to: 9 },
  { from: 10, to: 12 },
  { from: 13, to: 15 },
  { from: 16, to: 18 },
  { from: 19, to: 21 },
];

export function Heatmap({ days }: { days: DailyStats[] }) {
  const t = useT();
  const matrix = weekdayHourMatrix(days);
  const max = Math.max(...matrix.flat());
  const peak = peakSlot(matrix);
  const isPeak = (w: number, h: number) => peak !== null && w === peak.weekday && h >= peak.fromHour && h < peak.toHour;

  const bands = matrix.map((row) => BANDS.map((b) => row.slice(b.from - HOURS[0], b.to - HOURS[0] + 1).reduce((a, v) => a + v, 0)));
  const bandMax = Math.max(...bands.flat());
  const peakBand = peak ? BANDS.findIndex((b) => peak.fromHour >= b.from && peak.fromHour <= b.to) : -1;

  const aria = peak ? t.charts.heatAria(t.weekdaysLong[peak.weekday], peak.fromHour, peak.toHour) : t.charts.heatTitle;

  return (
    <>
      <div className={`${styles.heat} ${styles.heatDesktop}`} role="img" aria-label={aria}>
        <span />
        {HOURS.map((h) => (
          <span key={h} className={styles.hd}>
            {h}
          </span>
        ))}
        {matrix.map((row, w) => [
          <span key={`d${w}`} className={styles.dl}>
            {t.weekdays[w]}
          </span>,
          ...row.map((v, i) => (
            <span
              key={`${w}-${i}`}
              className={`${styles.cell} ${styles[`h${heatLevel(v, max)}`]} ${isPeak(w, HOURS[i]) ? styles.peak : ""}`}
              title={`${t.weekdays[w]} ${HOURS[i]} h · ${money(v, t.locale)}`}
            />
          )),
        ])}
      </div>

      <div className={styles.heatMobile}>
        <div className={`${styles.heat} ${styles.heatBands}`} role="img" aria-label={aria}>
          <span />
          {BANDS.map((b) => (
            <span key={b.from} className={styles.hd}>
              {b.from}–{b.to}
            </span>
          ))}
          {bands.map((row, w) => [
            <span key={`m${w}`} className={styles.dl}>
              {t.weekdays[w]}
            </span>,
            ...row.map((v, i) => (
              <span
                key={`m${w}-${i}`}
                className={`${styles.cell} ${styles[`h${heatLevel(v, bandMax)}`]} ${peak?.weekday === w && i === peakBand ? styles.peak : ""}`}
              />
            )),
          ])}
        </div>
      </div>

      <div className={styles.heatLegend}>
        {peak && (
          <span className={styles.callout}>
            <SparkIcon size={16} className={styles.calloutIcon} />
            <span>
              <strong style={{ fontWeight: 500 }}>{t.charts.peak}:</strong>{" "}
              {t.charts.peakText(t.weekdaysLong[peak.weekday], peak.fromHour, peak.toHour, pct(peak.shareOfDay, t.locale))}
            </span>
          </span>
        )}
        <span className={styles.scale} aria-hidden="true">
          {t.charts.less}
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`${styles.swatch} ${styles[`h${i}`]}`} />
          ))}
          {t.charts.more}
        </span>
      </div>

      <details className="data">
        <summary>
          <TableIcon size={16} /> {t.charts.viewData}
        </summary>
        <div className={styles.scrollX}>
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th scope="col">{t.charts.colDate}</th>
                {HOURS.map((h) => (
                  <th key={h} scope="col" className="num" style={{ padding: "8px 4px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, w) => (
                <tr key={w}>
                  <th scope="row" style={{ padding: "8px 4px" }}>
                    {t.weekdays[w]}
                  </th>
                  {row.map((v, i) => (
                    <td key={i} className="num" style={{ padding: "8px 4px" }}>
                      {Math.round(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
