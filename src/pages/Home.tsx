import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceCard from "../features/services/ServiceCard";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";
import ServiceDetailModal from "../features/services/ServiceDetailModal";

export default function Home() {
  const [items, setItems] = useState<ListedService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListedService | null>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
    // lataa kurssit etusivulle
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

  const allCourses = (items ?? []).slice();
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  return (
    <main className="page-shell py-10 md:py-14 space-y-12">
      {/* hero + tulevat tapahtumat -kortti */}
      <section className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start">
        {/* vasen puoli: hero-teksti */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
            {t("hero.title")}
          </h1>
          <p className="text-base md:text-lg text-neutral-700 max-w-prose">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/courses" className="btn-primary">
              {t("home.viewAllCourses")}
            </Link>
            <Link to="/upcoming" className="btn-secondary">
              {t("nav.upcoming")}
            </Link>
          </div>
        </div>

        {/* oikea puoli: tulevat tapahtumat -kortti */}
        <div className="surface-card shadow-md border-orange-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100 bg-orange-50/80 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-slate-900">
              {t("home.upcomingTitle")}
            </h2>
            <span className="text-xs text-neutral-500">
              {lang === "fi"
                ? `${upcoming.length} tapahtumaa tulossa`
                : `${upcoming.length} upcoming`}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 py-4">
            {upcoming.slice(0, 4).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetail(s)}
                className="min-w-[190px] max-w-[220px] text-left rounded-2xl overflow-hidden border border-orange-100 bg-white hover:shadow-md transition"
              >
                <img
                  src={
                    s.image ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                  }
                  alt=""
                  className="h-24 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
                  }}
                />
                <div className="p-2 space-y-1">
                  <div className="text-[11px] text-neutral-500">
                    {s.datetime
                      ? new Date(s.datetime).toLocaleDateString(locale)
                      : t("course.timeTBA")}
                  </div>
                  <div className="text-sm font-semibold line-clamp-2 text-slate-900">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {s.service_provider}
                  </div>
                </div>
              </button>
            ))}

            {upcoming.length === 0 && (
              <div className="text-sm text-neutral-500 py-2">
                {t("services.noPreview")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* kaikki kurssit */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-orange-100 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            {t("home.popularTitle")}
          </h2>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm">
            {error}
          </div>
        )}

        {!items && (
          <div className="text-sm text-neutral-600">{t("services.loading")}</div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {allCourses.map((s) => (
            <ServiceCard key={s.id} s={s} onOpen={setDetail} />
          ))}
        </div>
      </section>

      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
