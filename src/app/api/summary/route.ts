import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { AiRefusalError, aiEnabled, claudeFindings } from "@/lib/ai/claude";
import { ruleFindings } from "@/lib/ai/rules";
import { summaryStore } from "@/lib/ai/store";
import { DAYS_REQUIRED, lastCompleteWeek, weeklyStats } from "@/lib/ai/weekly-stats";
import { adminSource } from "@/lib/data/admin-source";
import { demoSource } from "@/lib/data/demo-source";
import { adminEnabled, adminProjectId } from "@/lib/firebase/admin";
import { verifyFirebaseIdToken } from "@/lib/firebase/verify-token";
import { toISODate } from "@/lib/period";
import type { Summary, SummaryError, SummaryResponse } from "@/lib/schemas";

// Resumen semanal con IA.
// GET  → devuelve el resumen de la semana (lo genera una sola vez por semana e idioma).
// POST → "Regenerar": cuenta contra el límite de 5 por usuario por día.

const DAILY_LIMIT = 5;
/** Tope global diario de llamadas a Claude, para acotar el costo si alguien abusa de la demo. */
const GLOBAL_DAILY_CAP = Number(process.env.AI_GLOBAL_DAILY_CAP ?? 200);

type Lang = "es" | "en";

function error(status: number, body: SummaryError) {
  return Response.json(body, { status });
}

/** Con Firebase Admin exige un ID token válido; en modo demo identifica por IP. */
async function identify(req: NextRequest): Promise<string | null> {
  if (adminEnabled) {
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    const projectId = adminProjectId();
    if (!token || !projectId) return null;
    try {
      return `uid:${await verifyFirebaseIdToken(token, projectId)}`;
    } catch {
      return null;
    }
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `ip:${ip}`;
}

function parseLang(value: unknown): Lang {
  return value === "en" ? "en" : "es";
}

async function buildSummary(lang: Lang, today: string, useAi: boolean): Promise<Summary | SummaryError> {
  const source = adminEnabled ? adminSource() : demoSource();
  const stats = await weeklyStats(source, today);
  if (stats.daysWithSales < DAYS_REQUIRED) {
    return { error: "insufficient_data", daysAvailable: stats.daysWithSales, daysRequired: DAYS_REQUIRED };
  }
  const base = {
    weekFrom: stats.week.from,
    weekTo: stats.week.to,
    orders: stats.orders,
    generatedAt: new Date().toISOString(),
    lang,
  };
  if (!useAi) return { ...base, findings: ruleFindings(stats, lang), source: "rules" };

  const store = summaryStore();
  if (!(await store.consume(`global_${today}`, GLOBAL_DAILY_CAP))) {
    return { error: "rate_limited" };
  }
  return { ...base, findings: await claudeFindings(stats, lang), source: "claude" };
}

async function respond(req: NextRequest, lang: Lang, regenerate: boolean) {
  const user = await identify(req);
  if (!user) return error(401, { error: "unauthorized" });

  const store = summaryStore();
  const today = toISODate(new Date());
  const usageKey = `${user}_${today}`.replace(/[/.]/g, "-");
  // Un resumen por semana cerrada, idioma y origen de datos.
  const weekKey = `${adminEnabled ? "firestore" : "demo"}_${lastCompleteWeek(today).from}_${lang}`;

  let summary = regenerate ? null : await store.getSummary(weekKey);
  // Si la IA se activó después de cachear un resumen por reglas, se regenera con Claude.
  if (summary && aiEnabled && summary.source === "rules") summary = null;

  if (regenerate) {
    if (!aiEnabled) return error(503, { error: "ai_unavailable" });
    if ((await store.usage(usageKey)) >= DAILY_LIMIT) return error(429, { error: "rate_limited" });
  }

  if (!summary) {
    let result: Summary | SummaryError;
    try {
      result = await buildSummary(lang, today, aiEnabled);
    } catch (e) {
      if (!(e instanceof AiRefusalError || e instanceof Anthropic.APIError)) throw e;
      console.error("Error de la API de Claude:", e.message);
      // "Regenerar" muestra el error; al cargar la página se cae al resumen automático.
      if (regenerate) return error(502, { error: "ai_unavailable" });
      result = await buildSummary(lang, today, false);
    }
    if ("error" in result) {
      return error(result.error === "insufficient_data" ? 422 : 429, result);
    }
    summary = result;
    await store.saveSummary(weekKey, summary);
    // Solo se descuenta del límite diario si el resumen salió bien.
    if (regenerate) await store.consume(usageKey, DAILY_LIMIT);
  }

  const used = await store.usage(usageKey);
  const body: SummaryResponse = {
    summary,
    remaining: Math.max(0, DAILY_LIMIT - used),
    limit: DAILY_LIMIT,
    aiEnabled,
  };
  return Response.json(body);
}

export async function GET(req: NextRequest) {
  return respond(req, parseLang(req.nextUrl.searchParams.get("lang")), false);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { lang?: unknown };
  return respond(req, parseLang(body.lang), true);
}
