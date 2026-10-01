// Carga pedidos en Firestore, sus estadísticas diarias preagregadas (dailyStats)
// y el stock. Uso:
//   FIREBASE_SERVICE_ACCOUNT_BASE64=... npm run seed              → últimos 60 días (~13.000 docs)
//   FIREBASE_SERVICE_ACCOUNT_BASE64=... npm run seed -- --days 1  → ayer y hoy (~450 docs)
//
// Los pedidos son determinísticos (mismo día → mismos documentos), así que volver a
// correrlo pisa los mismos documentos. GitHub Actions lo corre cada hora con --days 1
// para que "hoy" siempre tenga datos (.github/workflows/refresh-data.yml).

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
const daysArg = process.argv.indexOf("--days");
const back = daysArg > -1 ? Number(process.argv[daysArg + 1]) : DEMO_HISTORY_DAYS;
if (!Number.isInteger(back) || back < 0 || back > DEMO_HISTORY_DAYS) {
  console.error(`--days tiene que ser un entero entre 0 y ${DEMO_HISTORY_DAYS}.`);
  process.exit(1);
}
const days = eachDay({ from: addDays(today, -back), to: today });

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

async function main() {
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
