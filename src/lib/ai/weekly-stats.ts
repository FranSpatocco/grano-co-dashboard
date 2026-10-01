// Resume la última semana completa en un objeto chico: es lo que recibe Claude
// (y lo que usan las reglas cuando la IA no está configurada).

import { PRODUCT_BY_ID } from "../catalog";
import type { DataSource } from "../data/source";
import { categoryShares, pctChange, peakSlot, totals, weekdayHourMatrix } from "../kpis";
import { addDays, weekdayIndex, type DateRange } from "../period";

export const DAYS_REQUIRED = 7;
const WEEKDAYS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);
const money = (n: number) => Math.round(n);

export interface WeeklyStats {
  week: DateRange;
  daysWithSales: number;
  sales: number;
  salesChangePct: number | null;
  orders: number;
  ordersChangePct: number | null;
  avgTicket: number;
  avgTicketChangePct: number | null;
  dailySales: { date: string; weekday: string; sales: number }[];
  categories: { category: string; sharePct: number; changePct: number | null }[];
  products: { id: string; name: string; nameEn: string; units: number; changePct: number | null }[];
  peak: { weekday: string; weekdayIndex: number; fromHour: number; toHour: number; shareOfDayPct: number } | null;
  selloutSignals: { productId: string; name: string; nameEn: string; weekday: string; weekdayIndex: number; lastSaleHour: number }[];
  stock: { id: string; name: string; nameEn: string; onHand: number; unit: string; unitEn: string; daysLeft: number; belowMinimum: boolean }[];
}

/** Semana cerrada: los 7 días que terminan ayer. */
export function lastCompleteWeek(today: string): DateRange {
  return { from: addDays(today, -7), to: addDays(today, -1) };
}

export async function weeklyStats(source: DataSource, today: string): Promise<WeeklyStats> {
  const week = lastCompleteWeek(today);
  const prev = { from: addDays(week.from, -7), to: addDays(week.to, -7) };
  const [days, prevDays, orders, stock] = await Promise.all([
    source.dailyStats(week),
    source.dailyStats(prev),
    source.orders(week, 5000),
    source.stock(),
  ]);

  const cur = totals(days);
  const before = totals(prevDays);
  const prevShares = new Map(categoryShares(before).map((c) => [c.category, c.sales]));

  const peak = peakSlot(weekdayHourMatrix(days));

  // Productos de pastelería cuya última venta del día ocurre antes del mediodía:
  // señal de que se agotaron y quedó demanda sin cubrir.
  const lastSale = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items) {
      if (PRODUCT_BY_ID[it.productId]?.category !== "pastry") continue;
      const key = `${o.date}|${it.productId}`;
      lastSale.set(key, Math.max(lastSale.get(key) ?? 0, o.minute));
    }
  }
  const selloutSignals = [...lastSale]
    .filter(([, minute]) => minute < 12 * 60)
    .map(([key, minute]) => {
      const [date, productId] = key.split("|");
      const w = weekdayIndex(date);
      return {
        productId,
        name: PRODUCT_BY_ID[productId].name.es,
        nameEn: PRODUCT_BY_ID[productId].name.en,
        weekday: WEEKDAYS_ES[w],
        weekdayIndex: w,
        lastSaleHour: Math.ceil(minute / 60),
      };
    });

  return {
    week,
    daysWithSales: days.filter((d) => d.orders > 0).length,
    sales: money(cur.sales),
    salesChangePct: round1(pctChange(cur.sales, before.sales)),
    orders: cur.orders,
    ordersChangePct: round1(pctChange(cur.orders, before.orders)),
    avgTicket: Math.round(cur.avgTicket * 100) / 100,
    avgTicketChangePct: round1(pctChange(cur.avgTicket, before.avgTicket)),
    dailySales: days.map((d) => ({ date: d.date, weekday: WEEKDAYS_ES[weekdayIndex(d.date)], sales: money(d.sales) })),
    categories: categoryShares(cur).map((c) => ({
      category: c.category,
      sharePct: round1(c.pct)!,
      changePct: round1(pctChange(c.sales, prevShares.get(c.category) ?? 0)),
    })),
    products: Object.entries(cur.products)
      .map(([id, units]) => ({
        id,
        name: PRODUCT_BY_ID[id]?.name.es ?? id,
        nameEn: PRODUCT_BY_ID[id]?.name.en ?? id,
        units: Math.round(units),
        changePct: round1(pctChange(units, before.products[id] ?? 0)),
      }))
      .sort((a, b) => b.units - a.units),
    peak: peak && {
      weekday: WEEKDAYS_ES[peak.weekday],
      weekdayIndex: peak.weekday,
      fromHour: peak.fromHour,
      toHour: peak.toHour,
      shareOfDayPct: round1(peak.shareOfDay)!,
    },
    selloutSignals,
    stock: stock
      .map((s) => ({
        id: s.id,
        name: s.name.es,
        nameEn: s.name.en,
        onHand: s.onHand,
        unit: s.unit.es,
        unitEn: s.unit.en,
        daysLeft: Math.round((s.onHand / s.dailyUse) * 10) / 10,
        belowMinimum: s.onHand < s.minimum,
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft),
  };
}
