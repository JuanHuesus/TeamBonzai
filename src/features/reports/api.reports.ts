// src/features/reports/api.reports.ts
import { api } from "../../api";
import type { Report } from "../../types";

export type CreateServiceReportPayload = {
  target_type: "service";
  reported_service_id: string;
  reason: string;
  details?: string;
};

export type CreateUserReportPayload = {
  target_type: "user";
  reported_user_id: string;
  reason: string;
  details?: string;
};

/**
 * app.use('/api/reports', reportRoutes);
 *
 * Eli reitit:
 *  POST   /api/reports
 *  GET    /api/reports/mine
 *  GET    /api/reports            (admin)
 *  GET    /api/reports/:id        (admin)
 *  PATCH  /api/reports/:id/status (admin)
 */

export async function createReport(
  payload: CreateServiceReportPayload | CreateUserReportPayload
): Promise<Report> {
  const { data } = await api.post<Report>("/reports", payload);
  return data;
}

export async function getMyReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports/mine");
  return data;
}

export async function listReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports");
  return data;
}

export async function getReportById(id: string): Promise<Report> {
  const { data } = await api.get<Report>(`/reports/${id}`);
  return data;
}

export async function updateReportStatus(
  id: string,
  payload: { status: string; resolution_notes?: string }
): Promise<Report> {
  const { data } = await api.patch<Report>(`/reports/${id}/status`, payload);
  return data;
}
