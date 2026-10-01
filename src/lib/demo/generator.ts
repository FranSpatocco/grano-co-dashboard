// Generador determinístico de pedidos de demo. La misma fecha produce siempre los
// mismos pedidos, así la demo es estable entre recargas y coincide con el servidor.

import { CATEGORIES, PRODUCTS, type PaymentMethod, type Product } from "../catalog";
import { HOURS, OPEN_HOUR, addDays, weekdayIndex, type DateRange, eachDay } from "../period";
import type { DailyStats, Order, StockItem } from "../schemas";

const EPOCH = "2026-01-01";
const BASE_ORDERS = 200;
const MAX_ORDERS_PER_DAY = 299;
const WEEKDAY_FACTOR = [0.85, 0.9, 0.88, 0.95, 1.05, 1.35, 1.1];
/** Perfil de demanda por hora (7 a 21 h). */
const HOUR_PROFILE = [0.5, 0.95, 1, 0.8, 0.6, 0.72, 0.78, 0.55, 0.5, 0.62, 0.8, 0.78, 0.58, 0.34, 0.18];
const PAYMENTS: [PaymentMethod, number][] = [["card", 0.34], ["debit", 0.18], ["qr", 0.33], ["cash", 0.15]];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG mulberry32: rápido y suficiente para datos de demo. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(items: readonly T[], weights: readonly number[], r: number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let x = r * total;
  for (let i = 0; i < items.length; i++) {
    x -= weights[i];
    if (x < 0) return items[i];
  }
  return items[items.length - 1];
}

function daysSinceEpoch(iso: string): number {
  return Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${EPOCH}T12:00:00Z`)) / 86_400_000);
}

function hourWeights(weekday: number): number[] {
  return HOUR_PROFILE.map((w, i) => {
    const hour = OPEN_HOUR + i;
    if (weekday === 5 && (hour === 17 || hour === 18)) return w * 2.12; // sábado a la tarde
    if (weekday === 5 && hour === 19) return w * 1.5;
    if (weekday === 6 && hour >= 8 && hour <= 10) return w * 1.3; // domingo de mañana
    return w;
  });
}

function productWeight(p: Product, hour: number, weekday: number, coldBrewBoost: number): number {
  let w = p.weight;
  if (p.category === "pastry" && hour < 11) w *= 1.8;
  if (p.category === "sandwich") w *= hour >= 12 && hour <= 14 ? 2.2 : 0.6;
  if (p.category === "cold") w *= hour >= 14 ? 1.5 : 0.7;
  if (p.id === "cold-brew") w *= coldBrewBoost;
  // Los domingos las medialunas se agotan antes de las 11 h.
  if (p.id === "medialuna" && weekday === 6 && hour >= 11) w = 0;
  return w;
}

/**
 * Pedidos de un día. Si se pasa `untilMinute`, solo devuelve los ya ocurridos
 * (para que "hoy" muestre la jornada en curso).
 */
export function generateOrders(date: string, untilMinute = 24 * 60): Order[] {
  const r = rng(hashString(date));
  const weekday = weekdayIndex(date);
  const dayNum = daysSinceEpoch(date);
  // Tendencia suave de crecimiento y bebidas frías que suben con la primavera (sep–dic).
  const trend = 1 + (dayNum % 365) * 0.0006;
  const dayOfYear = ((dayNum % 365) + 365) % 365;
  const coldBrewBoost = 1 + 1.4 * Math.max(0, Math.min(1, (dayOfYear - 240) / 45));

  // Cada semana tiene su propio nivel (clima, feriados, eventos del barrio).
  const weekFactor = 0.9 + rng(hashString(`week-${Math.floor((dayNum + 3) / 7)}`))() * 0.2;
  const count = Math.min(
    MAX_ORDERS_PER_DAY,
    Math.round(BASE_ORDERS * WEEKDAY_FACTOR[weekday] * trend * weekFactor * (0.94 + r() * 0.12)),
  );
  const hw = hourWeights(weekday);
  const minutes = Array.from({ length: count }, () => {
    const hour = pickWeighted(HOURS, hw, r());
    return hour * 60 + Math.floor(r() * 60);
  }).sort((a, b) => a - b);

  const orders: Order[] = [];
  minutes.forEach((minute, i) => {
    const hour = Math.floor(minute / 60);
    const weights = PRODUCTS.map((p) => productWeight(p, hour, weekday, coldBrewBoost));
    const lines = 1 + Math.floor(r() * 3);
    const items = new Map<string, number>();
    for (let j = 0; j < lines; j++) {
      const p = pickWeighted(PRODUCTS, weights, r());
      const qty = p.id === "medialuna" ? (r() > 0.45 ? 2 : 1) : r() > 0.78 ? 2 : 1;
      items.set(p.id, (items.get(p.id) ?? 0) + qty);
    }
    const orderItems = [...items].map(([productId, qty]) => ({
      productId,
      qty,
      price: PRODUCTS.find((p) => p.id === productId)!.price,
    }));
    const total = Math.round(orderItems.reduce((a, it) => a + it.qty * it.price, 0) * 100) / 100;
    const payment = pickWeighted(PAYMENTS.map((p) => p[0]), PAYMENTS.map((p) => p[1]), r());
    if (minute < untilMinute) {
      orders.push({ id: 10_000 + dayNum * 300 + i, date, minute, items: orderItems, total, payment });
    }
  });
  return orders;
}

export function aggregateDay(date: string, orders: Order[]): DailyStats {
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as DailyStats["byCategory"];
  const hourSales = HOURS.map(() => 0);
  const hourOrders = HOURS.map(() => 0);
  const products: Record<string, number> = {};
  let sales = 0;
  for (const o of orders) {
    const h = Math.floor(o.minute / 60) - OPEN_HOUR;
    sales += o.total;
    hourSales[h] += o.total;
    hourOrders[h] += 1;
    for (const it of o.items) {
      const p = PRODUCTS.find((x) => x.id === it.productId)!;
      byCategory[p.category] += it.qty * it.price;
      products[it.productId] = (products[it.productId] ?? 0) + it.qty;
    }
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    date,
    sales: round(sales),
    orders: orders.length,
    byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, round(v)])) as DailyStats["byCategory"],
    hourSales: hourSales.map(round),
    hourOrders,
    products,
  };
}

export interface DemoClock {
  today: string;
  /** Minuto actual del día en el local. */
  nowMinute: number;
}

function cutoffFor(date: string, clock: DemoClock): number | undefined {
  if (date > clock.today) return 0;
  if (date === clock.today) return clock.nowMinute;
  return undefined;
}

export function demoOrders(range: DateRange, clock: DemoClock): Order[] {
  return eachDay(range).flatMap((d) => generateOrders(d, cutoffFor(d, clock)));
}

export function demoDailyStats(range: DateRange, clock: DemoClock): DailyStats[] {
  return eachDay(range)
    .filter((d) => d <= clock.today)
    .map((d) => aggregateDay(d, generateOrders(d, cutoffFor(d, clock))));
}

const STOCK_BASE: Omit<StockItem, "onHand">[] = [
  { id: "cold-brew-concentrado", name: { es: "Cold brew (concentrado)", en: "Cold brew (concentrate)" }, unit: { es: "L", en: "L" }, dailyUse: 2, minimum: 10 },
  { id: "medialunas", name: { es: "Medialunas", en: "Medialunas" }, unit: { es: "u.", en: "pcs" }, dailyUse: 95, minimum: 120 },
  { id: "leche-avena", name: { es: "Leche de avena", en: "Oat milk" }, unit: { es: "L", en: "L" }, dailyUse: 4, minimum: 12 },
  { id: "huila-250", name: { es: "Café en grano Huila 250 g", en: "Huila whole beans 250 g" }, unit: { es: "bolsas", en: "bags" }, dailyUse: 1.2, minimum: 12 },
  { id: "leche-entera", name: { es: "Leche entera", en: "Whole milk" }, unit: { es: "L", en: "L" }, dailyUse: 18, minimum: 36 },
  { id: "vasos-12oz", name: { es: "Vasos para llevar 12 oz", en: "12 oz takeaway cups" }, unit: { es: "u.", en: "pcs" }, dailyUse: 110, minimum: 400 },
];
const STOCK_ON_HAND = [6, 40, 8, 5, 90, 1500];

export function demoStock(clock: DemoClock): StockItem[] {
  const r = rng(hashString(`stock-${clock.today}`));
  return STOCK_BASE.map((s, i) => ({ ...s, onHand: Math.max(1, Math.round(STOCK_ON_HAND[i] * (0.9 + r() * 0.2))) }));
}

export function demoClock(now: Date, toISO: (d: Date) => string, hourOf: (d: Date) => number): DemoClock {
  return { today: toISO(now), nowMinute: Math.floor(hourOf(now) * 60) };
}

export const DEMO_HISTORY_DAYS = 60;
export function demoWindowStart(today: string): string {
  return addDays(today, -DEMO_HISTORY_DAYS);
}
