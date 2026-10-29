import type { ApiResponse } from "./api";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ClientApiError(0, "NETWORK_ERROR", "Network error. Check your connection and try again.");
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body || !body.success) {
    const err = body && !body.success ? body.error : null;
    if (res.status === 401 && typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      window.location.replace(new URL(`/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin).toString());
    }
    throw new ClientApiError(res.status, err?.code ?? "UNKNOWN", err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return body.data;
}

export const fetcher = <T,>(url: string) => apiFetch<T>(url);
