import Cookies from "js-cookie";

// Access token: short-lived. Refresh token: longer-lived.
// Stored as cookies (per user request) — not localStorage.
// Client-set cookies, so `HttpOnly` cannot be applied here; use Secure + SameSite=Strict.
const ACCESS_KEY = "em_access_token";
const REFRESH_KEY = "em_refresh_token";

const commonOpts: Cookies.CookieAttributes = {
  sameSite: "strict",
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
  path: "/",
};

export const tokenStore = {
  getAccess: () => Cookies.get(ACCESS_KEY),
  getRefresh: () => Cookies.get(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    Cookies.set(ACCESS_KEY, access, { ...commonOpts, expires: 1 }); // 1 day
    Cookies.set(REFRESH_KEY, refresh, { ...commonOpts, expires: 30 }); // 30 days
  },
  clear: () => {
    Cookies.remove(ACCESS_KEY, { path: "/" });
    Cookies.remove(REFRESH_KEY, { path: "/" });
  },
};
