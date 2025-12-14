import { api } from "../../api";
import type { Report } from "../../types";

// reports-api: ui käyttää näitä (create/mine/list/status), eikä tee axios-kutsuja itse

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

export async function createReport(
  payload: CreateServiceReportPayload | CreateUserReportPayload
): Promise<Report> {
  // siistitään payload: lähetetään vain relevantit kentät + details vain jos annettu
  const cleaned =
    payload.target_type === "service"
      ? {
          target_type: "service" as const,
          reported_service_id: payload.reported_service_id,
          reason: payload.reason,
          ...(payload.details ? { details: payload.details } : {}),
        }
      : {
          target_type: "user" as const,
          reported_user_id: payload.reported_user_id,
          reason: payload.reason,
          ...(payload.details ? { details: payload.details } : {}),
        };

  const { data } = await api.post<Report>("/reports", cleaned);
  return data;
}

export async function getMyReports(): Promise<Report[]> {
  // kirjautuneen käyttäjän omat raportit
  const { data } = await api.get<Report[]>("/reports/mine");
  return data;
}

export async function listReports(): Promise<Report[]> {
  // kaikki raportit (moderointi; backend rajoittaa roolilla)
  const { data } = await api.get<Report[]>("/reports");
  return data;
}

export async function getReportById(id: string): Promise<Report> {
  // yhden raportin haku
  const { data } = await api.get<Report>(`/reports/${id}`);
  return data;
}

export async function updateReportStatus(
  id: string,
  payload: { status: string; resolution_notes?: string }
): Promise<Report> {
  // status päivitys moderointia varten
  const { data } = await api.patch<Report>(`/reports/${id}/status`, payload);
  return data;
}
