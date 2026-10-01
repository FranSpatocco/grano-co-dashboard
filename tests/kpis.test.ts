import { describe, expect, it } from "vitest";
import { categoryShares, heatLevel, pctChange, peakSlot, topProduct, totals, trendOf, weekdayHourMatrix } from "@/lib/kpis";
import { HOURS } from "@/lib/period";
import type { DailyStats } from "@/lib/schemas";

function day(date: string, hourSales: number[], extra: Partial<DailyStats> = {}): DailyStats {
  const sales = hourSales.reduce((a, b) => a + b, 0);
  return {
    date,
    sales,
    orders: hourSales.filter((v) => v > 0).length * 10,
    byCategory: { coffee: sales * 0.5, pastry: sales * 0.3, sandwich: sales * 0.2, cold: 0, beans: 0 },
    hourSales,
    hourOrders: hourSales.map((v) => (v > 0 ? 10 : 0)),
    products: { "flat-white": 40, medialuna: 55 },
    ...extra,
  };
}

const flat = (v: number) => HOURS.map(() => v);

describe("totals", () => {
  it("suma ventas y pedidos y calcula el ticket promedio", () => {
    const t = totals([day("2026-09-28", flat(100)), day("2026-09-29", flat(50))]);
    expect(t.sales).toBe(2250);
    expect(t.orders).toBe(300);
    expect(t.avgTicket).toBeCloseTo(7.5);
    expect(t.products.medialuna).toBe(110);
  });

  it("con corte horario solo cuenta las franjas anteriores y escala productos", () => {
    const t = totals([day("2026-09-22", flat(100))], 9); // 7 y 8 h
    expect(t.sales).toBe(200);
    expect(t.orders).toBe(20);
    expect(t.products["flat-white"]).toBeCloseTo((40 * 2) / 15);
  });

  it("sin días devuelve ceros sin dividir por cero", () => {
    const t = totals([]);
    expect(t.avgTicket).toBe(0);
    expect(topProduct(t)).toBeNull();
  });
});

describe("variación y tendencia", () => {
  it("calcula la variación porcentual", () => {
    expect(pctChange(108.4, 100)).toBeCloseTo(8.4);
    expect(pctChange(50, 0)).toBeNull();
  });

  it("entre −1% y +1% es estable", () => {
    expect(trendOf(0.6)).toBe("flat");
    expect(trendOf(-0.99)).toBe("flat");
    expect(trendOf(8.4)).toBe("up");
    expect(trendOf(-2.1)).toBe("down");
    expect(trendOf(null)).toBe("flat");
  });
});

describe("productos y categorías", () => {
  it("elige el producto más vendido", () => {
    expect(topProduct(totals([day("2026-09-28", flat(10))]))).toEqual({ id: "medialuna", qty: 55 });
  });

  it("ordena categorías por ventas y los porcentajes suman 100", () => {
    const shares = categoryShares(totals([day("2026-09-28", flat(10))]));
    expect(shares[0].category).toBe("coffee");
    expect(shares.reduce((a, s) => a + s.pct, 0)).toBeCloseTo(100);
  });
});

describe("mapa de calor", () => {
  it("promedia por día de la semana y detecta la franja pico", () => {
    const sat = flat(10);
    sat[10] = 100; // 17 h
    sat[11] = 100; // 18 h
    const m = weekdayHourMatrix([day("2026-09-26", sat), day("2026-09-28", flat(10))]);
    expect(m[5][10]).toBe(100); // sábado
    expect(m[0][0]).toBe(10); // lunes
    const peak = peakSlot(m);
    expect(peak).toMatchObject({ weekday: 5, fromHour: 17, toHour: 19 });
    expect(peak!.shareOfDay).toBeCloseTo((200 / 330) * 100);
  });

  it("asigna niveles de 1 a 5", () => {
    expect(heatLevel(0, 100)).toBe(1);
    expect(heatLevel(100, 100)).toBe(5);
    expect(heatLevel(50, 100)).toBe(3);
  });
});
