// Tiny fetch wrapper. Holds NO imports (avoids a cycle with the auth store); the store plugs itself in below.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

let accessToken: string | null = null;
let refreshHandler: (() => Promise<boolean>) | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const setRefreshHandler = (h: () => Promise<boolean>) => { refreshHandler = h; };

export async function api<T = unknown>(path: string, init: RequestInit = {}, canRetry = true): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: "include", // sends/receives the HTTP-only refresh cookie
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  // Access token expired -> refresh once, then replay the request.
  if (res.status === 401 && canRetry && refreshHandler && !path.startsWith("/auth/")) {
    if (await refreshHandler()) return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "ERROR", body?.error?.message ?? res.statusText);
  return body as T;
}
