import { api } from "../../api";
import type { ListedService } from "../../types";

export type CreateListedService = Omit<ListedService, "id" | "created" | "updated">;
export type UpdateListedService = Partial<CreateListedService>;

export async function listServices(params?: {
  q?: string;
  category?: string;
  type?: string;
}): Promise<ListedService[]> {
  const { data } = await api.get<ListedService[]>("/listed_services", { params });
  return data;
}

export async function getService(id: string): Promise<ListedService> {
  const { data } = await api.get<ListedService>(`/listed_services/${id}`);
  return data;
}

export async function createService(payload: CreateListedService): Promise<ListedService> {
  const { data } = await api.post<ListedService>("/listed_services", payload);
  return data;
}

export async function updateService(id: string, payload: UpdateListedService): Promise<ListedService> {
  const { data } = await api.put<ListedService>(`/listed_services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/listed_services/${id}`);
}
