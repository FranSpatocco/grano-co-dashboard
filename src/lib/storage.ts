"use client";

import { useCallback, useSyncExternalStore } from "react";

// Valor de localStorage/sessionStorage como estado de React, sin leerlo dentro de un
// efecto. En el servidor (y en el primer render) devuelve `null`.

type Area = "local" | "session";
const CHANGE_EVENT = "grano-storage";

function storage(area: Area): Storage | null {
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Navegadores que bloquean el almacenamiento (modo privado estricto).
    return null;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useStoredValue(area: Area, key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => storage(area)?.getItem(key) ?? "",
    () => null,
  );
  const set = useCallback(
    (next: string | null) => {
      const s = storage(area);
      try {
        if (next === null) s?.removeItem(key);
        else s?.setItem(key, next);
      } catch {}
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [area, key],
  );
  return [value, set];
}
