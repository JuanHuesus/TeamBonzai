// ! Käytetään vain tätä tiedostoa kursseihin/palveluihin liittyviin API-kutsuihin!

import { api } from "../../api";
import type { ListedService } from "../../types";

// !HUOM!: create/update ei lähetä id/created/updated kenttiä, koska backend hoitaa ne, eli omit poistaa ne tyypeistä.
export type CreateListedService = Omit<ListedService, "id" | "created" | "updated">;
export type UpdateListedService = Omit<ListedService, "id" | "created" | "updated">;


// listauksen suodatusparametrit
type ListParams = { q?: string; category?: string; type?: string };

// hakee listan kursseista
export async function listServices(params?: ListParams): Promise<ListedService[]> {
  const { data } = await api.get("/services", { params });
  return data;
}

// hakee tietyn kurssin id:llä
export async function getService(id: string): Promise<ListedService> {
  const { data } = await api.get(`/services/${id}`);
  return data;
}

// uuden kurssin luonti
// payloadissa ei oo id/created/updated kenttiä
// palauttaa backendin version jossa on nekin mukana
export async function createService(
  payload: CreateListedService
): Promise<ListedService> {
  const { data } = await api.post("/services", payload);
  return data;
}

// päivittää olemassa olevan kurssin id:llä ja lähettää päivityspayloadin backendille
export async function updateService(
  id: string,
  payload: UpdateListedService
): Promise<ListedService> {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
}

// poistaa kurssin id:llä
export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

// hakee kirjautuneen käyttäjän omat kurssit/listaukset (ne joissa listing_creator = userId)
// ei vaadi backendiltä reittiä, koska käytetään olemassa olevaa GET /services ja filtteröidään frontissa
export async function getMyServices(userId: string): Promise<ListedService[]> {
  const all = await listServices();
  return all.filter((s) => s.listing_creator === userId);
}
