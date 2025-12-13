// Upcoming.tsx
// Tulevat-tapahtumat -sivu: hakee kaikki listaukset backendistä,
// suodattaa niistä vain tulevaisuuden tapahtumat (datetime >= nyt),
// järjestää ne aikajärjestykseen ja näyttää ServiceCard-kortteina.
// Klikistä avautuu ServiceDetailModal.

import { useEffect, useState } from "react"; // React hookit: datahaku (useEffect) + tila (useState)
import { listServices } from "../features/services/api.services"; // API: hae palvelulista backendistä
import type { ListedService } from "../types"; // TS-tyyppi listauksille
import { toMessage } from "../lib/error"; // virheen muunto luettavaan muotoon
import ServiceCard from "../features/services/ServiceCard"; // korttikomponentti listauksen näyttöön
import { useI18n } from "../i18n"; // käännökset
import ServiceDetailModal from "../features/services/ServiceDetailModal"; // detail-modal yhden palvelun tarkasteluun

export default function Upcoming() {
  // items: null = ei vielä ladattu, [] = ladattu mutta tyhjä
  const [items, setItems] = useState<ListedService[] | null>(null);

  // error: näytetään jos listServices epäonnistuu
  const [error, setError] = useState<string | null>(null);

  // detail: kun käyttäjä avaa yhden palvelun, se tallennetaan tähän ja modal avautuu
  const [detail, setDetail] = useState<ListedService | null>(null);

  // t() UI-teksteihin
  const { t } = useI18n();

  // ------------------------------------------------------------
  // Datahaku: haetaan palvelut kerran sivun mountissa
  // ------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await listServices({}); // API: hae kaikki palvelut
        setItems(data);
      } catch (e: unknown) {
        setError(toMessage(e));
      }
    })();
  }, []);

  // ------------------------------------------------------------
  // Tulevien listojen muodostus
  // ------------------------------------------------------------
  const now = Date.now(); // “nykyhetki” millisekunteina

  // upcoming:
  // 1) vain ne joilla on datetime
  // 2) datetime pitää olla validi Date
  // 3) datetime pitää olla >= nyt
  // 4) lopuksi sortataan nousevaan aikajärjestykseen
  const upcoming =
    (items ?? [])
      .filter(
        (s) =>
          s.datetime &&
          !Number.isNaN(new Date(s.datetime).getTime()) &&
          new Date(s.datetime).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime()
      );

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <main className="page-shell py-8 md:py-12">
      {/* Otsikko + selite */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("nav.upcoming")}
          </h1>
          <p className="mt-2 text-neutral-600 max-w-prose">
            {t("home.upcomingTitle")}
          </p>
        </div>
      </div>

      {/* Virheviesti */}
      {error && (
        <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3">
          {error}
        </div>
      )}

      {/* Lataustila: items === null */}
      {!items && <div>{t("services.loading")}</div>}

      {/* Korttilistaus */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {upcoming.map((s) => (
          // ServiceCard kutsuu onOpen(service) kun käyttäjä haluaa avata detailin
          <ServiceCard key={s.id} s={s} onOpen={setDetail} />
        ))}
      </div>

      {/* Detail-modal:
          - service=detail (null => käytännössä “ei valintaa”)
          - onClose nollaa detailin */}
      <ServiceDetailModal
        service={detail}
        onClose={() => setDetail(null)}
      />
    </main>
  );
}
