Necesito diseñar un dashboard web con IA para mi portfolio de Frontend Developer. Es mi proyecto estrella: quiero un diseño estético, cálido y cuidado, que se sienta como la marca de una cafetería de especialidad y no como un template de SaaS. Detalle en espaciados, jerarquía y estados, y un solo gesto visual memorable.

## El producto
"Grano & Co.": panel de gestión de una cafetería de especialidad. Muestra ventas, productos y pedidos, y un asistente con IA (API de Claude) que resume la semana con insights accionables.
Stack: React + TypeScript + Next.js + Firebase. Datos de demo, ficticios pero realistas. Montos en USD. Interfaz bilingüe ES/EN (diseñar en español, con selector de idioma visible).

## Dirección visual: cálida y editorial
Referencias de tono: la carta de un café de especialidad, papel crema, packaging de café en grano, revistas gastronómicas. Aireado, suave y con personalidad, pero legible y usable a diario.

Tipografías:
- Fraunces (serif, 400–600, con eje óptico suave) para títulos y el nombre de la marca.
- Space Grotesk (400, 500) para la interfaz: textos, botones, rótulos y navegación.
- JetBrains Mono (400, 500) SÓLO para cifras en KPIs y tablas (números del mismo ancho).

Colores base (modo claro "crema" es el principal / modo oscuro "espresso"); derivá lo que falte y verificá AA:
- bg #F6F0E6 / #1A1411
- surface #FFFBF5 / #231B16
- fg #2B1D14 / #F3EBE0
- muted #6B5A4C / #BFAE9C
- border #E4D8C8 / #3A2E26 (solo decorativo: separar cards y filas, no llega a 3:1)
- border-strong #948070 / #806C5C (inputs, checkboxes, chips sin seleccionar y controles de tabla; cumple 3:1 sobre bg y surface)
- accent caramelo #A64A1A / #E08A4F (para acciones principales y el dato destacado)
- texto sobre accent #FFFBF5 / #1A1411

Rasgos:
- Radios suaves (10–14px en cards, 999px en chips y filtros).
- Sombras mínimas: como mucho una sombra muy difusa y cálida; preferir bordes finos.
- Textura de grano de papel muy sutil sobre el fondo.
- Espacio generoso; cards con respiro, no un tablero apretado.
- Ilustraciones o íconos de línea fina (taza, grano, croissant) usados con moderación.

## Lo que necesito que derives (en un artboard aparte, con contrastes)
- Paleta para las 5 categorías de producto, con tonos inspirados en ellas: café, pastelería, sándwiches, bebidas frías y café en grano. Tienen que convivir con el caramelo, que queda reservado para resaltar el dato principal.
- Escala secuencial para el mapa de calor (de crema a espresso, sin usar el caramelo), con leyenda y 3:1 entre los pasos extremos y el fondo.
- Color de la línea de evolución de ventas (neutro, tipo espresso), con el caramelo solo para el punto o dato destacado.
- Colores para la variación de KPIs (sube / baja / estable) y para "stock bajo" que se distingan también por ícono o forma, no sólo por color, y cumplan AA en ambos modos.

## Pantallas
1. Login: nombre y logo de Grano & Co., formulario email/contraseña y un botón destacado "Entrar como demo" (lo usan los recruiters, tiene que ser lo más visible).
2. Vista general en desktop (1440), modo claro:
   - Header con marca, filtro de período (Hoy / 7 días / 30 días / Personalizado), selector ES/EN y cambio de tema.
   - Fila de 4 KPIs con variación % contra el período anterior: ventas, ticket promedio, pedidos y producto más vendido.
   - Gráfico de evolución de ventas (línea) y participación por categoría (barras).
   - Mapa de calor de ventas por hora (7 a 21 h) y día de la semana.
   - Panel "Resumen de la semana" con IA: 3 hallazgos accionables, fecha de generación y botón "Regenerar".
   - Lista de productos con stock bajo.
   - Tabla de pedidos: número, hora, productos, total y medio de pago, con búsqueda, orden y paginación.
3. La misma vista en modo oscuro "espresso".
4. Estados del panel IA: cargando (skeleton, sin spinner genérico), error (con reintentar) y datos insuficientes. Además, estado vacío de la tabla de pedidos.
5. Vista general en mobile (390): KPIs en 2 columnas, gráficos simplificados, panel IA y tabla de pedidos convertida en lista.

## Gesto memorable (uno solo)
Cuando llega el resumen de IA, aparece como un ticket de café que se "imprime": el papel se despliega de arriba hacia abajo y los hallazgos van apareciendo línea por línea, con el borde inferior dentado típico de un ticket. Todo lo demás, sobrio. Con prefers-reduced-motion, el ticket aparece completo sin animación.

## Textos reales de ejemplo para el resumen IA
- "Los sábados entre las 17 y las 19 h concentran el 28% de las ventas del día. Conviene sumar una persona en barra en esa franja."
- "El cold brew creció 34% en las últimas dos semanas y queda stock para 3 días. Adelantá el pedido al proveedor."
- "Las medialunas se agotan antes de las 11 h los domingos: hay demanda sin cubrir por la mañana."

## Requisitos
- Accesibilidad AA: contraste, foco visible con el color de acento y targets de 44px mínimo.
- Los gráficos tienen que tener su dato accesible (tabla o resumen en texto).
- Textos en español, reales y concretos; nada de lorem ipsum.
- Evitar: degradados vistosos, glassmorphism, neón y la estética genérica de dashboard SaaS (azul y gris con cards idénticas).
