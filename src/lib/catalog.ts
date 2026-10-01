// Carta de Grano & Co. Precios en pesos argentinos (ARS), valores de un café de
// especialidad en Palermo: un café va de $2.500 a $4.000.

export const CATEGORIES = ["coffee", "pastry", "sandwich", "cold", "beans"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: { es: string; en: string };
  category: Category;
  price: number;
  /** Popularidad relativa dentro de la carta. */
  weight: number;
}

export const PRODUCTS: Product[] = [
  { id: "espresso", name: { es: "Espresso", en: "Espresso" }, category: "coffee", price: 2500, weight: 5 },
  { id: "cortado", name: { es: "Cortado", en: "Cortado" }, category: "coffee", price: 3000, weight: 6 },
  { id: "flat-white", name: { es: "Flat white", en: "Flat white" }, category: "coffee", price: 3800, weight: 10 },
  { id: "latte", name: { es: "Latte", en: "Latte" }, category: "coffee", price: 3900, weight: 7 },
  { id: "cappuccino", name: { es: "Cappuccino", en: "Cappuccino" }, category: "coffee", price: 3700, weight: 5 },
  { id: "filtrado", name: { es: "Filtrado V60", en: "V60 pour-over" }, category: "coffee", price: 4000, weight: 3 },
  { id: "medialuna", name: { es: "Medialuna", en: "Medialuna (croissant)" }, category: "pastry", price: 1300, weight: 8 },
  { id: "croissant-almendras", name: { es: "Croissant de almendras", en: "Almond croissant" }, category: "pastry", price: 4200, weight: 3 },
  { id: "budin-limon", name: { es: "Budín de limón", en: "Lemon loaf" }, category: "pastry", price: 3200, weight: 2.5 },
  { id: "chipa", name: { es: "Chipá x4", en: "Chipá (4 pcs)" }, category: "pastry", price: 3000, weight: 2.5 },
  { id: "tostado", name: { es: "Tostado de jamón y queso", en: "Ham & cheese toastie" }, category: "sandwich", price: 6500, weight: 3.2 },
  { id: "pollo-palta", name: { es: "Sándwich de pollo y palta", en: "Chicken & avocado sandwich" }, category: "sandwich", price: 9800, weight: 2 },
  { id: "focaccia", name: { es: "Focaccia de vegetales", en: "Veggie focaccia" }, category: "sandwich", price: 8500, weight: 1.6 },
  { id: "cold-brew", name: { es: "Cold brew", en: "Cold brew" }, category: "cold", price: 4500, weight: 3.2 },
  { id: "limonada", name: { es: "Limonada de jengibre", en: "Ginger lemonade" }, category: "cold", price: 3800, weight: 2.2 },
  { id: "iced-latte", name: { es: "Iced latte", en: "Iced latte" }, category: "cold", price: 4600, weight: 1.8 },
  { id: "huila-250", name: { es: "Café en grano Huila 250 g", en: "Huila whole beans 250 g" }, category: "beans", price: 16500, weight: 0.7 },
  { id: "etiopia-250", name: { es: "Café en grano Etiopía 250 g", en: "Ethiopia whole beans 250 g" }, category: "beans", price: 19000, weight: 0.5 },
];

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const PAYMENT_METHODS = ["card", "debit", "qr", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
