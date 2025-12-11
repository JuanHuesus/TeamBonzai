import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { useI18n } from "../i18n";
import { getMyReports } from "../features/reports/api.reports";
import type { Report } from "../types";
import { toMessage } from "../lib/error";

export default function ProfilePage() {
  const { email } = useAuth();
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const data = await getMyReports();
        setReports(data);
      } catch (e: unknown) {
        setError(toMessage(e));
      }
    })();
  }, [email]);

  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t("profile.title")}</h1>
        <p className="text-sm text-neutral-600">
          {t("profile.loginRequired")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">
          {t("profile.title")}
        </h1>
        <p className="text-sm">
          {t("profile.emailLabel")}: <strong>{email}</strong>
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          {t("profile.subtitle")}
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">
          {t("profile.myReportsTitle")}
        </h2>

        {error && (
          <div className="mb-2 rounded-xl border bg-red-50 text-red-600 p-2 text-sm">
            {error}
          </div>
        )}

        {!reports && (
          <div className="text-sm text-neutral-500">
            {t("profile.loadingReports")}
          </div>
        )}

        {reports && reports.length === 0 && (
          <div className="text-sm text-neutral-500">
            {t("profile.noReports")}
          </div>
        )}

        {reports && reports.length > 0 && (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="border rounded-xl p-2 text-xs bg-neutral-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {r.target_type === "service"
                      ? t("profile.reportService")
                      : t("profile.reportUser")}
                  </span>
                  <span className="inline-flex rounded-full px-2 py-0.5 border">
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  {new Date(r.created).toLocaleString("fi-FI")}
                </div>
                <div className="mt-1 font-semibold">{r.reason}</div>
                {r.details && (
                  <div className="mt-1 text-neutral-700">
                    {r.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
