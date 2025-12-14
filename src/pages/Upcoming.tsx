// haetaan backendistä kaikki palvelut,
// suodattaa niistä vain tulevaisuuden tapahtumat (datetime >= nyt),
// järjestää ne aikajärjestykseen ja näyttää ServiceCard-kortteina.
// Klikistä avautuu ServiceDetailModal.

import { useEffect, useState } from "react"; 
import { listServices } from "../features/services/api.services"; 
import type { ListedService } from "../types"; 
import { toMessage } from "../lib/error"; 
import ServiceCard from "../features/services/ServiceCard"; 
import { useI18n } from "../i18n"; 
import ServiceDetailModal from "../features/services/ServiceDetailModal"; 

export default function Upcoming() {
  const [items, setItems] = useState<ListedService[] | null>(null);

  
  const [error, setError] = useState<string | null>(null);

  // valittu palvelu detail-modaaliin eli kun käyttäjä klikkaa korttia 
  const [detail, setDetail] = useState<ListedService | null>(null);

  const { t } = useI18n();


  // haetaan kaikki palvelut kun sivu latautuu
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await listServices({}); // hae kaikki palvelut
        setItems(data);
      } catch (e: unknown) {
        setError(toMessage(e));
      }
    })();
  }, []);


  const now = Date.now(); // nykyinen aika vertailua varten 

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


  // ----- UI -----
  return (
    <main className="page-shell py-8 md:py-12">
      {/* otsikko + selite */}
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

      {/* virheviesti */}
      {error && (
        <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3">
          {error}
        </div>
      )}

      {/* lataustila: items === null */}
      {!items && <div>{t("services.loading")}</div>}

      {/* korttilistaus */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {upcoming.map((s) => (
          // serviceCard kutsuu onOpen(service) kun käyttäjä haluaa avata detailin
          <ServiceCard key={s.id} s={s} onOpen={setDetail} />
        ))}
      </div>

      {/* detail-modal:
          - service=detail (null => käytännössä “ei valintaa”)
          - onClose nollaa detailin */}
      <ServiceDetailModal
        service={detail}
        onClose={() => setDetail(null)}
      />
    </main>
  );
}
