import { describe, expect, it } from "vitest";
import { aggregateDay, demoDailyStats, generateOrders } from "@/lib/demo/generator";
import { addDays, dayCount, previousRange, rangeForPeriod, weekdayIndex } from "@/lib/period";
import { DailyStatsSchema, OrderSchema } from "@/lib/schemas";

describe("rangos de fechas", () => {
  it("arma los períodos contando el día de hoy", () => {
    expect(rangeForPeriod("7d", "2026-09-30")).toEqual({ from: "2026-09-24", to: "2026-09-30" });
    expect(dayCount(rangeForPeriod("30d", "2026-09-30"))).toBe(30);
  });

  it("compara un día contra el mismo día de la semana anterior", () => {
    expect(previousRange({ from: "2026-09-30", to: "2026-09-30" })).toEqual({ from: "2026-09-23", to: "2026-09-23" });
    expect(previousRange({ from: "2026-09-24", to: "2026-09-30" })).toEqual({ from: "2026-09-17", to: "2026-09-23" });
  });

  it("cruza fin de mes y calcula el día de la semana", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(weekdayIndex("2026-09-28")).toBe(0); // lunes
    expect(weekdayIndex("2026-10-04")).toBe(6); // domingo
  });
});

describe("generador de demo", () => {
  it("es determinístico y genera datos válidos", () => {
    const a = generateOrders("2026-09-26");
    expect(generateOrders("2026-09-26")).toEqual(a);
    expect(a.length).toBeGreaterThan(150);
    a.forEach((o) => OrderSchema.parse(o));
    DailyStatsSchema.parse(aggregateDay("2026-09-26", a));
  });

  it("respeta el corte horario del día en curso", () => {
    const orders = generateOrders("2026-09-30", 12 * 60);
    expect(orders.every((o) => o.minute < 12 * 60)).toBe(true);
  });

  it("no vende medialunas después de las 11 h los domingos", () => {
    const sunday = generateOrders("2026-09-27");
    const late = sunday.filter((o) => o.minute >= 11 * 60 && o.items.some((i) => i.productId === "medialuna"));
    expect(late).toHaveLength(0);
  });

  it("los agregados coinciden con los pedidos", () => {
    const [stats] = demoDailyStats({ from: "2026-09-26", to: "2026-09-26" }, { today: "2026-09-30", nowMinute: 600 });
    const orders = generateOrders("2026-09-26");
    expect(stats.orders).toBe(orders.length);
    expect(stats.sales).toBeCloseTo(orders.reduce((a, o) => a + o.total, 0), 1);
  });

  it("no genera días futuros", () => {
    const stats = demoDailyStats({ from: "2026-09-29", to: "2026-10-02" }, { today: "2026-09-30", nowMinute: 600 });
    expect(stats.map((s) => s.date)).toEqual(["2026-09-29", "2026-09-30"]);
  });
});
