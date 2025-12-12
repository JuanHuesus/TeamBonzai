// src/lib/error.ts
import axios from "axios";

/**
 * Muuttaa catch(err) -tyyppisen virheen ihmisluettavaksi viestiksi.
 * - AxiosError: yritetään lukea backendin { message } tai fallback err.message
 * - Error: err.message
 * - muu: yritetään JSON.stringify
 */
export function toMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Backend voi palauttaa esim { message: "..." }
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message;
  }

  // Normaali JS Error
  if (err instanceof Error) return err.message;

  // Viimeinen fallback
  try {
    return JSON.stringify(err);
  } catch {
    return "Tuntematon virhe";
  }
}
