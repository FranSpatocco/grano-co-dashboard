"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clientAuth } from "./firebase/client";
import { firebaseEnabled } from "./firebase/config";
import { useStoredValue } from "./storage";

// Sesión del panel. Con Firebase: email/contraseña o anónima para la demo (las reglas de
// Firestore solo permiten lectura). Sin Firebase: una marca en sessionStorage.
//
// Firebase Auth se carga con import() solo cuando hace falta: al iniciar sesión, o al
// abrir la app si este navegador ya tenía una sesión (marca AUTH_HINT_KEY). En la
// primera visita el login no descarga ni ejecuta Firebase: es lo que más pesaba en la
// carga en celular.

export type SessionStatus = "loading" | "signed-in" | "signed-out";

interface SessionValue {
  status: SessionStatus;
  isDemo: boolean;
  email: string | null;
  signInDemo: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** ID token para llamar a /api/summary (null en modo demo sin Firebase). */
  idToken: () => Promise<string | null>;
}

export class InvalidCredentialsError extends Error {}
export class EmailLoginUnavailableError extends Error {}

const DEMO_KEY = "grano-demo-session";
/** "1" mientras hay una sesión de Firebase abierta en este navegador. */
const AUTH_HINT_KEY = "grano-auth-hint";
const INVALID_CREDENTIAL_CODES = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"];
const SessionContext = createContext<SessionValue | null>(null);

interface FirebaseState {
  status: SessionStatus;
  isDemo: boolean;
  email: string | null;
}

const SIGNED_OUT: FirebaseState = { status: "signed-out", isDemo: false, email: null };

export function SessionProvider({ children }: { children: ReactNode }) {
  // Modo Firebase: el estado llega por el callback de onAuthStateChanged.
  const [fb, setFb] = useState<FirebaseState>({ status: "loading", isDemo: false, email: null });
  // Modo demo sin Firebase: una marca en sessionStorage (null mientras no hay navegador).
  const [demoFlag, setDemoFlag] = useStoredValue("session", DEMO_KEY);
  const [authHint, setAuthHint] = useStoredValue("local", AUTH_HINT_KEY);
  const hadSession = authHint === "1";

  useEffect(() => {
    if (!firebaseEnabled || !hadSession) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    Promise.all([clientAuth(), import("firebase/auth")]).then(([auth, { onAuthStateChanged }]) => {
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setFb(user ? { status: "signed-in", isDemo: user.isAnonymous, email: user.email } : SIGNED_OUT);
        // La sesión venció o se cerró en otra pestaña: la próxima visita no carga Firebase.
        if (!user) setAuthHint(null);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [hadSession, setAuthHint]);

  const { status, isDemo, email }: FirebaseState = firebaseEnabled
    ? authHint === null
      ? { status: "loading", isDemo: false, email: null }
      : hadSession
        ? fb
        : SIGNED_OUT
    : {
        status: demoFlag === null ? "loading" : demoFlag === "1" ? "signed-in" : "signed-out",
        isDemo: demoFlag === "1",
        email: null,
      };

  const signInDemo = useCallback(async () => {
    if (!firebaseEnabled) {
      setDemoFlag("1");
      return;
    }
    const [auth, { signInAnonymously }] = await Promise.all([clientAuth(), import("firebase/auth")]);
    await signInAnonymously(auth);
    setFb({ status: "signed-in", isDemo: true, email: null });
    setAuthHint("1");
  }, [setDemoFlag, setAuthHint]);

  const signInWithEmail = useCallback(
    async (mail: string, password: string) => {
      if (!firebaseEnabled) throw new EmailLoginUnavailableError();
      const [auth, { signInWithEmailAndPassword }] = await Promise.all([clientAuth(), import("firebase/auth")]);
      try {
        const { user } = await signInWithEmailAndPassword(auth, mail, password);
        setFb({ status: "signed-in", isDemo: false, email: user.email });
        setAuthHint("1");
      } catch (e) {
        // Se compara el código en lugar de `instanceof FirebaseError` para no importar
        // firebase/app solo por la clase del error.
        const code = typeof e === "object" && e !== null && "code" in e ? String(e.code) : "";
        if (INVALID_CREDENTIAL_CODES.includes(code)) throw new InvalidCredentialsError();
        throw e;
      }
    },
    [setAuthHint],
  );

  const signOut = useCallback(async () => {
    if (!firebaseEnabled) {
      setDemoFlag(null);
      return;
    }
    const [auth, { signOut: fbSignOut }] = await Promise.all([clientAuth(), import("firebase/auth")]);
    await fbSignOut(auth);
    setFb(SIGNED_OUT);
    setAuthHint(null);
  }, [setDemoFlag, setAuthHint]);

  const idToken = useCallback(async () => {
    if (!firebaseEnabled) return null;
    const auth = await clientAuth();
    return (await auth.currentUser?.getIdToken()) ?? null;
  }, []);

  const value = useMemo(
    () => ({ status, isDemo, email, signInDemo, signInWithEmail, signOut, idToken }),
    [status, isDemo, email, signInDemo, signInWithEmail, signOut, idToken],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession tiene que usarse dentro de SessionProvider");
  return ctx;
}
