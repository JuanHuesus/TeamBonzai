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
  const [detail, setDetail] = useState<ListedService | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const data = await listServices({});
        setItems(data);
      } catch (e: unknown) {
        setError(toMessage(e));
      }
    })();
  }, []);

  const now = Date.now();
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

  return (
    <main className="page-shell py-8 md:py-12">
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

      {error && (
        <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3">
          {error}
        </div>
      )}
      {!items && <div>{t("services.loading")}</div>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {upcoming.map((s) => (
          <ServiceCard key={s.id} s={s} onOpen={setDetail} />
        ))}
      </div>

      <ServiceDetailModal
        service={detail}
        onClose={() => setDetail(null)}
      />
    </main>
  );
}
