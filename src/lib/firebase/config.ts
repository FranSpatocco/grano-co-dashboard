// Configuración del cliente de Firebase, separada del SDK a propósito: saber si
// Firebase está activo no tiene que descargar Firebase. Antes, importar
// `firebaseEnabled` desde client.ts metía app + auth + firestore en el bundle del
// login, aunque el login no los use hasta tocar "Entrar al panel".

// Las variables NEXT_PUBLIC_ se incrustan en el bundle: tienen que leerse de forma literal.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Sin configuración de Firebase la app funciona en modo demo, con datos generados. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
