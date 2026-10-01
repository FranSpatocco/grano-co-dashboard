import "server-only";
import { adminDb, adminEnabled } from "../firebase/admin";
import { SummarySchema, type Summary } from "../schemas";

// Caché semanal de resúmenes y contador de usos por usuario y por día.
// Con Firebase Admin se guarda en Firestore; sin él, en memoria del proceso
// (alcanza para la demo, pero se pierde en cada arranque en frío de Vercel).

export interface SummaryStore {
  getSummary(key: string): Promise<Summary | null>;
  saveSummary(key: string, summary: Summary): Promise<void>;
  usage(userKey: string): Promise<number>;
  /** Suma un uso si no se pasó del límite. Devuelve false si ya estaba en el límite. */
  consume(userKey: string, limit: number): Promise<boolean>;
}

function memoryStore(): SummaryStore {
  const summaries = new Map<string, Summary>();
  const counters = new Map<string, number>();
  return {
    getSummary: async (key) => summaries.get(key) ?? null,
    saveSummary: async (key, s) => void summaries.set(key, s),
    usage: async (userKey) => counters.get(userKey) ?? 0,
    consume: async (userKey, limit) => {
      const n = counters.get(userKey) ?? 0;
      if (n >= limit) return false;
      counters.set(userKey, n + 1);
      return true;
    },
  };
}

function firestoreStore(): SummaryStore {
  return {
    async getSummary(key) {
      const db = await adminDb();
      const doc = await db.collection("aiSummaries").doc(key).get();
      const parsed = SummarySchema.safeParse(doc.data());
      return parsed.success ? parsed.data : null;
    },
    async saveSummary(key, s) {
      const db = await adminDb();
      await db.collection("aiSummaries").doc(key).set(s);
    },
    async usage(userKey) {
      const db = await adminDb();
      const doc = await db.collection("aiUsage").doc(userKey).get();
      return (doc.data()?.count as number | undefined) ?? 0;
    },
    async consume(userKey, limit) {
      const db = await adminDb();
      const { FieldValue } = await import("firebase-admin/firestore");
      const ref = db.collection("aiUsage").doc(userKey);
      return db.runTransaction(async (tx) => {
        const count = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0;
        if (count >= limit) return false;
        tx.set(ref, { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return true;
      });
    },
  };
}

// Se conserva entre requests del mismo proceso.
const globalForStore = globalThis as unknown as { summaryStore?: SummaryStore };
export function summaryStore(): SummaryStore {
  globalForStore.summaryStore ??= adminEnabled ? firestoreStore() : memoryStore();
  return globalForStore.summaryStore;
}
