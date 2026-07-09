import { getApiBaseUrl } from "./env";

/** Turn stored upload paths or external URLs into a browser-loadable src. */
export function resolveImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  const base = getApiBaseUrl();
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${base}${path}`;
}
