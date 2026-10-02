import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { firebaseConfig, firebaseEnabled } from "./config";

// El SDK se carga con import() recién cuando se usa: Auth al iniciar sesión (o si ya
// había una sesión guardada) y Firestore al pedir datos en el panel. Así el login no
// descarga ni ejecuta Firebase en la primera visita, que era lo que más frenaba la
// carga en celular (Lighthouse mobile ~70). Los `import type` no llegan al bundle.

let app: Promise<FirebaseApp> | undefined;
let auth: Promise<Auth> | undefined;

function firebaseApp(): Promise<FirebaseApp> {
  if (!firebaseEnabled) return Promise.reject(new Error("Firebase no está configurado"));
  app ??= import("firebase/app").then(({ getApps, initializeApp }) => getApps()[0] ?? initializeApp(firebaseConfig));
  return app;
}

/**
 * initializeAuth en lugar de getAuth: getAuth incluye el resolver de popup/redirect,
 * que descarga apis.google.com/js/api.js (la CSP lo bloquea y suma JavaScript). Este
 * panel solo usa login anónimo y email/contraseña, que no lo necesitan.
 */
export function clientAuth(): Promise<Auth> {
  auth ??= Promise.all([firebaseApp(), import("firebase/auth")]).then(
    ([firebase, { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth }]) =>
      initializeAuth(firebase, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] }),
  );
  return auth;
}

export async function clientDb(): Promise<Firestore> {
  const [firebase, { getFirestore }] = await Promise.all([firebaseApp(), import("firebase/firestore")]);
  return getFirestore(firebase);
}
