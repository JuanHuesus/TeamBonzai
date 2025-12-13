import { api } from "../../api";
import type {
  ListingRatingEntry,
  ListingRatingSummary,
  UserRatingEntry,
  UserRatingSummary,
} from "../../types";
import type { AxiosError } from "axios";

/**
 * Tämä tiedosto on “API-kerros” arvosanoille/palautteille.
 *
 * Idea:
 * - UI-komponentit (esim. FeedbackForm) eivät rakenntele URL:ia tai axios-kutsuja itse.
 * - Ne kutsuvat näitä funktioita: postListingRating(), getUserSummary() jne.
 *
 * Backendin reitit on mountattu polkuun /api/ratings.
 * Frontissa käytetään api-instanssia (src/api.ts), joka lisää baseURL:n eteen.
 *
 * Kun täällä kutsutaan:
 *   api.post("/ratings/listing/123", ...)
 * se menee oikeasti osoitteeseen:
 *   {baseURL}/ratings/listing/123
 * ja baseURL on yleensä "/api" -> "/api/ratings/listing/123" (kun backend on proxyn takana)
 *
 * Reitit:
 *  POST   /api/ratings/listing/:listingId
 *  GET    /api/ratings/listing/:listingId
 *  GET    /api/ratings/listing/:listingId/summary
 *  POST   /api/ratings/user/:userId
 *  GET    /api/ratings/user/:userId
 *  GET    /api/ratings/user/:userId/summary
 */

/**
 * Lähettää uuden arvioinnin listaukselle/kurssille.
 *
 * - listingId: mihin kurssiin arvio liittyy
 * - payload: data, joka lähetetään backendille (tähdet + optional palaute + public)
 *
 * Tässä on try/catch, jotta saadaan debug-lokit (status + data) jos backend vastaa virheellä.
 */
export async function postListingRating(
  listingId: string,
  payload: { stars: number; feedback?: string; public?: boolean }
) {
  try {
    // POST lähettää dataa backendille ja odottaa vastauksen
    const { data } = await api.post(`/ratings/listing/${listingId}`, payload);
    return data;
  } catch (err: unknown) {
    // Debuggaus: jos tämä on axios-virhe, tulostetaan HTTP status ja response-data
    if (err instanceof Error) {
      const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
      console.error("STATUS:", axiosErr.response?.status);
      console.error("DATA:", axiosErr.response?.data);
    } else {
      console.error("Unknown error", err);
    }

    // Heitetään virhe eteenpäin, jotta UI voi näyttää sen käyttäjälle
    throw err;
  }
}

/**
 * Hakee kaikki arviot yhdelle listaukselle/kurssille.
 * Palauttaa taulukon ListingRatingEntry-olioita.
 */
export async function getListingRatings(
  listingId: string
): Promise<ListingRatingEntry[]> {
  // GET hakee dataa backendiltä
  const { data } = await api.get<ListingRatingEntry[]>(
    `/ratings/listing/${listingId}`
  );
  return data;
}

/**
 * Hakee listauksen/kurssin yhteenvetotiedot (esim. keskiarvo, määrä).
 * Palauttaa ListingRatingSummary-olion.
 */
export async function getListingSummary(
  listingId: string
): Promise<ListingRatingSummary> {
  const { data } = await api.get<ListingRatingSummary>(
    `/ratings/listing/${listingId}/summary`
  );
  return data;
}

/**
 * Lähettää uuden arvioinnin käyttäjälle (esim. kurssin vetäjä).
 * Palauttaa tallennetun UserRatingEntry-olion (backendin palauttama muoto).
 */
export async function postUserRating(
  userId: string,
  payload: { stars: number; feedback?: string; public?: boolean }
): Promise<UserRatingEntry> {
  const { data } = await api.post<UserRatingEntry>(
    `/ratings/user/${userId}`,
    payload
  );
  return data;
}

/**
 * Hakee kaikki käyttäjälle annetut arviot.
 */
export async function getUserRatings(
  userId: string
): Promise<UserRatingEntry[]> {
  const { data } = await api.get<UserRatingEntry[]>(`/ratings/user/${userId}`);
  return data;
}

/**
 * Hakee käyttäjän arvioiden yhteenvedon (esim. keskiarvo, määrä).
 */
export async function getUserSummary(
  userId: string
): Promise<UserRatingSummary> {
  const { data } = await api.get<UserRatingSummary>(
    `/ratings/user/${userId}/summary`
  );
  return data;
}
