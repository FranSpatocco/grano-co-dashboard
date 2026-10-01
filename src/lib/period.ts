// Rangos de fechas en la zona horaria del local (Buenos Aires, sin horario de verano).
// Todas las fechas viajan como strings ISO "YYYY-MM-DD" para evitar corrimientos de zona.

export const TIME_ZONE = "America/Argentina/Buenos_Aires";
export const OPEN_HOUR = 7;
export const CLOSE_HOUR = 21; // última franja horaria: 21 a 22 h
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => OPEN_HOUR + i);

export type PeriodKey = "today" | "7d" | "30d" | "custom";

export interface DateRange {
  from: string;
  to: string; // inclusive
}

const DAY_MS = 86_400_000;

export function toISODate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Hora actual del local, con decimales (ej. 17.5 = 17:30). */
export function localHour(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

function toUTC(iso: string): number {
  return Date.parse(`${iso}T12:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Cantidad de días entre dos fechas, contando ambas. */
export function dayCount(range: DateRange): number {
  return Math.round((toUTC(range.to) - toUTC(range.from)) / DAY_MS) + 1;
}

export function eachDay(range: DateRange): string[] {
  const n = dayCount(range);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(range.from, i));
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(iso: string): number {
  return (new Date(toUTC(iso)).getUTCDay() + 6) % 7;
}

export function rangeForPeriod(period: PeriodKey, today: string, custom?: DateRange): DateRange {
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "custom":
      return custom ?? { from: addDays(today, -6), to: today };
  }
}

/**
 * Período de comparación. Para un solo día se compara contra el mismo día de la
 * semana anterior (un martes contra un martes); para rangos, contra el bloque previo
 * de igual duración.
 */
export function previousRange(range: DateRange): DateRange {
  const n = dayCount(range);
  const shift = n === 1 ? 7 : n;
  return { from: addDays(range.from, -shift), to: addDays(range.to, -shift) };
}
