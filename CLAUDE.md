@AGENTS.md

# CLAUDE.md — Grano & Co. (Dashboard cafetería)

## Reglas de trabajo (leer primero)
- **Si ya hay código, leé los archivos relevantes antes de tocar nada.**
- **Bitácora obligatoria:** todo lo que se use, decida, descarte o resuelva se registra en `bitacora.txt` **en el momento**, en la fase que corresponda, con el formato del archivo:
  ```
  [DD/MM/AAAA] CATEGORÍA — Nombre
  Qué es: (una línea)
  Para qué lo usé: (en este proyecto)
  Por qué esto y no otra cosa:
  Lo que aprendí / problema que resolví:
  ```
  Categorías: STACK · HERRAMIENTA · DECISIÓN · DESCARTADO · PROBLEMA · CONCEPTO.
  Cuando se completa algo marcado "(completar)", se actualiza esa entrada en lugar de duplicarla.
- **MCP disponibles:** usar **context7** para consultar la documentación actual de Next.js, Recharts, TanStack Query, Firebase, Zod y Vitest antes de escribir código que dependa de su API. Next 16 trae su documentación en `node_modules/next/dist/docs/` (ver `AGENTS.md`). Usar la skill **claude-api** para todo lo que toque `@anthropic-ai/sdk`.
- **Verificación visual:** usar **playwright-cli** para abrir la app, sacar snapshots o capturas y revisar desktop (1440), mobile (390) y `prefers-reduced-motion`.
- Antes de dar algo por terminado: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` y una revisión con playwright-cli.
- Textos de la interfaz en español rioplatense, reales y concretos. Nada de lorem ipsum.

## Qué es
"Grano & Co." es un panel de gestión de una cafetería de especialidad que muestra ventas, productos y pedidos. Incluye un asistente con IA (API de Claude) que resume la semana con 3 hallazgos accionables.
Es el **proyecto estrella del portfolio de Frontend Developer**. Lo van a ver recruiters, así que tiene que ser impecable en diseño, accesibilidad y código. Los datos son ficticios pero realistas y los montos van en **pesos argentinos (ARS)**, sin centavos: un café cuesta entre $2.500 y $4.000.
- **La interfaz nunca dice "demo", "ficticio" ni nada que suene a prueba**: tiene que verse como un producto real (aplica también a nombres de clases CSS que terminan en el HTML).

## Stack y por qué
| Pieza | Uso | Motivo |
|---|---|---|
| Next.js 16 (App Router) + React 19 + TypeScript | App y Route Handlers | Estándar de la industria; la API de IA vive en el servidor |
| Firebase Auth + Firestore | Login y datos (opcional, ver "Modo demo") | Rápido de montar; con reglas de seguridad |
| Firebase Admin SDK + `jose` | Admin SDK para Firestore (caché/contadores); `jose` verifica el ID token en `/api/summary` | Nadie llama a la IA sin sesión válida |
| TanStack Query | Todas las lecturas de datos y el resumen IA | Caché, loading/error y reintentos sin código a mano |
| Recharts | Línea de evolución de ventas | La más usada en React. Categorías y mapa de calor son HTML/CSS propio: más accesible y fiel al diseño |
| Zod | Validar Firestore, la API y la salida estructurada de la IA | Tipado y validación en tiempo de ejecución |
| `@anthropic-ai/sdk` | Resumen semanal con `claude-opus-5-5` | La API key solo vive en el servidor |
| Vitest | Tests de cálculos de KPIs, fechas y generador de demo | Rápido y compatible con TS |
| CSS Modules + variables CSS | Estilos | Vienen con Next; los tokens del diseño son variables en `globals.css` |

## Decisiones ya tomadas
- **Solo modo claro "crema"** (30/09/2026). El modo oscuro "espresso" quedó fuera del alcance.
- **Estadísticas preagregadas:** se guardan los pedidos y además `dailyStats`. El panel lee `dailyStats` y no miles de pedidos, lo que reduce lecturas y costo.
- **Botón "Entrar al panel":** es el elemento más visible del login. Entra como invitado de solo lectura, sin registro.
- **Control de costos de la IA:** máximo 5 resúmenes por usuario por día, caché por semana cerrada e idioma, y un tope global diario (`AI_GLOBAL_DAILY_CAP`).
- **Bilingüe ES/EN:** el selector de idioma queda visible en el header y en el login.

## Modo demo y modo Firebase
- **Sin variables de entorno** la app corre en **modo demo**: `src/lib/demo/generator.ts` genera pedidos determinísticos (la misma fecha produce los mismos pedidos) para los últimos 60 días, relativos a hoy en hora de Buenos Aires. El login demo es una marca en `sessionStorage`.
- **Con `NEXT_PUBLIC_FIREBASE_*`** el panel lee Firestore (`src/lib/data/firestore-source.ts`) y usa Firebase Auth. La demo es una sesión anónima y las reglas solo permiten lectura.
- Las dos fuentes implementan la misma interfaz `DataSource` (`src/lib/data/source.ts`). Todo documento de Firestore se valida con Zod.
- **Resumen IA (`/api/summary`):**
  - Con `ANTHROPIC_API_KEY` usa `claude-opus-5-5` con salida estructurada (Zod), thinking adaptativo y `fallbacks: "default"`.
  - Sin clave, calcula los hallazgos con reglas (`src/lib/ai/rules.ts`) y el ticket lo aclara ("Resumen automático"). El sello "IA" solo aparece si el resumen lo generó Claude.
  - `GET` devuelve el resumen de la última semana cerrada (en caché). `POST` es "Regenerar" y cuenta contra el límite.
  - Con Firebase Admin exige ID token y guarda caché y contadores en Firestore; sin él, los guarda en memoria del proceso.

## Diseño — dirección "cálida y editorial"
Canvas en Claude Design: https://claude.ai/artifact/NMUcgS4k8n9VpmcV5r1T15
Tiene el tono de la carta de un café de especialidad, papel crema, packaging de café en grano y revistas gastronómicas. Es aireado y con personalidad, pero usable a diario.
**Evitar:** degradados vistosos, glassmorphism, neón y la estética SaaS genérica (azul y gris con cards idénticas).

### Tipografías (con `next/font/google`)
- **Fraunces** (eje óptico): títulos y nombre de la marca → clase `.serif`.
- **Space Grotesk** (400, 500): interfaz, textos, botones, rótulos y navegación.
- **JetBrains Mono** (400, 500): **solo** cifras en KPIs y tablas → clase `.mono`.

### Tokens de color
Los valores viven en `src/app/globals.css`. Los que usa Recharts se repiten en `src/lib/theme.ts`: mantenelos sincronizados.

| Token | Valor | Uso |
|---|---|---|
| bg | `#F6F0E6` | fondo |
| surface | `#FFFBF5` | cards |
| fg | `#2B1D14` | texto (14,4:1) |
| muted | `#6B5A4C` | texto secundario (5,8:1) |
| border | `#E4D8C8` | **solo decorativo** (cards, filas) |
| border-strong | `#948070` | inputs, chips y controles (≥3:1) |
| accent (caramelo) | `#A64A1A` | acción principal, dato destacado y foco (5,1:1) |
| on-accent | `#FFFBF5` | texto sobre caramelo |
| ticket | `#FFFFFF` | papel del ticket de IA (tiene que distinguirse de la card) |

- **Categorías:** café `#5C3A24` · pastelería `#9A6B1F` · sándwiches `#5A6B34` · bebidas frías `#2F6B78` · café en grano `#7D3448` (todas ≥4,5:1 sobre surface).
- **Estados**, siempre con ícono y texto para lectores de pantalla:
  - sube `#2F6A36` ↑
  - baja `#A12D3A` ↓
  - estable `#6B5A4C` →, entre −1% y +1%
  - stock bajo `#8A5A00` ⚠
- **Mapa de calor:** `#F1E4D0` `#DDBF98` `#BF9166` `#8A5E3C` `#4A2E1C`. No usa caramelo: el caramelo solo marca la franja pico.
- El caramelo se reserva para acciones principales y el dato destacado.

### Rasgos visuales
- Radios de 10–14px en cards y de 999px en chips y filtros.
- Sombras mínimas (como mucho una muy difusa y cálida); se prefieren bordes finos.
- Textura sutil de grano de papel sobre el fondo (`body::before`).
- Espaciado generoso, sin un tablero apretado.
- Íconos de línea fina (`src/components/icons.tsx`), siempre `aria-hidden`.

### Gesto memorable (el único)
El resumen de IA aparece como un **ticket de café que se imprime**: el papel sale de la ranura de arriba hacia abajo, los hallazgos aparecen línea por línea y el borde inferior es dentado. Con `prefers-reduced-motion` el ticket aparece completo, sin animación. Todo lo demás es sobrio.

## Pantallas
1. **Login (`/login`):** marca, ilustración, botón destacado "Entrar al panel" y formulario de email y contraseña.
2. **Vista general (`/`):**
   - Header con la marca, el filtro de período (Hoy / 7 días / 30 días / Personalizado), el selector ES/EN y el botón de salir.
   - 4 KPIs con variación % contra el período anterior: ventas, ticket promedio, pedidos y producto más vendido. "Hoy" se compara con el mismo día de la semana pasada hasta la misma hora.
   - Evolución de ventas (por hora si es un día, por día si es un rango) y ventas por categoría.
   - Mapa de calor por hora (7 a 21 h) y día de la semana, con al menos 7 días de datos.
   - Panel "Resumen de la semana" (IA) y lista de stock bajo.
   - Tabla de pedidos (número, hora, productos, total y medio de pago) con búsqueda, orden y paginación.
3. **Estados:**
   - Panel IA: cargando (skeleton), error (con reintentar), límite alcanzado y datos insuficientes.
   - Tabla de pedidos: sin resultados y período vacío.
4. **Mobile (≤760px):** KPIs en 2 columnas, mapa de calor en 5 franjas, panel IA antes del stock y pedidos como lista.

## Accesibilidad (AA, obligatorio)
- Contraste AA.
- Foco visible con el color de acento.
- Targets de 44px como mínimo.
- Cada gráfico tiene su dato accesible ("Ver los datos en una tabla").
- Respetar `prefers-reduced-motion`.

## i18n (ES/EN)
- Un diccionario por idioma (`src/i18n/es.ts`, `src/i18n/en.ts`) con **las mismas claves**. `es` es la fuente de verdad y `en` se tipa como `Dictionary`, así que una clave faltante es un error de TypeScript. Los textos con datos son funciones: `t.orders.showing(1, 10, 500)`.
- Los componentes leen los textos con `useT()` o `useI18n()`. El idioma se persiste en `localStorage` con `useStoredValue` (`useSyncExternalStore`, sin `setState` dentro de efectos).
- Montos y fechas con `Intl`, desde `src/lib/format.ts` (moneda siempre ARS, sin centavos).
- **Cualquier texto nuevo DEBE ir en ambos diccionarios.** No se escriben strings visibles directamente en el JSX.

## Estructura de carpetas
```
src/
  app/
    page.tsx                    # vista general (redirige a /login sin sesión)
    login/page.tsx
    api/summary/route.ts        # resumen IA
    globals.css                 # tokens + primitivas (.card, .btn, .chip, .pill, .state…)
  components/
    dashboard/                  # Header, KpiCards, SalesChart, CategoryBars, Heatmap,
                                # StockList, AiSummary (ticket), OrdersTable + CSS Modules
    icons.tsx  LanguageSwitch.tsx
  hooks/                        # useDashboardData (TanStack Query), useSummary
  i18n/                         # es.ts, en.ts, index.tsx
  lib/
    period.ts kpis.ts format.ts catalog.ts schemas.ts theme.ts storage.ts session.tsx
    data/                       # source.ts, demo-source.ts, firestore-source.ts, admin-source.ts
    demo/generator.ts           # datos de demo determinísticos
    ai/                         # weekly-stats.ts, claude.ts, rules.ts, store.ts
    firebase/                   # client.ts, admin.ts (server-only)
scripts/seed.ts                 # carga 60 días en Firestore (npm run seed)
tests/                          # Vitest
firestore.rules  firestore.indexes.json  .env.example
```
Colecciones de Firestore: `dailyStats`, `orders` y `stock` (lectura con sesión); `aiSummaries` y `aiUsage` (solo servidor).

## Variables de entorno
Ver `.env.example`.
- `ANTHROPIC_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_BASE64` y `AI_GLOBAL_DAILY_CAP` van **solo en el servidor** (nunca con el prefijo `NEXT_PUBLIC_`).
- La configuración pública de Firebase va con `NEXT_PUBLIC_FIREBASE_*`.
- `.env.local` nunca se commitea.

## Estado actual
- **Fase 0 (planificación):** hecha.
- **Fase 1 (diseño):** hecha (solo modo claro).
- **Fase 2 (desarrollo):** primera versión completa. Producción corre en **modo Firebase** (proyecto `grano-co-dashboard`, Firestore en `southamerica-east1`, Auth anónimo + email) y con el **resumen escrito por Claude** (`ANTHROPIC_API_KEY` + `ANTHROPIC_WORKSPACE_ID` en Vercel). Para cambiar la clave: `vercel env add ANTHROPIC_API_KEY production --sensitive` desde una terminal propia (con `!` no funciona porque es interactivo) y después redeploy.

## Firebase en producción
- Consola: https://console.firebase.google.com/project/grano-co-dashboard
- `.github/workflows/refresh-data.yml` recarga ayer y hoy cada hora (`npm run seed -- --days 1`) con el secreto `FIREBASE_SERVICE_ACCOUNT_BASE64`. Si se apaga, "Hoy" queda vacío en pocos días.
- Reglas e índices: editar `firestore.rules` / `firestore.indexes.json` y publicar con `firebase deploy --only firestore`.
- Si se agrega un dominio propio, sumarlo a los dominios autorizados de Firebase Auth o el login falla.
- La clave de la cuenta de servicio vive fuera del repo. Nunca imprimirla ni commitearla. Al consultar la API de configuración de Auth, mostrar solo los campos necesarios (la respuesta incluye `hashConfig`).
- **Fase 3 (deploy, seguridad y caso de estudio):** en curso. Publicado en https://grano-co-dashboard.vercel.app (proyecto Vercel `franco02/grano-co-dashboard`, modo demo). Deploy: `vercel --prod --yes`.

## Gotchas del deploy (no revertir sin probar en Vercel)
- `npm run build` usa `next build --webpack`: con Turbopack, `next/font/google` falla en el build de Vercel.
- `engines.node` es `22.x`.
- No usar `firebase-admin/auth` en el servidor: `jwks-rsa` hace `require()` de `jose` (ESM) y rompe en el runtime de Vercel. El ID token se verifica con `jose` en `src/lib/firebase/verify-token.ts`.
- `firebase-admin` se importa de forma dinámica (`src/lib/firebase/admin.ts`) para que el modo demo no lo cargue.
