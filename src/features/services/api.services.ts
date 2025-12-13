import { api } from "../../api";
import type { ListedService } from "../../types";

/**
 * Tämä tiedosto on “API-kerros” kursseille / palveluille (services).
 *
 * UI käyttää näitä funktioita, jotta:
 * - URL-osoitteet ja HTTP-metodit ovat yhdessä paikassa
 * - tyypit (ListedService) pysyvät yhtenäisinä koko sovelluksessa
 * - komponentit pysyvät siisteinä (ei axios-kutsuja joka tiedostossa)
 */

/**
 * Create/Update payload:
 * Kun luodaan tai päivitetään kurssi, frontend ei yleensä lähetä:
 * - id (backend luo sen)
 * - created / updated (backend asettaa aikaleimat)
 *
 * Omit<> tekee uuden tyypin, josta nuo kentät on poistettu.
 */
export type CreateListedService = Omit<
  ListedService,
  "id" | "created" | "updated"
>;
export type UpdateListedService = Omit<
  ListedService,
  "id" | "created" | "updated"
>;

/**
 * Listaushakuun tulevat mahdolliset query-parametrit.
 * Nämä menevät URL:iin muotoon esim:
 *   /services?q=pizza&category=cooking&type=live
 */
type ListParams = { q?: string; category?: string; type?: string };

/**
 * Hakee listan kursseista/palveluista.
 *
 * params on vapaaehtoinen:
 * - jos sitä ei anneta -> haetaan kaikki
 * - jos annetaan -> backend suodattaa hakuehtojen perusteella
 *
 * axios/api hoitaa query-parametrien lisäämisen URL:iin kun käytetään { params }.
 */
export async function listServices(params?: ListParams): Promise<ListedService[]> {
  const { data } = await api.get("/services", { params });
  return data;
}

/**
 * Hakee yhden kurssin/palvelun id:llä.
 * Tyypillinen käyttö: detail-sivu tai muokkauslomake.
 */
export async function getService(id: string): Promise<ListedService> {
  const { data } = await api.get(`/services/${id}`);
  return data;
}

/**
 * Luo uuden kurssin/palvelun.
 * POST /services
 *
 * Palauttaa backendin tallentaman objektin (sisältää myös id:n).
 */
export async function createService(
  payload: CreateListedService
): Promise<ListedService> {
  const { data } = await api.post("/services", payload);
  return data;
}

/**
 * Päivittää olemassa olevan kurssin/palvelun.
 * PUT tarkoittaa yleensä “korvaa/päivitä resurssi tällä sisällöllä”.
 */
export async function updateService(
  id: string,
  payload: UpdateListedService
): Promise<ListedService> {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
}

/**
 * Poistaa kurssin/palvelun id:llä.
 * Tässä ei palauteta dataa, joten return-tyyppi on void.
 */
export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
