import { api } from "../../api";
import type {
  ListingRatingEntry,
  ListingRatingSummary,
  UserRatingEntry,
  UserRatingSummary,
} from "../../types";
import type { AxiosError } from "axios";

// ratings-api: ui kutsuu näitä funktioita eikä tee suoria http-kutsuja
// kaikki kutsut menee api-instanssin kautta (joka hoitaa tokenin lisäyksen jne)

export async function postListingRating(
  listingId: string,
  payload: { stars: number; feedback?: string; public?: boolean }
) {
  // postitetaan arvion kurssilistaukselle
  try {
    const { data } = await api.post(`/ratings/listing/${listingId}`, payload);
    return data;
  } catch (err: unknown) {
    
    const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
    console.error("status:", axiosErr.response?.status, "data:", axiosErr.response?.data);
    throw err; 
  }
}

export async function getListingRatings(listingId: string): Promise<ListingRatingEntry[]> {
  // hakee kaikki arviot yhdelle listaukselle
  const { data } = await api.get<ListingRatingEntry[]>(`/ratings/listing/${listingId}`);
  return data;
}

export async function getListingSummary(listingId: string): Promise<ListingRatingSummary> {
  // hakee listauksen yhteenvedon (keskiarvo, määrä)
  const { data } = await api.get<ListingRatingSummary>(`/ratings/listing/${listingId}/summary`);
  return data;
}

export async function postUserRating(
  userId: string,
  payload: { stars: number; feedback?: string; public?: boolean }
): Promise<UserRatingEntry> {
  // postitetaan arvion käyttäjälle
  const { data } = await api.post<UserRatingEntry>(`/ratings/user/${userId}`, payload);
  return data;
}

export async function getUserRatings(userId: string): Promise<UserRatingEntry[]> {
  // hakee kaikki arviot käyttäjälle
  const { data } = await api.get<UserRatingEntry[]>(`/ratings/user/${userId}`);
  return data;
}

export async function getUserSummary(userId: string): Promise<UserRatingSummary> {
  // hakee käyttäjän yhteenvedon (keskiarvo, määrä)
  const { data } = await api.get<UserRatingSummary>(`/ratings/user/${userId}/summary`);
  return data;
}
