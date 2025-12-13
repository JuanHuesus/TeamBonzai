// api.ts
// Tämä tiedosto luo projektin “yhteisen” Axios-instanssin (api),
// jota muut api.* -tiedostot käyttävät HTTP-kutsuihin.
// Tärkein idea:
// - baseURL tulee envistä (VITE_API_BASE_URL) tai fallbackina "/api"
// - Authorization-header lisätään automaattisesti, jos localStoragessa on token

import axios from "axios"; // HTTP-client kirjasto (GET/POST/PUT/DELETE jne.)

// baseURL = mihin backendin API löytyy
// 1) jos VITE_API_BASE_URL on määritelty (esim. "http://localhost:5100/api"),
//    käytetään sitä ja poistetaan lopusta mahdollinen "/".
// 2) muuten käytetään "/api" (toimii esim. dev-proxyllä tai samassa domainissa)
const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

// Luodaan axios-instanssi projektin oletusasetuksilla.
// Tätä käytetään kaikkialla, jotta asetukset (baseURL + headerit) pysyvät samoina.
export const api = axios.create({
  baseURL, // kaikki pyynnöt menee tähän baseen: api.get("/services") -> {baseURL}/services
  headers: { "Content-Type": "application/json" }, // oletetaan JSON-bodyt
  withCredentials: false, // ei lähetetä cookieita (tunnistus tehdään bearer-tokenilla)
});

// Mahdolliset localStorage-avaimet joista tokenia on joskus tallennettu.
// Tämä on “yhteensopivuuslista”: jos projektissa on ollut eri nimiä eri vaiheissa.
const TOKEN_KEYS = ["token", "authToken", "accessToken", "jwt", "novi_token"];

/**
 * Hakee tokenin localStoragesta.
 * Ensin yritetään suorat avaimet (TOKEN_KEYS),
 * sitten yritetään "auth"/"novi_auth" JSON-objekti (jos token on tallennettu sinne).
 */
function getTokenFromStorage(): string | null {
  // 1) kokeile suorat string-avaimet
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  // 2) kokeile auth-objektia (JSON string)
  const maybeAuth = localStorage.getItem("auth") || localStorage.getItem("novi_auth");
  if (maybeAuth) {
    try {
      const parsed = JSON.parse(maybeAuth);

      // eri mahdolliset kenttänimet tokenille
      const t = parsed?.token || parsed?.accessToken || parsed?.jwt;

      if (typeof t === "string" && t.trim()) return t.trim();
    } catch {
      // JSON.parse epäonnistui -> ignoroidaan
    }
  }

  return null; // ei löytynyt tokenia
}

// Interceptor: ajetaan ENNEN jokaista requestia.
// Lisää Authorization: Bearer <token> automaattisesti, jos token löytyy.
api.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) {
    // Axios v1: config.headers voi olla "AxiosHeaders" (jolla on .set()),
    // tai plain object. Tämä koodi tukee molempia.
    const h: any = config.headers ?? {};

    if (typeof h.set === "function") {
      // AxiosHeaders-tyyli
      h.set("Authorization", `Bearer ${token}`);
    } else {
      // plain object -tyyli
      h["Authorization"] = `Bearer ${token}`;
    }

    config.headers = h;
  }

  return config; // palautetaan muokattu config -> pyyntö jatkuu normaalisti
});
