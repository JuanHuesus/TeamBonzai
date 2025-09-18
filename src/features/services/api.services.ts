import axios from "axios";
import type { ListedService } from "../../types";

export type CreateListedService = Omit<ListedService, "id" | "created" | "updated">;
export type UpdateListedService = Omit<ListedService, "id" | "created" | "updated">;

const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; 
// .env.production -> /mock  (pagesissa)
// local dev -> /mock tai tyhjä/ backendin url

const http = axios.create({
  baseURL: API_BASE, 
  headers: { "Content-Type": "application/json" },
});

type ListParams = { q?: string; category?: string; type?: string };

export async function listServices(params?: ListParams): Promise<ListedService[]> {
  const res = await http.get("/listed_services", { params });
  return res.data;
}

export async function getService(id: string): Promise<ListedService> {
  const res = await http.get(`/listed_services/${id}`);
  return res.data;
}

export async function createService(payload: CreateListedService): Promise<ListedService> {
  const res = await http.post("/listed_services", payload);
  return res.data;
}

export async function updateService(id: string, payload: UpdateListedService): Promise<ListedService> {
  const res = await http.put(`/listed_services/${id}`, payload);
  return res.data;
}

export async function deleteService(id: string): Promise<void> {
  await http.delete(`/listed_services/${id}`);
}