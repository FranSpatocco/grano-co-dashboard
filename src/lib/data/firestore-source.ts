import { z } from "zod";
import { clientDb } from "../firebase/client";
import { DailyStatsSchema, OrderSchema, StockItemSchema } from "../schemas";
import type { DataSource } from "./source";

// Colecciones: dailyStats/{fecha}, orders/{id}, stock/{id}. Las escribe scripts/seed.ts.
// Cada documento se valida con Zod: si algo no coincide con el esquema, falla la consulta
// en lugar de mostrar datos rotos.
//
// El SDK de Firestore (el más pesado de Firebase) se carga con import() en la primera
// consulta del panel, no en el bundle inicial: el login nunca lo necesita.

async function firestore() {
  const [db, sdk] = await Promise.all([clientDb(), import("firebase/firestore")]);
  return { db, ...sdk };
}

export function firestoreSource(): DataSource {
  return {
    kind: "firestore",
    async dailyStats(range) {
      const { db, collection, getDocs, orderBy, query, where } = await firestore();
      const snap = await getDocs(
        query(collection(db, "dailyStats"), where("date", ">=", range.from), where("date", "<=", range.to), orderBy("date")),
      );
      return z.array(DailyStatsSchema).parse(snap.docs.map((d) => d.data()));
    },
    async orders(range, max) {
      const { db, collection, getDocs, limit, orderBy, query, where } = await firestore();
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
      const { db, collection, getDocs } = await firestore();
      const snap = await getDocs(collection(db, "stock"));
      return z.array(StockItemSchema).parse(snap.docs.map((d) => d.data()));
    },
  };
}
