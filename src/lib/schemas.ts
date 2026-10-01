import { z } from "zod";
import { CATEGORIES, PAYMENT_METHODS } from "./catalog";
import { HOURS } from "./period";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hourly = z.array(z.number().nonnegative()).length(HOURS.length);

export const DailyStatsSchema = z.object({
  date: isoDate,
  sales: z.number().nonnegative(),
  orders: z.number().int().nonnegative(),
  byCategory: z.record(z.enum(CATEGORIES), z.number().nonnegative()),
  hourSales: hourly,
  hourOrders: hourly,
  /** Unidades vendidas por producto. */
  products: z.record(z.string(), z.number().int().nonnegative()),
});
export type DailyStats = z.infer<typeof DailyStatsSchema>;

export const OrderItemSchema = z.object({
  productId: z.string(),
  qty: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const OrderSchema = z.object({
  id: z.number().int(),
  date: isoDate,
  /** Minutos desde la medianoche, hora local. */
  minute: z.number().int().min(0).max(1439),
  items: z.array(OrderItemSchema).min(1),
  total: z.number().nonnegative(),
  payment: z.enum(PAYMENT_METHODS),
});
export type Order = z.infer<typeof OrderSchema>;

export const StockItemSchema = z.object({
  id: z.string(),
  name: z.object({ es: z.string(), en: z.string() }),
  unit: z.object({ es: z.string(), en: z.string() }),
  onHand: z.number().nonnegative(),
  dailyUse: z.number().positive(),
  minimum: z.number().nonnegative(),
});
export type StockItem = z.infer<typeof StockItemSchema>;

// ---- Resumen con IA ----

export const FindingsSchema = z.object({
  findings: z
    .array(
      z.object({
        text: z.string().describe("Un hallazgo concreto con su dato y la acción sugerida, en 1 o 2 oraciones."),
      }),
    )
    .describe("Exactamente 3 hallazgos accionables, del más importante al menos importante."),
});

export const SummarySchema = z.object({
  findings: z.array(z.string()).length(3),
  weekFrom: isoDate,
  weekTo: isoDate,
  orders: z.number().int().nonnegative(),
  generatedAt: z.string(),
  source: z.enum(["claude", "rules"]),
  lang: z.enum(["es", "en"]),
});
export type Summary = z.infer<typeof SummarySchema>;

export const SummaryResponseSchema = z.object({
  summary: SummarySchema.nullable(),
  remaining: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  aiEnabled: z.boolean(),
});
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

export const SummaryErrorSchema = z.object({
  error: z.enum(["insufficient_data", "rate_limited", "unauthorized", "ai_unavailable", "bad_request"]),
  daysAvailable: z.number().int().optional(),
  daysRequired: z.number().int().optional(),
});
export type SummaryError = z.infer<typeof SummaryErrorSchema>;
