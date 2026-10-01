// Cálculos puros sobre las estadísticas diarias. Sin dependencias de React ni de Firebase,
// para poder testearlos con Vitest.

import { CATEGORIES, type Category } from "./catalog";
import { HOURS, OPEN_HOUR, weekdayIndex } from "./period";
import type { DailyStats } from "./schemas";

export interface Totals {
  sales: number;
  orders: number;
  avgTicket: number;
  byCategory: Record<Category, number>;
  products: Record<string, number>;
}

export type Trend = "up" | "down" | "flat";

/**
 * Suma un conjunto de días. Con `untilHour` (para comparar "hoy" contra el mismo
 * día de la semana pasada) solo cuenta las franjas horarias anteriores.
 */
export function totals(days: DailyStats[], untilHour?: number): Totals {
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  const products: Record<string, number> = {};
  let sales = 0;
  let orders = 0;

  for (const d of days) {
    // Proporción del día incluida en el corte, para escalar categorías y productos.
    let share = 1;
    if (untilHour !== undefined) {
      const idx = HOURS.findIndex((h) => h >= untilHour);
      const upTo = idx === -1 ? HOURS.length : idx;
      const partSales = d.hourSales.slice(0, upTo).reduce((a, b) => a + b, 0);
      const partOrders = d.hourOrders.slice(0, upTo).reduce((a, b) => a + b, 0);
      share = d.sales > 0 ? partSales / d.sales : 0;
      sales += partSales;
      orders += partOrders;
    } else {
      sales += d.sales;
      orders += d.orders;
    }
    for (const c of CATEGORIES) byCategory[c] += d.byCategory[c] * share;
    for (const [id, qty] of Object.entries(d.products)) products[id] = (products[id] ?? 0) + qty * share;
  }

  return { sales, orders, avgTicket: orders > 0 ? sales / orders : 0, byCategory, products };
}

/** Variación porcentual; `null` si no hay base de comparación. */
export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Entre −1% y +1% se considera estable. */
export function trendOf(pct: number | null): Trend {
  if (pct === null || Math.abs(pct) < 1) return "flat";
  return pct > 0 ? "up" : "down";
}

export function topProduct(t: Totals): { id: string; qty: number } | null {
  let best: { id: string; qty: number } | null = null;
  for (const [id, qty] of Object.entries(t.products)) {
    if (!best || qty > best.qty) best = { id, qty };
  }
  return best && best.qty > 0 ? { id: best.id, qty: Math.round(best.qty) } : null;
}

export interface CategoryShare {
  category: Category;
  sales: number;
  pct: number;
}

export function categoryShares(t: Totals): CategoryShare[] {
  const total = CATEGORIES.reduce((a, c) => a + t.byCategory[c], 0);
  return CATEGORIES.map((category) => ({
    category,
    sales: t.byCategory[category],
    pct: total > 0 ? (t.byCategory[category] / total) * 100 : 0,
  })).sort((a, b) => b.sales - a.sales);
}

/** Ventas promedio por día de la semana (filas, lunes primero) y hora (columnas). */
export function weekdayHourMatrix(days: DailyStats[]): number[][] {
  const sums = Array.from({ length: 7 }, () => HOURS.map(() => 0));
  const counts = Array.from({ length: 7 }, () => 0);
  for (const d of days) {
    const w = weekdayIndex(d.date);
    counts[w] += 1;
    d.hourSales.forEach((v, i) => (sums[w][i] += v));
  }
  return sums.map((row, w) => row.map((v) => (counts[w] ? v / counts[w] : 0)));
}

export interface Peak {
  weekday: number;
  fromHour: number;
  toHour: number;
  /** Porcentaje de las ventas de ese día que concentra la franja. */
  shareOfDay: number;
}

/** Franja de dos horas consecutivas con más ventas promedio. */
export function peakSlot(matrix: number[][]): Peak | null {
  let best: Peak | null = null;
  let bestValue = -1;
  matrix.forEach((row, weekday) => {
    const dayTotal = row.reduce((a, b) => a + b, 0);
    for (let i = 0; i < row.length - 1; i++) {
      const v = row[i] + row[i + 1];
      if (v > bestValue && dayTotal > 0) {
        bestValue = v;
        best = { weekday, fromHour: OPEN_HOUR + i, toHour: OPEN_HOUR + i + 2, shareOfDay: (v / dayTotal) * 100 };
      }
    }
  });
  return best;
}

/** Divide un valor en 5 niveles (1–5) relativo al máximo, para la escala del mapa de calor. */
export function heatLevel(value: number, max: number): 1 | 2 | 3 | 4 | 5 {
  if (max <= 0 || value <= 0) return 1;
  return Math.min(5, 1 + Math.floor((value / max) * 5 * 0.9999)) as 1 | 2 | 3 | 4 | 5;
}
