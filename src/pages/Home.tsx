import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceCard from "../features/services/ServiceCard";
import ServiceDetailModal from "../features/services/ServiceDetailModal";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";

export default function Home() {
  const [items, setItems] = useState<ListedService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListedService | null>(null);
  const [marqueePaused, setMarqueePaused] = useState(false);

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
  const allCourses = items ?? [];

  const upcoming = allCourses
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

  // rajataan max 10 kurssiin ja duplikoidaan → saumaton looppi
  const upcomingToShow = upcoming.slice(0, 10);
  const loopedUpcoming = [...upcomingToShow, ...upcomingToShow];

  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  return (
    <main className="home-main">
      {/* HERO + tulevat tapahtumat */}
      <section className="home-hero-layout">
        {/* Hero-teksti */}
        <div className="home-hero-text">
          <h1 className="home-hero-title">{t("hero.title")}</h1>
          <p className="home-hero-subtitle">{t("hero.subtitle")}</p>

          <div className="home-hero-actions">
            <Link to="/courses" className="btn-primary">
              {t("home.viewAllCourses")}
            </Link>
            <Link to="/upcoming" className="btn-secondary">
              {t("nav.upcoming")}
            </Link>
          </div>
        </div>

        {/* Tulevat tapahtumat -looppi */}
        <div className="surface-card home-upcoming-card">
          <div className="home-upcoming-header">
            <h2 className="home-upcoming-title">
              {t("home.upcomingTitle")}
            </h2>
            <div className="home-upcoming-count">
              <span className="home-upcoming-count-number">
                {upcoming.length}
              </span>
              <span>{t("home.upcomingCountShort")}</span>
            </div>
          </div>

          {loopedUpcoming.length > 0 ? (
            <div
              className="upcoming-marquee"
              onMouseEnter={() => setMarqueePaused(true)}
              onMouseLeave={() => setMarqueePaused(false)}
              onTouchStart={() => setMarqueePaused(true)}
              onTouchEnd={() => setMarqueePaused(false)}
            >
              <div
                className={
                  "upcoming-marquee-track" +
                  (marqueePaused ? " is-paused" : "")
                }
              >
                {loopedUpcoming.map((s, idx) => (
                  <button
                    key={`${s.id}-${idx}`}
                    type="button"
                    className="upcoming-card"
                    onClick={() => setDetail(s)}
                  >
                    <img
                      src={
                        s.image ||
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                      }
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="upcoming-card-body">
                      <div className="upcoming-card-date">
                        {s.datetime
                          ? new Date(s.datetime).toLocaleDateString(
                              locale
                            )
                          : t("course.timeTBA")}
                      </div>
                      <div className="upcoming-card-title">{s.name}</div>
                      <div className="upcoming-card-provider">
                        {s.service_provider}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="upcoming-marquee">
              <div className="upcoming-card-date">
                {t("services.noPreview")}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Kurssilista */}
      <section className="home-courses-section">
        <div className="home-courses-header">
          <h2 className="home-courses-title">
            {t("home.popularTitle")}
          </h2>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {!items && !error && (
          <div className="upcoming-card-date">
            {t("services.loading")}
          </div>
        )}

        <div className="courses-grid">
          {allCourses.map((s) => (
            <ServiceCard key={s.id} s={s} onOpen={setDetail} />
          ))}
        </div>
      </section>

      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
