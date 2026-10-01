import "server-only";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";

// Cuenta de servicio en base64 (JSON completo), solo en variables de entorno del servidor.
const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

export const adminEnabled = Boolean(encoded);

// firebase-admin se importa de forma dinámica: en modo demo no se carga nunca,
// y así la función de Vercel arranca más liviana.
let app: App | undefined;

async function adminApp(): Promise<App> {
  if (!encoded) throw new Error("Firebase Admin no está configurado");
  if (!app) {
    const { cert, getApps, initializeApp } = await import("firebase-admin/app");
    const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
  }
  return app;
}

export async function adminDb(): Promise<Firestore> {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(await adminApp());
}

export function adminProjectId(): string | undefined {
  if (!encoded) return undefined;
  return (JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as { project_id?: string }).project_id;
}
