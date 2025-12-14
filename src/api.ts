// !HUOM
// Täällä tiedostolla luodaan yksi ja sama axios instanssi,jota käytetään koko sovelluksessa
// eli kaikki api. tiedostot käyttää tätä api-instanssia omiin http kutsuihin, ei omaa axios.create() -instanssia!

import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";


const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

const TOKEN_KEYS = ["token", "authToken"] as const;

// haetaan eka löytyvä (ei-tyhjä) tokeni localStoragesta
const getTokenFromStorage = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key)?.trim();
    if (token) return token;
  }
  return null;
};

// interceptor laittaa authorization-headerrin automaattisesti kun token löytyy localstoragesta
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getTokenFromStorage();
  if (!token) return config;

  // headerit normalisoidaan AxiosHeaders-muotoon, niin typescript ei valita anystä
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;

  return config;
});

