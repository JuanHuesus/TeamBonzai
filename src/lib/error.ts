import axios from "axios";

export function toMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data: any = err.response?.data;

    // backendin raportti-API palauttaa { message, error }
    const raw = (data?.message || data?.error || err.message) as string;

    if (typeof data?.error === "string" && data.error.includes("fk_reports_reporter")) {
      return "Raporttia ei voitu tallentaa, koska kirjautumistieto ei vastaa backendin käyttäjää (token/DB epäsynkassa). Kirjaudu ulos ja sisään uudestaan. Jos ei auta, backendin DB tai tokenin userId on rikki.";
    }

    return raw;
  }

  if (err instanceof Error) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return "Tuntematon virhe";
  }
}
