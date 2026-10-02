"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { demoSource } from "@/lib/data/demo-source";
import { firestoreSource } from "@/lib/data/firestore-source";
import { ORDERS_LIMIT, type DataSource } from "@/lib/data/source";
import { firebaseEnabled } from "@/lib/firebase/config";
import { previousRange, type DateRange } from "@/lib/period";

function useSource(): DataSource {
  return useMemo(() => (firebaseEnabled ? firestoreSource() : demoSource()), []);
}

/** Estadísticas del período elegido y del período de comparación. */
export function useStats(range: DateRange) {
  const source = useSource();
  const prev = previousRange(range);
  return useQuery({
    queryKey: ["stats", source.kind, range.from, range.to],
    queryFn: async () => {
      const [current, previous] = await Promise.all([source.dailyStats(range), source.dailyStats(prev)]);
      return { current, previous };
    },
  });
}

export function useOrders(range: DateRange) {
  const source = useSource();
  return useQuery({
    queryKey: ["orders", source.kind, range.from, range.to],
    queryFn: () => source.orders(range, ORDERS_LIMIT),
  });
}

export function useStock() {
  const source = useSource();
  return useQuery({ queryKey: ["stock", source.kind], queryFn: () => source.stock() });
}

/** Días sueltos, sin período de comparación (lo usa el mapa de calor). */
export function useDailyStats(range: DateRange) {
  const source = useSource();
  return useQuery({
    queryKey: ["daily", source.kind, range.from, range.to],
    queryFn: () => source.dailyStats(range),
  });
}
