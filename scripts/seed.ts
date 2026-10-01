// Carga datos de demo en Firestore: 60 días de pedidos, sus estadísticas diarias
// preagregadas (dailyStats) y el stock. Uso:
//   FIREBASE_SERVICE_ACCOUNT_BASE64=... npm run seed
//
// Escribe unos 13.000 documentos (dentro de la cuota gratuita diaria de Firestore).

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, type WriteBatch } from "firebase-admin/firestore";
import { aggregateDay, DEMO_HISTORY_DAYS, demoStock, generateOrders } from "../src/lib/demo/generator";
import { addDays, eachDay, localHour, toISODate } from "../src/lib/period";

const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!encoded) {
  console.error("Falta FIREBASE_SERVICE_ACCOUNT_BASE64 (ver .env.example).");
  process.exit(1);
}

const app = initializeApp({ credential: cert(JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))) });
const db = getFirestore(app);

const now = new Date();
const today = toISODate(now);
const nowMinute = Math.floor(localHour(now) * 60);
const days = eachDay({ from: addDays(today, -DEMO_HISTORY_DAYS), to: today });

// Firestore admite hasta 500 escrituras por batch.
let batch: WriteBatch = db.batch();
let pending = 0;
let written = 0;
async function queue(fn: (b: WriteBatch) => void) {
  fn(batch);
  pending += 1;
  if (pending === 450) await flush();
}
async function flush() {
  if (pending === 0) return;
  await batch.commit();
  written += pending;
  batch = db.batch();
  pending = 0;
  process.stdout.write(`\r${written} documentos escritos…`);
}

for (const date of days) {
  const orders = generateOrders(date, date === today ? nowMinute : undefined);
  await queue((b) => b.set(db.collection("dailyStats").doc(date), aggregateDay(date, orders)));
  for (const o of orders) {
    await queue((b) => b.set(db.collection("orders").doc(String(o.id)), o));
  }
}
for (const item of demoStock({ today, nowMinute })) {
  await queue((b) => b.set(db.collection("stock").doc(item.id), item));
}
await flush();
console.log(`\nListo: ${days.length} días cargados hasta ${today}.`);
