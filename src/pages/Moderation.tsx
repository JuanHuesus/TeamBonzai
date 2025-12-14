// src/pages/Moderation.tsx
// Moderointi-sivu:
// - näyttää raportit kahdessa osassa: Avoimet (pending) ja Ratkaistut (resolved, minimoitu)
// - service-raporteissa “Avaa kurssi” avaa saman ServiceDetailModalin kuin ServicesList
// - moderaattori voi poistaa kurssin suoraan raportista
//
// FIX (vain frontti):
// - jos kurssi poistetaan, merkitään raportti resolved ENSIN (ennen deleteä)
//   -> ei tule "kurssia ei löydy" kun yritetään ratkaista poiston jälkeen
// - päivitetään React-state heti (ei tarvi selaimen refreshiä)

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../useAuth";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";
import type { Report, ListedService } from "../types";
import { listReports, updateReportStatus } from "../features/reports/api.reports";
import { listServices, deleteService } from "../features/services/api.services";
import ServiceDetailModal from "../features/services/ServiceDetailModal";

// -------------------------
// Helperit (Report shape voi vaihdella -> käytetään varovasti, EI any)
// -------------------------

function readStringProp(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (!(key in obj)) return null;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function getReportedServiceId(r: Report): string | null {
  return readStringProp(r, "reported_service_id");
}

function getReportedUserId(r: Report): string | null {
  return readStringProp(r, "reported_user_id");
}

function getResolutionNotes(r: Report): string | null {
  const raw = readStringProp(r, "resolution_notes");
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function statusPillClass(status: string) {
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type TargetFilter = "all" | "service" | "user";
type SortMode = "newest" | "oldest";

export default function ModerationPage() {
  const { role } = useAuth();
  const { t, lang } = useI18n();

  // pieni “fallback-käännös”: jos key puuttuu i18n:stä, näytetään fi/en fallback
  const tr = (key: string, fi: string, en: string) => {
    const v = t(key);
    if (v === key) return lang === "en" ? en : fi;
    return v;
  };

  // data
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // actions
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resolutionDraftById, setResolutionDraftById] = useState<Record<string, string>>({});

  // delete action (kurssin poisto)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // UI controls
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");

  // service “id -> object” (että voidaan avata detail-modal id:stä)
  const [serviceIndex, setServiceIndex] = useState<Record<string, ListedService> | null>(null);
  const [openingServiceId, setOpeningServiceId] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<ListedService | null>(null);

  const isModerator = role === "admin" || role === "moderator";
  const locale = lang === "en" ? "en-GB" : "fi-FI";

  async function loadReports() {
    setError(null);
    try {
      const data = await listReports();
      setReports(data);
    } catch (e: unknown) {
      setError(toMessage(e));
    }
  }

  async function ensureServiceIndex() {
    if (serviceIndex) return serviceIndex;

    const all = await listServices({});
    const idx: Record<string, ListedService> = {};
    for (const s of all) idx[s.id] = s;

    setServiceIndex(idx);
    return idx;
  }

  async function openReportedService(serviceId: string) {
    setOpeningServiceId(serviceId);
    setError(null);
    try {
      const idx = await ensureServiceIndex();
      const svc = idx[serviceId];
      if (!svc) {
        setError(t("moderation.courseNotFound"));
        return;
      }
      setDetailService(svc);
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setOpeningServiceId(null);
    }
  }

  // -------------------------
  // Optimistiset state-päivitykset (ei tarvi selaimen refreshiä)
  // -------------------------

  function patchReport(reportId: string, patch: Partial<Report>) {
    setReports((prev) => {
      if (!prev) return prev;
      return prev.map((r) => (r.id === reportId ? ({ ...r, ...patch } as Report) : r));
    });
  }

  function clearDraft(reportId: string) {
    setResolutionDraftById((prev) => {
      const copy = { ...prev };
      delete copy[reportId];
      return copy;
    });
  }

  // Merkitse resolved (ja tallenna notes jos annettu) -> päivittää myös UI:n heti
  async function resolveReport(reportId: string) {
    const notes = (resolutionDraftById[reportId] ?? "").trim();

    await updateReportStatus(reportId, {
      status: "resolved",
      ...(notes ? { resolution_notes: notes } : {}),
    });

    patchReport(reportId, {
      status: "resolved",
      ...(notes ? { resolution_notes: notes } : {}),
    });

    clearDraft(reportId);
  }

  async function markPending(reportId: string) {
    await updateReportStatus(reportId, { status: "pending" });
    patchReport(reportId, { status: "pending" });
  }

  // FIX: Poisto-flow = resolve ensin, delete vasta sitten
  async function deleteReportedCourse(reportId: string, serviceId: string) {
    const ok = confirm(
      tr(
        "moderation.confirmDeleteCourse",
        "Poistetaanko kurssi pysyvästi? Tätä ei voi perua.",
        "Delete this course permanently? This cannot be undone."
      )
    );
    if (!ok) return;

    setDeletingServiceId(serviceId);
    setError(null);

    try {
      // 1) Ratkaise raportti ENSIN (kun kurssi on vielä olemassa)
      //    -> estää tilanteen jossa backend/frontti sanoo "kurssia ei löydy" ratkaistaessa poiston jälkeen
      setSavingId(reportId);
      await resolveReport(reportId);
      setSavingId(null);

      // 2) Poista kurssi (backend)
      await deleteService(serviceId);

      // 3) Sulje detail-modal jos se on auki samasta kurssista
      if (detailService?.id === serviceId) setDetailService(null);

      // 4) Päivitä frontin serviceIndex (ettei näytetä vanhaa nimeä)
      setServiceIndex((prev) => {
        if (!prev) return prev;
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      });

      // Huom: Ei pakoteta loadReports() tähän. UI on jo oikein state-päivityksillä.
      // Jos haluat silti synkata, voit kutsua loadReports() tässä.
      // await loadReports();
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setSavingId(null);
      setDeletingServiceId(null);
    }
  }

  useEffect(() => {
    if (isModerator) void loadReports();
  }, [isModerator]);

  // (valinnainen) esilataa serviceIndex jos raporteissa on service-raportteja,
  // jotta voidaan näyttää kurssin nimi eikä pelkkää ID:tä.
  useEffect(() => {
    if (!reports) return;
    if (serviceIndex) return;
    const hasServiceReports = reports.some((r) => r.target_type === "service" && getReportedServiceId(r));
    if (hasServiceReports) {
      void ensureServiceIndex().catch(() => {
        // jos tämä failaa, ei haittaa: näytetään id ja “Avaa kurssi” yrittää uudestaan
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  const filtered = useMemo(() => {
    if (!reports) return null;
    const q = query.trim().toLowerCase();

    let items = [...reports];

    if (targetFilter !== "all") {
      items = items.filter((r) => r.target_type === targetFilter);
    }

    if (q) {
      items = items.filter((r) => {
        const sid = getReportedServiceId(r) ?? "";
        const uid = getReportedUserId(r) ?? "";
        const sName = sid ? serviceIndex?.[sid]?.name ?? "" : "";
        const hay = [
          r.id,
          r.status,
          r.target_type,
          r.reason,
          r.details ?? "",
          sid,
          uid,
          sName,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    items.sort((a, b) => {
      const ta = new Date(a.created).getTime();
      const tb = new Date(b.created).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return items;
  }, [reports, query, targetFilter, sort, serviceIndex]);

  const pending = useMemo(
    () => (filtered ? filtered.filter((r) => r.status !== "resolved") : null),
    [filtered]
  );
  const resolved = useMemo(
    () => (filtered ? filtered.filter((r) => r.status === "resolved") : null),
    [filtered]
  );

  if (!isModerator) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t("moderation.title")}</h1>
        <p className="text-sm text-neutral-600">{t("moderation.noAccess")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{t("moderation.title")}</h1>
          <p className="text-sm text-neutral-600 mt-1">{t("moderation.subtitle")}</p>
        </div>

        <button
          type="button"
          className="rounded-xl px-3 py-2 border text-sm bg-white shadow-sm hover:bg-neutral-50"
          onClick={() => void loadReports()}
        >
          {t("moderation.refresh")}
        </button>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border bg-white shadow-sm p-3 mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <div className="text-xs font-semibold text-neutral-600 mb-1">{t("moderation.searchLabel")}</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("moderation.searchPlaceholder")}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-neutral-600 mb-1">{t("moderation.filterLabel")}</div>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
            >
              <option value="all">{t("moderation.filterAll")}</option>
              <option value="service">{t("moderation.filterServices")}</option>
              <option value="user">{t("moderation.filterUsers")}</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-neutral-600 mb-1">{t("moderation.sortLabel")}</div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
            >
              <option value="newest">{t("moderation.sortNewest")}</option>
              <option value="oldest">{t("moderation.sortOldest")}</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-neutral-50">
            <span className="font-semibold">{t("moderation.pending")}</span>
            <span className="text-neutral-600">{pending?.length ?? 0}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-neutral-50">
            <span className="font-semibold">{t("moderation.resolved")}</span>
            <span className="text-neutral-600">{resolved?.length ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {!reports && <div className="text-sm text-neutral-500">{t("moderation.loading")}</div>}

      {/* No results */}
      {reports && filtered && filtered.length === 0 && (
        <div className="text-sm text-neutral-500">{t("moderation.noReportsFiltered")}</div>
      )}

      {/* Pending */}
      {pending && pending.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("moderation.pendingTitle")}</h2>

          <div className="space-y-3">
            {pending.map((r) => {
              const sid = r.target_type === "service" ? getReportedServiceId(r) : null;
              const uid = r.target_type === "user" ? getReportedUserId(r) : null;
              const courseName = sid ? serviceIndex?.[sid]?.name ?? null : null;

              return (
                <div key={r.id} className="border rounded-2xl p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-base">
               
                      </div>

                      <div className="mt-1 text-xs text-neutral-500">
                        {new Date(r.created).toLocaleString(locale)}
                        <span className="mx-2">•</span>
                        <span className="font-mono">{r.id}</span>
                        <button
                          type="button"
                          className="ml-2 underline text-neutral-600 hover:text-neutral-900"
                          onClick={async () => {
                            const ok = await copyToClipboard(r.id);
                            if (!ok) setError(t("moderation.copyFailed"));
                          }}
                        >
                          {t("moderation.copyId")}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs border ${statusPillClass(
                        r.status
                      )}`}
                    >
                      {r.status === "pending"
                        ? t("moderation.statusPending")
                        : r.status === "resolved"
                        ? t("moderation.statusResolved")
                        : r.status}
                    </span>
                  </div>

                  {/* Reported target box */}
                  <div className="mt-3 rounded-xl border bg-neutral-50 p-3 text-sm">
                    {r.target_type === "service" && sid && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-700">
                          {t("moderation.reportedCourse")}
                        </span>
                        <span className="text-xs text-neutral-700">{courseName ?? sid}</span>

                        <button
                          type="button"
                          className="text-xs underline text-blue-700 hover:text-blue-900 disabled:opacity-60"
                          disabled={openingServiceId === sid}
                          onClick={() => void openReportedService(sid)}
                        >
                          {openingServiceId === sid ? t("moderation.openingCourse") : t("moderation.openCourse")}
                        </button>

                        <button
                          type="button"
                          className="text-xs underline text-neutral-600 hover:text-neutral-900"
                          onClick={async () => {
                            const ok = await copyToClipboard(sid);
                            if (!ok) setError(t("moderation.copyFailed"));
                          }}
                        >
                          {t("moderation.copyTargetId")}
                        </button>
                      </div>
                    )}

                    {r.target_type === "user" && uid && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-700">
                          {t("moderation.reportedUser")}
                        </span>
                        <span className="text-xs text-neutral-700">{uid}</span>

                        <button
                          type="button"
                          className="text-xs underline text-neutral-600 hover:text-neutral-900"
                          onClick={async () => {
                            const ok = await copyToClipboard(uid);
                            if (!ok) setError(t("moderation.copyFailed"));
                          }}
                        >
                          {t("moderation.copyTargetId")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <div className="font-semibold">{r.reason}</div>
                    {r.details && (
                      <p className="text-neutral-700 mt-1 whitespace-pre-wrap">{r.details}</p>
                    )}
                  </div>

                  {/* Resolution notes draft */}
                  <div className="mt-3">
                    <label className="block">
                      <div className="text-xs font-semibold text-neutral-600 mb-1">
                        {t("moderation.resolutionNotesLabel")}
                      </div>
                      <textarea
                        value={resolutionDraftById[r.id] ?? ""}
                        onChange={(e) =>
                          setResolutionDraftById((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        placeholder={t("moderation.resolutionNotesPlaceholder")}
                        className="w-full rounded-xl border px-3 py-2 text-sm min-h-[70px]"
                      />
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl px-3 py-2 border text-sm bg-white hover:bg-neutral-50 disabled:opacity-60"
                      disabled={savingId === r.id || deletingServiceId !== null}
                      onClick={async () => {
                        setSavingId(r.id);
                        setError(null);
                        try {
                          await resolveReport(r.id); // <-- UI päivittyy heti
                        } catch (e: unknown) {
                          setError(toMessage(e));
                        } finally {
                          setSavingId(null);
                        }
                      }}
                    >
                      {savingId === r.id ? t("moderation.updating") : t("moderation.markResolved")}
                    </button>

                    {/* Poista kurssi (ratkaisee ensin raportin -> delete vasta sitten) */}
                    {r.target_type === "service" && sid && (
                      <button
                        type="button"
                        className="rounded-xl px-3 py-2 border text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        disabled={deletingServiceId === sid || savingId === r.id}
                        onClick={() => void deleteReportedCourse(r.id, sid)}
                        title={tr(
                          "moderation.deleteCourseHint",
                          "Ratkaisee ilmoituksen ja poistaa kurssin (frontti-fix: resolve ennen deleteä).",
                          "Resolves the report and deletes the course (front fix: resolve before delete)."
                        )}
                      >
                        {deletingServiceId === sid
                          ? tr("moderation.deletingCourse", "Poistetaan…", "Deleting…")
                          : tr("moderation.deleteCourse", "Poista kurssi", "Delete course")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Resolved (minimized) */}
      {resolved && resolved.length > 0 && (
        <section>
          <details className="rounded-2xl border bg-white shadow-sm p-3">
            <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{t("moderation.resolvedTitle")}</span>
                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs bg-neutral-50">
                  {resolved.length}
                </span>
              </div>
              <span className="text-sm text-neutral-600">{t("moderation.resolvedHint")}</span>
            </summary>

            <div className="mt-3 space-y-2">
              {resolved.map((r) => {
                const sid = r.target_type === "service" ? getReportedServiceId(r) : null;
                const uid = r.target_type === "user" ? getReportedUserId(r) : null;
                const courseName = sid ? serviceIndex?.[sid]?.name ?? null : null;
                const notes = getResolutionNotes(r);

                const headline =
                  r.target_type === "service"
                    ? `${t("moderation.reportOnService")}: ${courseName ?? sid ?? ""}`
                    : `${t("moderation.reportOnUser")}: ${uid ?? ""}`;

                return (
                  <details key={r.id} className="rounded-xl border bg-neutral-50 px-3 py-2">
                    <summary className="cursor-pointer select-none list-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {headline || t("moderation.resolvedReport")}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {new Date(r.created).toLocaleString(locale)} •{" "}
                          <span className="font-mono">{r.id}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs border ${statusPillClass(
                          r.status
                        )}`}
                      >
                        {t("moderation.statusResolved")}
                      </span>
                    </summary>

                    <div className="mt-2 text-sm">
                      <div className="font-semibold">{r.reason}</div>
                      {r.details && (
                        <div className="mt-1 text-neutral-700 whitespace-pre-wrap">{r.details}</div>
                      )}

                      {notes && (
                        <div className="mt-2 rounded-xl border bg-white p-3">
                          <div className="text-xs font-semibold text-neutral-600 mb-1">
                            {t("moderation.resolutionNotesSaved")}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{notes}</div>
                        </div>
                      )}

                      {r.target_type === "service" && sid && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="text-xs underline text-blue-700 hover:text-blue-900 disabled:opacity-60"
                            disabled={openingServiceId === sid}
                            onClick={() => void openReportedService(sid)}
                          >
                            {openingServiceId === sid ? t("moderation.openingCourse") : t("moderation.openCourse")}
                          </button>
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          type="button"
                          className="rounded-xl px-3 py-2 border text-sm bg-white hover:bg-neutral-50 disabled:opacity-60"
                          disabled={savingId === r.id}
                          onClick={async () => {
                            setSavingId(r.id);
                            setError(null);
                            try {
                              await markPending(r.id); // <-- UI päivittyy heti
                            } catch (e: unknown) {
                              setError(toMessage(e));
                            } finally {
                              setSavingId(null);
                            }
                          }}
                        >
                          {savingId === r.id ? t("moderation.updating") : t("moderation.markPending")}
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        </section>
      )}

      {/* Service detail modal (sama kuin ServicesList käyttää) */}
      {detailService && (
        <ServiceDetailModal service={detailService} onClose={() => setDetailService(null)} />
      )}
    </main>
  );
}
