// src/api.ts
import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

const TOKEN_KEYS = ["token", "authToken", "accessToken", "jwt", "novi_token"];

function getTokenFromStorage(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  const maybeAuth = localStorage.getItem("auth") || localStorage.getItem("novi_auth");
  if (maybeAuth) {
    try {
      const parsed = JSON.parse(maybeAuth);
      const t = parsed?.token || parsed?.accessToken || parsed?.jwt;
      if (typeof t === "string" && t.trim()) return t.trim();
    } catch {
      // ignore
    }
  }
  return null;
}

api.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) {
    // Axios v1: config.headers voi olla AxiosHeaders jossa on .set()
    const h: any = config.headers ?? {};
    if (typeof h.set === "function") {
      h.set("Authorization", `Bearer ${token}`);
    } else {
      h["Authorization"] = `Bearer ${token}`;
    }
    config.headers = h;
  }
  return config;
});
