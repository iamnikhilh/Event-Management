import { tokenStore } from "./tokens";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export interface ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  payload?: unknown;
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  raw?: boolean; // if true, return raw Response (for CSV, blobs)
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const json = await res.json();
      const access = json?.data?.accessToken;
      const newRefresh = json?.data?.refreshToken ?? refresh;
      if (access) {
        tokenStore.setTokens(access, newRefresh);
        return access as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function doFetch(url: string, init: RequestInit, auth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, auth = true, raw = false, query, headers: hdrs, ...rest } = opts;
  const url = buildUrl(path, query);
  const headers = new Headers(hdrs);
  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  const init: RequestInit = { ...rest, headers, body: requestBody };

  let res = await doFetch(url, init, auth);

  if (res.status === 401 && auth && tokenStore.getRefresh() && !path.includes("/auth/")) {
    const newToken = await refreshAccess();
    if (newToken) {
      res = await doFetch(url, init, auth);
    }
  }

  if (raw) {
    if (!res.ok) throw await toError(res);
    return res as unknown as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok || (isJson && payload && payload.success === false)) {
    throw toApiError(res, payload);
  }

  // Backend returns { success, data, meta } — return the whole envelope so callers can access `meta`.
  return payload as T;
}

function toApiError(res: Response, payload: unknown): ApiError {
  const p = payload as { message?: string; errors?: Record<string, string[]> } | null;
  const err = new Error(p?.message || `Request failed with status ${res.status}`) as ApiError;
  err.status = res.status;
  err.errors = p?.errors;
  err.payload = payload;
  return err;
}

async function toError(res: Response): Promise<ApiError> {
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  return toApiError(res, payload);
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
  };
}
