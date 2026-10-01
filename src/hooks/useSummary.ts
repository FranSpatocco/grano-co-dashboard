"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Lang } from "@/i18n";
import { SummaryErrorSchema, SummaryResponseSchema, type SummaryError, type SummaryResponse } from "@/lib/schemas";
import { useSession } from "@/lib/session";

export class SummaryRequestError extends Error {
  constructor(public readonly detail: SummaryError) {
    super(detail.error);
  }
}

async function call(method: "GET" | "POST", lang: Lang, token: string | null): Promise<SummaryResponse> {
  const headers: HeadersInit = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(method === "GET" ? `/api/summary?lang=${lang}` : "/api/summary", {
    method,
    headers,
    body: method === "POST" ? JSON.stringify({ lang }) : undefined,
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = SummaryErrorSchema.safeParse(json);
    throw new SummaryRequestError(parsed.success ? parsed.data : { error: "ai_unavailable" });
  }
  return SummaryResponseSchema.parse(json);
}

export function useSummary(lang: Lang) {
  const { idToken } = useSession();
  const queryClient = useQueryClient();
  const key = ["summary", lang];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => call("GET", lang, await idToken()),
    staleTime: Infinity,
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: async () => call("POST", lang, await idToken()),
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });

  return { query, regenerate };
}
