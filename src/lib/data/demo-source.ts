import { demoDailyStats, demoOrders, demoStock, type DemoClock } from "../demo/generator";
import { localHour, toISODate } from "../period";
import type { DataSource } from "./source";

export function currentClock(now = new Date()): DemoClock {
  return { today: toISODate(now), nowMinute: Math.floor(localHour(now) * 60) };
}

export function demoSource(clock: () => DemoClock = () => currentClock()): DataSource {
  return {
    kind: "demo",
    dailyStats: async (range) => demoDailyStats(range, clock()),
    orders: async (range, limit) =>
      demoOrders(range, clock())
        .sort((a, b) => (a.date === b.date ? b.minute - a.minute : a.date < b.date ? 1 : -1))
        .slice(0, limit),
    stock: async () => demoStock(clock()),
  };
}
