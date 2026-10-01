"use client";

import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clientAuth, firebaseEnabled } from "./firebase/client";
import { useStoredValue } from "./storage";

// Sesión del panel. Con Firebase: email/contraseña o anónima para la demo (las reglas de
// Firestore solo permiten lectura). Sin Firebase: una marca en sessionStorage.

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
const SessionContext = createContext<SessionValue | null>(null);

interface FirebaseState {
  status: SessionStatus;
  isDemo: boolean;
  email: string | null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Modo Firebase: el estado llega por el callback de onAuthStateChanged.
  const [fb, setFb] = useState<FirebaseState>({ status: "loading", isDemo: false, email: null });
  // Modo demo sin Firebase: una marca en sessionStorage (null mientras no hay navegador).
  const [demoFlag, setDemoFlag] = useStoredValue("session", DEMO_KEY);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(clientAuth(), (user) => {
      setFb({ status: user ? "signed-in" : "signed-out", isDemo: Boolean(user?.isAnonymous), email: user?.email ?? null });
    });
  }, []);

  const { status, isDemo, email }: FirebaseState = firebaseEnabled
    ? fb
    : {
        status: demoFlag === null ? "loading" : demoFlag === "1" ? "signed-in" : "signed-out",
        isDemo: demoFlag === "1",
        email: null,
      };

  const signInDemo = useCallback(async () => {
    if (firebaseEnabled) {
      await signInAnonymously(clientAuth());
      return;
    }
    setDemoFlag("1");
  }, [setDemoFlag]);

  const signInWithEmail = useCallback(async (mail: string, password: string) => {
    if (!firebaseEnabled) throw new EmailLoginUnavailableError();
    try {
      await signInWithEmailAndPassword(clientAuth(), mail, password);
    } catch (e) {
      if (e instanceof FirebaseError && ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(e.code)) {
        throw new InvalidCredentialsError();
      }
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseEnabled) {
      await fbSignOut(clientAuth());
      return;
    }
    setDemoFlag(null);
  }, [setDemoFlag]);

  const idToken = useCallback(async () => {
    if (!firebaseEnabled) return null;
    return (await clientAuth().currentUser?.getIdToken()) ?? null;
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
