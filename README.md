# Grano & Co. — Panel de gestión

[![CI](https://github.com/FranSpatocco/grano-co-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/FranSpatocco/grano-co-dashboard/actions/workflows/ci.yml)

Dashboard de una cafetería de especialidad **ficticia** de Palermo (proyecto de portfolio, datos simulados): ventas, productos, pedidos y stock en una sola pantalla, con un **resumen semanal generado con la API de Claude** que aparece como un ticket de café que se imprime.

**En vivo:** https://grano-co-dashboard.vercel.app · **Caso de estudio:** https://franco-spatocco.vercel.app/es/projects/ai-dashboard

## Qué incluye

- **KPIs** (ventas, ticket promedio, pedidos y más vendido) con variación contra el período anterior. "Hoy" se compara con el mismo día de la semana pasada hasta la misma hora.
- **Evolución de ventas** (Recharts), **ventas por categoría** y **mapa de calor** por hora y día de la semana.
- **Resumen de la semana con IA:** 3 hallazgos accionables, con caché semanal y límite de 5 por usuario por día.
- **Stock bajo** y **tabla de pedidos** con búsqueda, orden y paginación (en mobile pasa a ser una lista).
- **Español e inglés**, accesibilidad AA (foco visible, targets de 44 px, datos de cada gráfico en tabla) y `prefers-reduced-motion`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · TanStack Query · Recharts · Zod · Firebase (Auth + Firestore) · `@anthropic-ai/sdk` · Vitest · CSS Modules · Vercel

## Decisiones técnicas

- **Datos:** sin configuración, la app genera pedidos realistas de forma determinística (60 días relativos a hoy, hora de Buenos Aires). Con las variables de Firebase lee Firestore; las dos fuentes implementan la misma interfaz `DataSource`.
- **Estadísticas preagregadas:** el panel lee resúmenes diarios (`dailyStats`), no miles de pedidos.
- **IA en el servidor:** `/api/summary` usa `claude-opus-5-5` con salida estructurada validada con Zod. La API key nunca llega al navegador. Sin clave, el resumen se calcula con reglas sobre los mismos datos.
- **Si la IA falla, el panel no se rompe:** al cargar se usa el resumen por reglas y solo "Regenerar" muestra el error (y no descuenta del límite diario).
- **Datos siempre frescos:** un workflow de GitHub Actions recarga ayer y hoy en Firestore cada hora; como los pedidos son determinísticos, pisa los mismos documentos.

> Desarrollado con Claude Code como asistente de programación. Las decisiones de producto, diseño y arquitectura son mías y quedaron registradas en el momento en `bitacora.txt`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest
npm run typecheck
npm run lint
npm run build
```

Variables opcionales en `.env.example` (IA y Firebase). Para cargar datos en Firestore: `npm run seed`.
