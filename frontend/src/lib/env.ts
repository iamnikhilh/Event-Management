/** API base URL — uses build-time env, with a runtime fallback for production deploys. */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const runtime = (window as Window & { __API_BASE_URL__?: string }).__API_BASE_URL__;
    if (runtime) return runtime.replace(/\/$/, "");
  }

  return "http://localhost:4000/api/v1";
}
