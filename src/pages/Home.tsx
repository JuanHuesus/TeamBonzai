import { useEffect, useState } from "react";
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceCard from "../features/services/ServiceCard";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";
import ServiceDetailModal from "../features/services/ServiceDetailModal";
import { Link } from "react-router-dom";

export default function Home() {
  const [items, setItems] = useState<ListedService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListedService | null>(null);
  const { t, lang } = useI18n();

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

  // Näytetään kaikki kurssit “Suosituimmat”-osiossa (yksinkertaisesti kaikki listatut)
  const allCourses = (items ?? []).slice();

  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-neutral-600 max-w-prose">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="rounded-2xl px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              {t("home.viewAllCourses")}
            </Link>
            <Link
              to="/upcoming"
              className="rounded-2xl px-4 py-2.5 border text-sm font-medium hover:bg-black/5"
            >
              {t("nav.upcoming")}
            </Link>
          </div>
        </div>

        {/* Pieni teaser-grid tulevista */}
        <div className="grid grid-cols-2 gap-3">
          {upcoming.slice(0, 4).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setDetail(s)}
              className="text-left rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition"
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
              <div className="p-2">
                <div className="text-xs text-neutral-600">
                  {s.datetime
                    ? new Date(s.datetime).toLocaleDateString(locale)
                    : t("course.timeTBA")}
                </div>
                <div className="text-sm font-semibold line-clamp-2">
                  {s.name}
                </div>
              </div>
            </button>
          ))}
          {upcoming.length === 0 && (
            <div className="text-sm text-neutral-500 p-2">
              {t("services.noPreview")}
            </div>
          )}
        </div>
      </section>

      {/* Kaikki kurssit */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">
            {t("home.popularTitle")}
          </h2>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border bg-red-50 text-red-600 p-3">
            {error}
          </div>
        )}
        {!items && <div>{t("services.loading")}</div>}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {allCourses.map((s) => (
            <ServiceCard key={s.id} s={s} onOpen={setDetail} />
          ))}
        </div>
      </section>

      {/* Tulevat nostot (pidetään erillisenä nostona) */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">
            {t("home.upcomingTitle")}
          </h2>
          <Link to="/upcoming" className="text-sm underline">
            {t("nav.upcoming")}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {upcoming.slice(0, 6).map((s) => (
            <ServiceCard key={s.id} s={s} onOpen={setDetail} />
          ))}
        </div>
      </section>

      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
