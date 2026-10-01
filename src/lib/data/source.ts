import type { DateRange } from "../period";
import type { DailyStats, Order, StockItem } from "../schemas";

/** Origen de datos del panel: el generador de demo o Firestore, con la misma forma. */
export interface DataSource {
  kind: "demo" | "firestore";
  dailyStats(range: DateRange): Promise<DailyStats[]>;
  /** Pedidos del rango, del más reciente al más antiguo. */
  orders(range: DateRange, limit: number): Promise<Order[]>;
  stock(): Promise<StockItem[]>;
}

export const ORDERS_LIMIT = 500;
