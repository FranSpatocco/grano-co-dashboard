import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Las variables NEXT_PUBLIC_ se incrustan en el bundle: tienen que leerse de forma literal.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Sin configuración de Firebase la app funciona en modo demo, con datos generados. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;

function firebaseApp(): FirebaseApp {
  if (!firebaseEnabled) throw new Error("Firebase no está configurado");
  app ??= getApps()[0] ?? initializeApp(config);
  return app;
}

export function clientAuth(): Auth {
  return getAuth(firebaseApp());
}

export function clientDb(): Firestore {
  return getFirestore(firebaseApp());
}
