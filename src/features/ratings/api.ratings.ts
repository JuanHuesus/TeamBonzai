// src/features/ratings/api.ratings.ts
import { api } from "../../api";
import type {
  ListingRatingEntry,
  ListingRatingSummary,
  UserRatingEntry,
  UserRatingSummary,
} from "../../types";

/**
 * Backend mounttaa ratingsRouterin polkuun /api/ratings
 * app.use('/api/ratings', ratingsRoutes);
 *
 * Eli lopulliset reitit ovat:
 *  POST   /api/ratings/listing/:listingId
 *  GET    /api/ratings/listing/:listingId
 *  GET    /api/ratings/listing/:listingId/summary
 *  POST   /api/ratings/user/:userId
 *  GET    /api/ratings/user/:userId
 *  GET    /api/ratings/user/:userId/summary
 */

import type { AxiosError } from "axios";

export async function postListingRating(
  listingId: string,
  payload: { stars: number; feedback?: string; public?: boolean }
) {
  try {
    const { data } = await api.post(
      `/ratings/listing/${listingId}`,
      payload
    );
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      const axiosErr = err as AxiosError<{ error?: string; message?: string }>;

      console.error("STATUS:", axiosErr.response?.status);
      console.error("DATA:", axiosErr.response?.data);
    } else {
      console.error("Unknown error", err);
    }

    throw err;
  }
}


export async function getListingRatings(
  listingId: string
): Promise<ListingRatingEntry[]> {
  const { data } = await api.get<ListingRatingEntry[]>(
    `/ratings/listing/${listingId}`
  );
  return data;
}

export async function getListingSummary(
  listingId: string
): Promise<ListingRatingSummary> {
  const { data } = await api.get<ListingRatingSummary>(
    `/ratings/listing/${listingId}/summary`
  );
  return data;
}

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

export async function getUserRatings(
  userId: string
): Promise<UserRatingEntry[]> {
  const { data } = await api.get<UserRatingEntry[]>(
    `/ratings/user/${userId}`
  );
  return data;
}

export async function getUserSummary(
  userId: string
): Promise<UserRatingSummary> {
  const { data } = await api.get<UserRatingSummary>(
    `/ratings/user/${userId}/summary`
  );
  return data;
}
