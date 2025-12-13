import { api } from "../../api";
import type { Report } from "../../types";

/**
 * Tämä tiedosto on “API-kerros” raporteille (ilmoitukset / reportit).
 *
 * UI ei tee suoraan axios-kutsuja, vaan käyttää näitä funktioita:
 * - createReport(...)        -> luo raportin
 * - getMyReports()          -> hakee kirjautuneen käyttäjän tekemät raportit
 * - listReports()           -> hakee kaikki raportit (yleensä vain admin/moderaattori)
 * - getReportById(id)       -> hakee yhden raportin
 * - updateReportStatus(...) -> päivittää raportin tilan (moderointi)
 *
 * Kaikki kutsut käyttävät yhteistä api-instanssia (src/api.ts),
 * joka hoitaa baseURL:n, headerit ja mahdolliset tokenit/interceptorit.
 */

/**
 * Payload raportoitaessa palvelu/kurssi (service).
 * target_type kertoo backendille, mitä raportoidaan.
 */
export type CreateServiceReportPayload = {
  target_type: "service";
  reported_service_id: string; // raportoitu kurssi/palvelu
  reason: string;              // lyhyt syy (pakollinen)
  details?: string;            // lisäkuvaus (valinnainen)
};

/**
 * Payload raportoitaessa käyttäjä (user).
 */
export type CreateUserReportPayload = {
  target_type: "user";
  reported_user_id: string; // raportoitu käyttäjä
  reason: string;
  details?: string;
};

/**
 * Luo uuden raportin backendille.
 *
 * Huomaa “cleaned”-logiikka:
 * - Lähetetään backendille vain relevantit kentät
 * - Ei lähetetä esim. reported_user_id silloin kun target on service
 * - Ei lähetetä details-kenttää jos sitä ei ole annettu
 *
 * Tämä vähentää backend-validointiongelmia ja pitää payloadin siistinä.
 */
export async function createReport(
  payload: CreateServiceReportPayload | CreateUserReportPayload
): Promise<Report> {
  // Rakennetaan “puhdas” payload:
  // - service-raportissa on reported_service_id
  // - user-raportissa on reported_user_id
  // - details lisätään vain jos se on oikeasti olemassa (ei null/tyhjä)
  const cleaned =
    payload.target_type === "service"
      ? {
          target_type: "service" as const,
          reported_service_id: payload.reported_service_id,
          reason: payload.reason,
          ...(payload.details ? { details: payload.details } : {}),
        }
      : {
          target_type: "user" as const,
          reported_user_id: payload.reported_user_id,
          reason: payload.reason,
          ...(payload.details ? { details: payload.details } : {}),
        };

  // POST /reports luo uuden raportin ja palauttaa tallennetun Report-olion
  const { data } = await api.post<Report>("/reports", cleaned);
  return data;
}

/**
 * Hakee kirjautuneen käyttäjän tekemät raportit.
 * Tyypillinen reitti "mine" = "omat".
 */
export async function getMyReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports/mine");
  return data;
}

/**
 * Hakee kaikki raportit (moderointi).
 * Käyttöoikeudet kannattaa rajoittaa backendissä (admin/moderaattori).
 */
export async function listReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports");
  return data;
}

/**
 * Hakee yhden raportin id:llä.
 * Hyödyllinen esim. detail-näkymään.
 */
export async function getReportById(id: string): Promise<Report> {
  const { data } = await api.get<Report>(`/reports/${id}`);
  return data;
}

/**
 * Päivittää raportin statuksen (esim. "open" -> "resolved").
 * resolution_notes on valinnainen lisäselite moderaattorilta.
 */
export async function updateReportStatus(
  id: string,
  payload: { status: string; resolution_notes?: string }
): Promise<Report> {
  // PATCH on tyypillinen HTTP-metodi osittaiseen päivitykseen
  const { data } = await api.patch<Report>(`/reports/${id}/status`, payload);
  return data;
}
