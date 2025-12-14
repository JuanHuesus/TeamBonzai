import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../ui/Modal";
import type {
  ListedService,
  ListingRatingEntry,
  ListingRatingSummary,
  UserRatingEntry,
  UserRatingSummary,
} from "../../types";
import { useI18n } from "../../i18n";
import { useAuth } from "../../useAuth";
import { toMessage } from "../../lib/error";
import {
  getListingRatings,
  getListingSummary,
  getUserRatings,
  getUserSummary,
} from "../ratings/api.ratings";
import FeedbackForm from "../feedback/FeedbackForm";
import { createReport } from "../reports/api.reports";

type Props = {
  // modal on "auki", kun service != null
  service: ListedService | null;
  onClose: () => void;
};


// keskiarvo tähtirivi UI:hin
function starsLine(avg: number) {
  const rounded = Math.round(avg);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

// varmistaa(kevyesti) että listing_creator on oikeasti userId
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

// päätellään "online", jos location on http/https URL
function isHttpUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// summaryt (listing/user) samaan muotoon: montako arviota + keskiarvo
function computeSummary(
  summary: ListingRatingSummary | UserRatingSummary | null
): { ratingCount: number; avg: number } {
  if (!summary) return { ratingCount: 0, avg: 0 };

  const { star1, star2, star3, star4, star5, average } = summary;
  const ratingCount = star1 + star2 + star3 + star4 + star5;
  if (ratingCount === 0) return { ratingCount: 0, avg: 0 };

  // jos backendiltä saa valmiin keskiarvon, käytetään sitä
  if (average !== null && average !== undefined) {
    return { ratingCount, avg: average };
  }

  // Muuten lasketaan tähtijakaumasta
  const totalStars =
    star1 * 1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5;

  return { ratingCount, avg: totalStars / ratingCount };
}

export default function ServiceDetailModal({ service, onClose }: Props) {
  const { t, lang } = useI18n();
  const { email, token } = useAuth();

  // service tiedot 
  const serviceId = service?.id ?? "";
  const serviceName = service?.name ?? "";
  const serviceProvider = service?.service_provider ?? "";
  const organizerIdRaw = service?.listing_creator ?? "";

  const organizerId = useMemo( //useMemo, jotta ei tarvi laskea joka renderillä. usememo muistaa arvon niin kauan kuin riippuvuuslista( organizerIdRaw) ei muutu
    () => (isUuid(organizerIdRaw) ? organizerIdRaw : ""),
    [organizerIdRaw]
  );

  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  // --- state: listing-ratings ---
  const [listingSummary, setListingSummary] =
    useState<ListingRatingSummary | null>(null);
  const [listingRatings, setListingRatings] = useState<ListingRatingEntry[]>([]);

  // --- state: user-ratings (organizer) ---
  const [userSummary, setUserSummary] = useState<UserRatingSummary | null>(null);
  const [userRatings, setUserRatings] = useState<UserRatingEntry[]>([]);

  // --- state: yleinen lataus/virhe ---
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- state: organizerin nimi UI:hin (näytetään heti service_provider) ---
  const [organizerDisplayName, setOrganizerDisplayName] = useState("");

  // --- state: report lomake ---
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // --- derived: tekstit & flagit UI:lle ---
  const dateText = service?.datetime
    ? new Date(service.datetime).toLocaleDateString(locale)
    : t("course.timeTBA");

  const priceText = service?.price?.trim() || t("course.free");

  const modeText = isHttpUrl(service?.location)
    ? t("course.mode.online")
    : t("course.mode.inperson");

  const img = service?.image || "https://placehold.co/1200x675?text=Kuva";

  const canReport = !!token;
  const canRateOrganizer = !!organizerId;

  // rating listojen sorttaus memoihin (ettei sort pyöri joka renderillä)
  const sortedListingRatings = useMemo( //memo siis muistaa arvon niin kauan kuin riippuvuuslista(listingRatings) ei muutu
    () =>
      [...listingRatings].sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      ),
    [listingRatings]
  );

  const sortedUserRatings = useMemo(
    () =>
      [...userRatings].sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      ),
    [userRatings]
  );

  // summaryt helpompaan muotoon
  const { ratingCount: listingRatingCount, avg: listingAvg } =
    computeSummary(listingSummary);
  const { ratingCount: userRatingCount, avg: userAvg } =
    computeSummary(userSummary);

  // kun modal avataan uudelle servicelle, näytetään heti service_provider nimikenttänä
  useEffect(() => {
    setOrganizerDisplayName(serviceProvider);
  }, [serviceId, serviceProvider]);

  // kun service vaihtuu, resetoi raporttilomakkeen “tilat” järkeviksi
  useEffect(() => {
    setReportOpen(false);
    setReportReason("");
    setReportDetails("");
    setReportDone(false);
    setReportError(null);
    setReportSending(false);
  }, [serviceId]);

  // mini "request id" suoja, eli jos service vaihtuu kesken latauksen,
  // vanhan pyynnön tulokset ei yliaja uuden servicen statea.
  const reqSeq = useRef(0); 

  // hakee kaiken modalin datan (listing + organizer)
  const loadAll = useCallback(async () => {
    const seq = ++reqSeq.current; //seq = requestin järjestysnumero

    // jos serviceId puuttuu, tyhjennetään data
    if (!serviceId) {
      setListingSummary(null);
      setListingRatings([]);
      setUserSummary(null);
      setUserRatings([]);
      setOrganizerDisplayName("");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      // Kurssin arviot (summary + entries)
      const [ls, le] = await Promise.all([
        getListingSummary(serviceId).catch(() => null),
        getListingRatings(serviceId).catch(() => []),
      ]);

      // jos service vaihtui kesken, lopetetaan hiljaa
      if (seq !== reqSeq.current) return;

      setListingSummary(ls);
      setListingRatings(le);

      // Vetäjän arviot vain jos organizerId on kelvollinen UUID
      if (!organizerId) {
        setUserSummary(null);
        setUserRatings([]);
        setOrganizerDisplayName(serviceProvider || "Vetäjä");
        return;
      }

      // Vetäjän rating summary + entries
      const [us, ue] = await Promise.all([
        getUserSummary(organizerId).catch(() => null),
        getUserRatings(organizerId).catch(() => []),
      ]);

      if (seq !== reqSeq.current) return;

      setUserSummary(us);
      setUserRatings(ue);
    } catch (e: unknown) {
      if (seq !== reqSeq.current) return;
      setErr(toMessage(e));
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, [serviceId, organizerId, serviceProvider]);


  //kun modal avataan uudelle servicelle tai vaihtuu niin data ladataan uudestaan
  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // reportin lähettäminen vaatii tokenin ja syyn
  const onSendReport = useCallback(async () => {
    if (!token) {
      setReportError(t("report.loginRequired"));
      return;
    }
    if (!reportReason.trim()) {
      setReportError(t("report.reasonRequired"));
      return;
    }
    if (!serviceId) return;

    setReportSending(true);
    setReportError(null);
    setReportDone(false);

    try {
      await createReport({
        target_type: "service",
        reported_service_id: serviceId,
        reason: reportReason.trim(),
        details: reportDetails.trim() || undefined,
      });

      setReportDone(true);
      setReportReason("");
      setReportDetails("");
    } catch (e: unknown) {
      setReportError(toMessage(e));
    } finally {
      setReportSending(false);
    }
  }, [token, t, reportReason, reportDetails, serviceId]);

  // jos service puuttuu, näytetään placeholder
  if (!service) {
    return (
      <Modal open={false} onClose={onClose} title="Tiedot">
        <div className="text-sm text-neutral-500">
          {t("common.error") ?? "Kurssia ei löytynyt."}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={!!service} onClose={onClose} title={serviceName || "Tiedot"}>
      <div className="space-y-4">
        {/* perustiedot */}
        <div className="rounded-2xl overflow-hidden border">
          <img
            src={img}
            alt=""
            className="h-48 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://placehold.co/1200x675?text=Kuva";
            }}
          />

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold leading-tight">
                  {serviceName}
                </h2>

                <div className="text-xs text-neutral-600 flex flex-wrap gap-2 mt-1">
                  <span>{serviceProvider}</span>
                  <span>•</span>
                  <span>{service.location ?? "-"}</span>
                  <span>•</span>
                  <span>{dateText}</span>
                  <span>•</span>
                  <span>{service.service_category}</span>
                </div>
              </div>

              <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium">
                {modeText}
              </span>
            </div>

            <p className="text-sm text-neutral-800">{service.description}</p>

            <div className="flex items-center justify-between pt-1">
              <div className="text-lg font-semibold">{priceText}</div>

              <Link
                to={`/edit/${serviceId}`}
                className="rounded-xl px-3 py-1.5 border bg-emerald-600 text-white text-xs hover:opacity-90"
              >
                Muokkaa
              </Link>
            </div>
          </div>
        </div>

        {/* virhe / lataus */}
        {err && (
          <div className="rounded-xl border bg-red-50 text-red-700 p-2 text-sm">
            {err}
          </div>
        )}
        {loading && (
          <div className="text-sm text-neutral-500">Ladataan palautteita…</div>
        )}

        {/* kurssin palaute */}
        <section className="rounded-2xl border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm">
              {t("feedback.courseSectionTitle")}
            </div>

            {listingRatingCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <span>{starsLine(listingAvg)}</span>
                <span>
                  {listingAvg.toFixed(1)} · {listingRatingCount} arvostelua
                </span>
              </div>
            )}
          </div>

          <FeedbackForm
            target={{
              kind: "listing",
              listingId: serviceId,
              listingName: serviceName,
            }}
            // lähetettyä palautetta, ladataan data uudestaan
            onSubmitted={loadAll}
          />

          {sortedListingRatings.length > 0 && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {sortedListingRatings.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-xl p-2 text-xs bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{starsLine(r.stars)}</div>
                    <div className="text-[10px] text-neutral-500">
                      {new Date(r.created).toLocaleDateString(locale)}
                    </div>
                  </div>
                  {r.feedback && (
                    <p className="mt-1 text-neutral-700">{r.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* vetäjän palaute */}
        <section className="rounded-2xl border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm">
              {t("feedback.organizerSectionTitle")}{" "}
              {organizerDisplayName || "Vetäjä"}
            </div>

            {canRateOrganizer && userRatingCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <span>{starsLine(userAvg)}</span>
                <span>
                  {userAvg.toFixed(1)} · {userRatingCount} arvostelua
                </span>
              </div>
            )}
          </div>

          {!canRateOrganizer ? (
            <div className="text-xs text-neutral-500">
              Vetäjää ei voi arvioida tällä hetkellä (listing_creator ei ole
              UUID).
            </div>
          ) : (
            <>
              <FeedbackForm
                target={{
                  kind: "user",
                  userId: organizerId,
                  userName: organizerDisplayName,
                }}
                onSubmitted={loadAll}
              />

              {sortedUserRatings.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {sortedUserRatings.map((r) => (
                    <div
                      key={r.id}
                      className="border rounded-xl p-2 text-xs bg-neutral-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold">{starsLine(r.stars)}</div>
                        <div className="text-[10px] text-neutral-500">
                          {new Date(r.created).toLocaleDateString(locale)}
                        </div>
                      </div>
                      {r.feedback && (
                        <p className="mt-1 text-neutral-700">{r.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* raportointi */}
        <section className="rounded-2xl border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm">{t("report.sectionTitle")}</div>
            {!email && (
              <div className="text-xs text-neutral-500">
                {t("report.loginHint")}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canReport}
            onClick={() => setReportOpen((v) => !v)}
            className="rounded-xl px-3 py-1.5 border text-xs bg-white disabled:opacity-50"
          >
            {reportOpen ? t("report.hideForm") : t("report.openForm")}
          </button>

          {reportOpen && (
            <div className="mt-2 space-y-2 text-sm">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder={t("report.reasonPlaceholder")}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm min-h-20"
                placeholder={t("report.detailsPlaceholder")}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />

              {reportError && (
                <div className="text-xs text-red-600">{reportError}</div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reportSending || !canReport}
                  onClick={onSendReport}
                  className="rounded-xl px-3 py-1.5 border bg-red-600 text-white text-xs disabled:opacity-50"
                >
                  {reportSending ? t("report.sending") : t("report.send")}
                </button>

                {reportDone && (
                  <span className="text-xs text-emerald-600">
                    {t("report.thanks")}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* sulje */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 border text-sm"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
