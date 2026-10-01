// Hallazgos calculados sin IA: se usan cuando no hay ANTHROPIC_API_KEY, así la demo
// muestra un resumen real (con los números de la semana) y lo avisa en pantalla.

import { money } from "../format";
import type { WeeklyStats } from "./weekly-stats";

type Lang = "es" | "en";

const WEEKDAYS = {
  es: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"],
  en: ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"],
};
const WEEKDAYS_SINGULAR_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];

/** Relación entre productos de la carta y los insumos que los abastecen. */
const STOCK_FOR_PRODUCT: Record<string, string> = {
  "cold-brew": "cold-brew-concentrado",
  medialuna: "medialunas",
  "huila-250": "huila-250",
  "flat-white": "leche-entera",
  latte: "leche-entera",
};

const pct = (n: number) => `${Math.round(n)}%`;
const days = (n: number, lang: Lang) => {
  const d = Math.max(1, Math.round(n));
  return lang === "es" ? `${d} ${d === 1 ? "día" : "días"}` : `${d} ${d === 1 ? "day" : "days"}`;
};

export function ruleFindings(stats: WeeklyStats, lang: Lang): string[] {
  const out: string[] = [];

  // 1. Franja pico.
  if (stats.peak) {
    const { weekdayIndex, fromHour, toHour, shareOfDayPct } = stats.peak;
    out.push(
      lang === "es"
        ? `Los ${WEEKDAYS_SINGULAR_ES[weekdayIndex]} entre las ${fromHour} y las ${toHour} h concentran el ${pct(shareOfDayPct)} de las ventas del día. Conviene sumar una persona en barra en esa franja.`
        : `On ${WEEKDAYS.en[weekdayIndex]}, ${fromHour}:00–${toHour}:00 brings in ${pct(shareOfDayPct)} of the day's sales. Add one more person behind the bar for that slot.`,
    );
  }

  // 2. Producto que más creció, cruzado con su stock.
  const growing = stats.products
    .filter((p) => p.units >= 80 && p.changePct !== null && p.changePct > 5)
    .sort((a, b) => b.changePct! - a.changePct!)[0];
  if (growing) {
    const stock = stats.stock.find((s) => s.id === STOCK_FOR_PRODUCT[growing.id]);
    const name = lang === "es" ? growing.name : growing.nameEn;
    const lowStock = stock && stock.daysLeft <= 5;
    out.push(
      lang === "es"
        ? `${name} creció ${pct(growing.changePct!)} contra la semana anterior${lowStock ? ` y queda stock para ${days(stock.daysLeft, lang)}. Adelantá el pedido al proveedor.` : ". Revisá que el stock y la producción acompañen la demanda."}`
        : `${name} grew ${pct(growing.changePct!)} week over week${lowStock ? ` and there's stock for only ${days(stock.daysLeft, lang)}. Move the supplier order forward.` : ". Make sure stock and prep keep up with demand."}`,
    );
  }

  // 3. Faltantes antes del mediodía, o el insumo más crítico.
  const sellout = stats.selloutSignals.sort((a, b) => a.lastSaleHour - b.lastSaleHour)[0];
  if (sellout) {
    out.push(
      lang === "es"
        ? `${sellout.name === "Medialuna" ? "Las medialunas se agotan" : `${sellout.name} se agota`} antes de las ${sellout.lastSaleHour} h los ${WEEKDAYS.es[sellout.weekdayIndex]}: hay demanda sin cubrir por la mañana.`
        : `${sellout.nameEn} sells out before ${sellout.lastSaleHour}:00 on ${WEEKDAYS.en[sellout.weekdayIndex]}: morning demand is going unmet.`,
    );
  }

  const critical = stats.stock.find((s) => s.belowMinimum && !out.some((f) => f.includes(s.name) || f.includes(s.nameEn)));
  if (out.length < 3 && critical) {
    out.push(
      lang === "es"
        ? `${critical.name}: quedan ${critical.onHand} ${critical.unit}, alcanza para ${days(critical.daysLeft, lang)}. Pedilo antes de quedar por debajo del mínimo.`
        : `${critical.nameEn}: ${critical.onHand} ${critical.unitEn} left, enough for ${days(critical.daysLeft, lang)}. Reorder before it drops below the minimum.`,
    );
  }

  if (out.length < 3 && stats.salesChangePct !== null) {
    const up = stats.salesChangePct >= 0;
    out.push(
      lang === "es"
        ? `Las ventas ${up ? "subieron" : "bajaron"} ${pct(Math.abs(stats.salesChangePct))} contra la semana anterior, con un ticket promedio de ${money(stats.avgTicket, "es-AR")}.`
        : `Sales ${up ? "rose" : "fell"} ${pct(Math.abs(stats.salesChangePct))} week over week, with an average ticket of ${money(stats.avgTicket, "en-US")}.`,
    );
  }

  return out.slice(0, 3);
}
