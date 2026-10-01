import "server-only";
import { z } from "zod";
import { adminDb } from "../firebase/admin";
import { DailyStatsSchema, OrderSchema, StockItemSchema } from "../schemas";
import type { DataSource } from "./source";

/** Misma interfaz que en el cliente, pero leyendo con el Admin SDK desde el servidor. */
export function adminSource(): DataSource {
  return {
    kind: "firestore",
    async dailyStats(range) {
      const db = await adminDb();
      const snap = await db
        .collection("dailyStats")
        .where("date", ">=", range.from)
        .where("date", "<=", range.to)
        .orderBy("date")
        .get();
      return z.array(DailyStatsSchema).parse(snap.docs.map((d) => d.data()));
    },
    async orders(range, max) {
      const db = await adminDb();
      const snap = await db
        .collection("orders")
        .where("date", ">=", range.from)
        .where("date", "<=", range.to)
        .orderBy("date", "desc")
        .orderBy("minute", "desc")
        .limit(max)
        .get();
      return z.array(OrderSchema).parse(snap.docs.map((d) => d.data()));
    },
    async stock() {
      const db = await adminDb();
      const snap = await db.collection("stock").get();
      return z.array(StockItemSchema).parse(snap.docs.map((d) => d.data()));
    },
  };
}
