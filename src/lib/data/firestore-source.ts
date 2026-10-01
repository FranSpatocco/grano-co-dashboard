import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { z } from "zod";
import { clientDb } from "../firebase/client";
import { DailyStatsSchema, OrderSchema, StockItemSchema } from "../schemas";
import type { DataSource } from "./source";

// Colecciones: dailyStats/{fecha}, orders/{id}, stock/{id}. Las escribe scripts/seed.ts.
// Cada documento se valida con Zod: si algo no coincide con el esquema, falla la consulta
// en lugar de mostrar datos rotos.

export function firestoreSource(): DataSource {
  const db = clientDb();
  return {
    kind: "firestore",
    async dailyStats(range) {
      const snap = await getDocs(
        query(collection(db, "dailyStats"), where("date", ">=", range.from), where("date", "<=", range.to), orderBy("date")),
      );
      return z.array(DailyStatsSchema).parse(snap.docs.map((d) => d.data()));
    },
    async orders(range, max) {
      const snap = await getDocs(
        query(
          collection(db, "orders"),
          where("date", ">=", range.from),
          where("date", "<=", range.to),
          orderBy("date", "desc"),
          orderBy("minute", "desc"),
          limit(max),
        ),
      );
      return z.array(OrderSchema).parse(snap.docs.map((d) => d.data()));
    },
    async stock() {
      const snap = await getDocs(collection(db, "stock"));
      return z.array(StockItemSchema).parse(snap.docs.map((d) => d.data()));
    },
  };
}
