// src/features/users/api.users.ts
import { api } from "../../api";
import type { User, UserProfile } from "../../types";

/**
 * Tämä tiedosto on “API-kerros” käyttäjätoiminnoille.
 * UI-komponentit kutsuvat näitä funktioita sen sijaan, että tekisivät axios-kutsuja suoraan.
 */

/**
 * Payload käyttäjän rekisteröintiin.
 * Backend odottaa nämä kentät, kun luodaan uusi käyttäjä.
 */
export type RegisterPayload = {
  firstname: string;
  surname: string;
  email: string;

  // HUOM: nimestä päätellen tämä on salasana (tai sen hash).
  // Käytännössä yleensä frontend lähettää “password” ja backend hashaa sen.
  // Tässä projektissa kenttä on nimetty hashed_passwordiksi, joten UI lähettää sen näin.
  hashed_password: string;

  // Valinnaiset profiilikentät
  phone_number?: string;
  description?: string;
};

/**
 * Rekisteröi uuden käyttäjän.
 *
 * - POST /users/signup
 * - payload sisältää rekisteröintilomakkeen tiedot
 * - palauttaa backendin luoman User-olion (sis. id, created, updated jne.)
 */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/users/signup", payload);
  return data;
}

/**
 * Hakee yhden käyttäjän profiilin id:llä.
 *
 * Käyttö: kun halutaan näyttää käyttäjän nimi/profiilitieto UI:ssa,
 * esim. “vetäjän nimi” kurssin detail-modalin arviointiosiossa.
 *
 * - GET /users/:id
 * - palauttaa UserProfile-olion (tyypillisesti suppeampi kuin User)
 */
export async function getUserProfileById(id: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${id}`);
  return data;
}
