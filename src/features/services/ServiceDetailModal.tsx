// src/features/services/ServiceDetailModal.tsx
import { useEffect, useMemo, useState } from "react";
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
import { getUserProfileById } from "../users/api.users";

type Props = {
  // Modal avataan, kun service != null. Null sallitaan, jotta komponentti voi olla aina renderöitynä.
  service: ListedService | null;
  onClose: () => void;
};

/** Muuttaa keskiarvon “tähtiriviksi”, esim. 4.2 -> ★★★★☆ (UI-esitys) */
function starsLine(avg: number) {
  const rounded = Math.round(avg);
  const full = "★".repeat(rounded);
  const empty = "☆".repeat(5 - rounded);
  return full + empty;
}

/** Kevyt UUID-validointi (käytetään varmistamaan että listing_creator on oikeasti userId) */
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

/**
 * Normalisoi backendin summary-rakenteen yhteiseen muotoon.
 * - ratingCount: arvioiden määrä
 * - avg: keskiarvo (preferoidaan backendin `average`-kenttää jos se löytyy)
 */
function computeSummary(
  summary: ListingRatingSummary | UserRatingSummary | null
): { ratingCount: number; avg: number } {
  if (!summary) return { ratingCount: 0, avg: 0 };

  const { star1, star2, star3, star4, star5, average } = summary;
  const ratingCount = star1 + star2 + star3 + star4 + star5;

  if (ratingCount === 0) return { ratingCount: 0, avg: 0 };

  // Jos backend antaa valmiin keskiarvon, käytetään sitä
  if (average !== null && average !== undefined) {
    return { ratingCount, avg: average };
  }

  // Fallback: lasketaan keskiarvo tähtijakaumasta
  const totalStars =
    star1 * 1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5;
  const avg = totalStars / ratingCount;

  return { ratingCount, avg };
}

export default function ServiceDetailModal({ service, onClose }: Props) {
  const { t, lang } = useI18n();
  const { email, token } = useAuth();

  // Kurssin (listing) arvioiden tila
  const [listingSummary, setListingSummary] =
    useState<ListingRatingSummary | null>(null);
  const [listingRatings, setListingRatings] = useState<ListingRatingEntry[]>([]);

  // Vetäjän (user) arvioiden tila
  const [userSummary, setUserSummary] = useState<UserRatingSummary | null>(null);
  const [userRatings, setUserRatings] = useState<UserRatingEntry[]>([]);

  // Yleinen lataus / virhe tila datan hakemiseen
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Vetäjän nimen näyttö (haetaan users/:id jos mahdollista)
  const [organizerDisplayName, setOrganizerDisplayName] = useState<string>("");

  // Raporttilomakkeen tila
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  /**
   * listing_creator on projektissa sovittu olevan käyttäjän UUID.
   * Jos se ei ole UUID (tai puuttuu), vetäjää ei voi arvioida user-rating -puolella.
   */
  const organizerIdRaw = service?.listing_creator ?? "";
  const organizerId = isUuid(organizerIdRaw) ? organizerIdRaw : "";

  // Pidetään UI järkevänä heti modalin auetessa:
  // näytetään service_provider nimikenttänä, vaikka user-profiili ei vielä olisi ladattu.
  useEffect(() => {
    if (!service) {
      setOrganizerDisplayName("");
      return;
    }
    setOrganizerDisplayName(service.service_provider || "");
  }, [service?.id]);

  /**
   * Hakee kaiken modalissa tarvittavan datan:
   * - kurssin summary + arviot
   * - vetäjän nimi (jos organizerId on UUID)
   * - vetäjän summary + arviot
   */
  async function loadAll() {
    if (!service) {
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
      // Kurssin arviot: summary + entries
      // catch-fallbackit pitää UI:n toimivana vaikka osa endpointista failaa.
      const [ls, le] = await Promise.all([
        getListingSummary(service.id).catch(() => null),
        getListingRatings(service.id).catch(() => []),
      ]);

      setListingSummary(ls);
      setListingRatings(le);

      // Vetäjän tiedot ja arviot haetaan vain jos organizerId on validi UUID
      if (organizerId) {
        // Vetäjän nimi (users/:id)
        try {
          const prof = await getUserProfileById(organizerId);
          const full = `${prof.firstname ?? ""} ${prof.surname ?? ""}`.trim();
          setOrganizerDisplayName(full || service.service_provider || "Vetäjä");
        } catch {
          // Jos profiilin haku ei onnistu (oikeudet tms.), käytetään service_provideria
          setOrganizerDisplayName(service.service_provider || "Vetäjä");
        }

        // Vetäjän rating summary + entries
        const [us, ue] = await Promise.all([
          getUserSummary(organizerId).catch(() => null),
          getUserRatings(organizerId).catch(() => []),
        ]);

        setUserSummary(us);
        setUserRatings(ue);
      } else {
        // Ei kelvollista organizerId:tä -> ei user-rating dataa
        setUserSummary(null);
        setUserRatings([]);
        setOrganizerDisplayName(service.service_provider || "Vetäjä");
      }
    } catch (e: unknown) {
      setErr(toMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // Ladataan data aina kun modalin service vaihtuu (tai organizerId muuttuu)
  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id, organizerId]);

  // Kurssin arvostelut uusimmat ensin (memo, ettei sort pyöri turhaan joka renderillä)
  const sortedListingRatings = useMemo(
    () =>
      [...listingRatings].sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      ),
    [listingRatings]
  );

  // Summaryt UI:lle helpompaan muotoon
  const { ratingCount: listingRatingCount, avg: listingAvg } =
    computeSummary(listingSummary);
  const { ratingCount: userRatingCount, avg: userAvg } =
    computeSummary(userSummary);

  // Derivoidut tekstit UI:ta varten
  const dateText = service?.datetime
    ? new Date(service.datetime).toLocaleDateString(locale)
    : t("course.timeTBA");

  const priceText = service?.price?.trim() || t("course.free");

  // Päätellään onko kurssi online (location on http/https URL)
  const isOnline = (() => {
    if (!service?.location) return false;
    try {
      const u = new URL(service.location);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  })();

  const modeText = isOnline
    ? t("course.mode.online")
    : t("course.mode.inperson");

  const img = service?.image || "https://placehold.co/1200x675?text=Kuva";

  // Raportointi vaatii kirjautumisen (token)
  const canReport = !!token;

  // Vetäjän arviointi vaatii kelvollisen organizerId:n (FeedbackForm hoitaa login-pakon)
  const canRateOrganizer = !!organizerId;

  /** Lähettää raportin kyseisestä kurssista */
  const onSendReport = async () => {
    if (!token) {
      setReportError(t("report.loginRequired"));
      return;
    }
    if (!reportReason.trim()) {
      setReportError(t("report.reasonRequired"));
      return;
    }
    if (!service) return;

    setReportSending(true);
    setReportError(null);
    setReportDone(false);

    try {
      await createReport({
        target_type: "service",
        reported_service_id: service.id,
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
  };

  // Modalin sisältö: jos service puuttuu, näytetään virhe/placeholder
  const body = !service ? (
    <div className="text-sm text-neutral-500">
      {t("common.error") ?? "Kurssia ei löytynyt."}
    </div>
  ) : (
    <div className="space-y-4">
      {/* Perustiedot */}
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
                {service.name}
              </h2>
              <div className="text-xs text-neutral-600 flex flex-wrap gap-2 mt-1">
                <span>{service.service_provider}</span>
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

            {/* Edit-linkki (oikeuksien rajoitus kannattaa tehdä erikseen, esim. backend/route-guard) */}
            <Link
              to={`/edit/${service.id}`}
              className="rounded-xl px-3 py-1.5 border bg-emerald-600 text-white text-xs hover:opacity-90"
            >
              Muokkaa
            </Link>
          </div>
        </div>
      </div>

      {/* Datahakuvirhe */}
      {err && (
        <div className="rounded-xl border bg-red-50 text-red-700 p-2 text-sm">
          {err}
        </div>
      )}

      {/* Datahaku käynnissä */}
      {loading && (
        <div className="text-sm text-neutral-500">Ladataan palautteita…</div>
      )}

      {/* Kurssin palaute */}
      <section className="rounded-2xl border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm">
            {t("feedback.courseSectionTitle")}
          </div>

          {/* Yhteenveto näytetään vain jos arvioita on */}
          {listingRatingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <span>{starsLine(listingAvg)}</span>
              <span>
                {listingAvg.toFixed(1)} · {listingRatingCount} arvostelua
              </span>
            </div>
          )}
        </div>

        {/* Lomake lähettää palautteen kurssille */}
        <FeedbackForm
          target={{
            kind: "listing",
            listingId: service.id,
            listingName: service.name,
          }}
          // Päivitetään datat lähetyksen jälkeen
          onSubmitted={loadAll}
        />

        {/* Arvostelulista (scrollattava) */}
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

      {/* Vetäjän palaute */}
      <section className="rounded-2xl border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm">
            {t("feedback.organizerSectionTitle")}{" "}
            {organizerDisplayName || "Vetäjä"}
          </div>

          {/* Näytetään yhteenveto vain jos vetäjää voidaan arvioida ja arvioita löytyy */}
          {canRateOrganizer && userRatingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <span>{starsLine(userAvg)}</span>
              <span>
                {userAvg.toFixed(1)} · {userRatingCount} arvostelua
              </span>
            </div>
          )}
        </div>

        {/* Jos organizerId ei ole UUID, ei pystytä kohdistamaan user-rating endpointteihin */}
        {!canRateOrganizer ? (
          <div className="text-xs text-neutral-500">
            Vetäjää ei voi arvioida tällä hetkellä (listing_creator ei ole UUID).
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

            {userRatings.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {userRatings
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.created).getTime() -
                      new Date(a.created).getTime()
                  )
                  .map((r) => (
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

      {/* Raportointi */}
      <section className="rounded-2xl border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm">{t("report.sectionTitle")}</div>
          {!email && (
            <div className="text-xs text-neutral-500">
              {t("report.loginHint")}
            </div>
          )}
        </div>

        {/* Raporttilomake togglataan auki/kiinni */}
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

      {/* Sulje */}
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
  );

  return (
    // Modal auki kun service != null
    <Modal open={!!service} onClose={onClose} title={service?.name ?? "Tiedot"}>
      {body}
    </Modal>
  );
}
