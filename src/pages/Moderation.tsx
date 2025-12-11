import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";
import type { Report } from "../types";
import { listReports, updateReportStatus } from "../features/reports/api.reports";

export default function ModerationPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isModerator = role === "admin" || role === "moderator";

  async function load() {
    setError(null);
    try {
      const data = await listReports();
      setReports(data);
    } catch (e: unknown) {
      setError(toMessage(e));
    }
  }

  useEffect(() => {
    if (isModerator) {
      void load();
    }
  }, [isModerator]);

  if (!isModerator) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">
          {t("moderation.title")}
        </h1>
        <p className="text-sm text-neutral-600">
          {t("moderation.noAccess")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        {t("moderation.title")}
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3 text-sm">
          {error}
        </div>
      )}

      {!reports && <div className="text-sm text-neutral-500">Ladataan raportteja…</div>}

      {reports && reports.length === 0 && (
        <div className="text-sm text-neutral-500">
          {t("moderation.noReports")}
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-3 text-sm bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">
                  {r.target_type === "service"
                    ? t("moderation.reportOnService")
                    : t("moderation.reportOnUser")}
                </div>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs border">
                  {r.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {new Date(r.created).toLocaleString("fi-FI")}
              </div>
              <div className="mt-2">
                <div className="font-semibold text-xs">{r.reason}</div>
                {r.details && (
                  <p className="text-xs text-neutral-700 mt-1">
                    {r.details}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl px-2 py-1 border text-xs"
                  disabled={savingId === r.id}
                  onClick={async () => {
                    setSavingId(r.id);
                    try {
                      await updateReportStatus(r.id, {
                        status: r.status === "resolved" ? "pending" : "resolved",
                      });
                      await load();
                    } catch (e: unknown) {
                      setError(toMessage(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                >
                  {savingId === r.id
                    ? t("moderation.updating")
                    : r.status === "resolved"
                    ? t("moderation.markPending")
                    : t("moderation.markResolved")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
