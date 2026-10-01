// Colores para Recharts: los atributos SVG que genera no leen variables CSS de forma
// confiable, así que se repiten acá. Mantener sincronizado con globals.css.

import type { Category } from "./catalog";

export const COLORS = {
  fg: "#2B1D14",
  muted: "#6B5A4C",
  border: "#E4D8C8",
  surface: "#FFFBF5",
  accent: "#A64A1A",
} as const;

export const CATEGORY_VAR: Record<Category, string> = {
  coffee: "var(--cat-coffee)",
  pastry: "var(--cat-pastry)",
  sandwich: "var(--cat-sandwich)",
  cold: "var(--cat-cold)",
  beans: "var(--cat-beans)",
};
