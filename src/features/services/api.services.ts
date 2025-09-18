import { api } from "../../api";
import type { ListedService } from "../../types";

export type CreateListedService = Omit<ListedService, "id" | "created" | "updated">;
export type UpdateListedService = Omit<ListedService, "id" | "created" | "updated">;

type ListParams = { q?: string; category?: string; type?: string };

export async function listServices(params?: ListParams): Promise<ListedService[]> {
  const { data } = await api.get("/services", { params });
  return data;
}

export async function getService(id: string): Promise<ListedService> {
  const { data } = await api.get(`/services/${id}`);
  return data;
}

export async function createService(payload: CreateListedService): Promise<ListedService> {
  const { data } = await api.post("/services", payload);
  return data;
}

export async function updateService(id: string, payload: UpdateListedService): Promise<ListedService> {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
