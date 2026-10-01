import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FindingsSchema } from "../schemas";
import type { WeeklyStats } from "./weekly-stats";

export const MODEL = "claude-opus-5-5";

export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = {
  es: `Sos analista de negocio de "Grano & Co.", una cafetería de especialidad en Palermo (Buenos Aires) que abre de 7 a 22 h.
Recibís las estadísticas de la última semana cerrada en JSON; los montos están en pesos argentinos (escribilos como $ 18.420). Escribí exactamente 3 hallazgos accionables para el equipo del local, del más importante al menos importante.

Cada hallazgo:
- Nombra un dato concreto tomado del JSON (porcentaje, franja horaria, días de stock) y termina con una acción que el equipo pueda hacer esta semana.
- Tiene 1 o 2 oraciones, en español rioplatense (vos), sin tecnicismos ni emojis.
- Usa solo números presentes en los datos; no inventes cifras ni causas.

Priorizá lo que cambia decisiones: franjas que necesitan más personal, productos que crecen y pueden quedarse sin stock, faltantes que dejan demanda sin cubrir.`,
  en: `You are a business analyst for "Grano & Co.", a specialty coffee shop in Palermo (Buenos Aires) open 7:00–22:00.
You get last week's statistics as JSON; amounts are in Argentine pesos (write them as ARS 18,420). Write exactly 3 actionable findings for the shop team, most important first.

Each finding:
- Names one concrete figure from the JSON (a percentage, a time slot, days of stock left) and ends with an action the team can take this week.
- Is 1 or 2 sentences of plain English, no jargon, no emojis.
- Uses only numbers present in the data; never invent figures or causes.

Prioritize what changes decisions: time slots that need more staff, growing products that may run out of stock, sell-outs that leave demand unmet.`,
};

export class AiRefusalError extends Error {}

export async function claudeFindings(stats: WeeklyStats, lang: "es" | "en"): Promise<string[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(FindingsSchema) },
    // Si los clasificadores de seguridad rechazan el pedido, la API lo reintenta en otro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM[lang],
    messages: [{ role: "user", content: JSON.stringify(stats) }],
  });

  if (response.stop_reason === "refusal") throw new AiRefusalError("El modelo rechazó el pedido");
  const findings = response.parsed_output?.findings.map((f) => f.text.trim()).filter(Boolean) ?? [];
  if (findings.length < 3) throw new Error(`Respuesta incompleta: ${findings.length} hallazgos`);
  return findings.slice(0, 3);
}
