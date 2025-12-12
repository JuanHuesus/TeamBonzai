// src/lib/jwt.ts

/**
 * JWT käyttää base64url-muotoa:
 * - "-" ja "_" merkkejä
 * - ei välttämättä padding "=" -merkkejä
 *
 * Tämä muuntaa base64url -> base64 ja dekoodaa stringiksi.
 */
export function base64UrlDecode(input: string): string {
  // base64url -> base64
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");

  // lisää padding (=) niin että pituus on jaollinen neljällä
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  // atob = base64 decode (browser)
  return atob(padded);
}

/**
 * Purkaa JWT:n payloadin (header.payload.signature).
 * Palauttaa objektin jos onnistuu, muuten null.
 */
export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

/**
 * Poimii roolin payloadista yleisimmistä kentännimistä.
 * (Teillä näkyi ainakin "user_role".)
 */
export function pickRoleFromPayload(payload: any | null): string | null {
  if (!payload) return null;

  const raw =
    payload.user_role ??
    payload.role ??
    payload.userRole ??
    payload.userrole ??
    payload.claims?.role;

  if (typeof raw !== "string") return null;

  const v = raw.trim();
  return v ? v : null;
}

/**
 * Poimii emailin payloadista yleisimmistä kentännimistä.
 */
export function pickEmailFromPayload(payload: any | null): string | null {
  if (!payload) return null;

  const raw = payload.email ?? payload.user_email ?? payload.mail;

  if (typeof raw !== "string") return null;

  const v = raw.trim();
  return v ? v : null;
}
