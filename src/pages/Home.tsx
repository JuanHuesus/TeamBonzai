import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceDetailModal from "../features/services/ServiceDetailModal";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";

/**
 * Home = etusivu.
 * Näyttää:
 * - hero-alueen (otsikko, nappulat, tilastot)
 * - tulevien tapahtumien “marquee” -listan (liukuva rivi)
 * - “featured”/suositellut kurssit (max 6)
 * - ServiceDetailModalin, kun käyttäjä klikkaa kurssia
 */
export default function Home() {
  // items = kaikki kurssit backendistä (null = ei vielä ladattu)
  const [items, setItems] = useState<ListedService[] | null>(null);

  // virheviesti jos haku epäonnistuu
  const [error, setError] = useState<string | null>(null);

  // detail = se kurssi, jonka detail-modaali on auki (null = modaali kiinni)
  const [detail, setDetail] = useState<ListedService | null>(null);

  // marqueePaused = pysäytetään liukuvan listan animaatio kun käyttäjä hoveraa/touchaa
  const [marqueePaused, setMarqueePaused] = useState(false);

  const { t, lang } = useI18n();

  /**
   * useEffect([]) = ajetaan kerran kun sivu avautuu.
   * Haetaan kaikki kurssit backendistä ja tallennetaan stateen.
   */
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

  // Nykyhetki (ms aikaleima) tapahtumien suodatukseen
  const now = Date.now();

  // Jos items on null, käytetään tyhjää listaa ettei koodi kaadu
  const allCourses = items ?? [];

  /**
   * upcoming = kaikki tulevat kurssit:
   * - datetime pitää olla olemassa
   * - datetime pitää olla validi päivämäärä
   * - datetime pitää olla nykyhetken jälkeen
   * Lisäksi sortataan aikajärjestykseen (lähin ensin)
   */
  const upcoming = allCourses
    .filter(
      (s) =>
        s.datetime &&
        !Number.isNaN(new Date(s.datetime).getTime()) &&
        new Date(s.datetime).getTime() >= now
    )
    .sort(
      (a, b) => new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime()
    );

  /**
   * Marquee näyttää maksimissaan 10 tulevaa tapahtumaa.
   * “Duplikoidaan lista” (A+B), jotta saadaan saumaton looppi-efekti animaatioon.
   */
  const upcomingToShow = upcoming.slice(0, 10);
  const loopedUpcoming = [...upcomingToShow, ...upcomingToShow];

  // Päivämäärän muoto kielestä riippuen
  const locale = lang === "fi" ? "fi-FI" : "en-GB";

  /**
   * Featured-kurssit: etusivulla nostetaan esiin max 6 kurssia.
   * useMemo: laskenta tehdään uudestaan vain kun allCourses muuttuu.
   */
  const featuredCourses = useMemo(() => allCourses.slice(0, 6), [allCourses]);

  /**
   * providerCount: montako uniikkia service_provider -nimeä löytyy.
   * useMemo: ei lasketa uudelleen joka renderillä turhaan.
   */
  const providerCount = useMemo(() => {
    const set = new Set(
      allCourses
        .map((s) => s.service_provider)
        .filter((x): x is string => !!x)
    );
    return set.size;
  }, [allCourses]);

  return (
    <main className="home-main">
      {/* HERO + tulevat tapahtumat */}
      <section className="home-hero-layout">
        {/* Hero-teksti + statit */}
        <div className="home-hero-text">
          <h1 className="home-hero-title">{t("hero.title")}</h1>
          <p className="home-hero-subtitle">{t("hero.subtitle")}</p>

          {/* CTA-napit */}
          <div className="home-hero-actions">
            <Link to="/courses" className="btn-primary">
              {t("home.viewAllCourses")}
            </Link>
            <Link to="/upcoming" className="btn-secondary">
              {t("nav.upcoming")}
            </Link>
          </div>

          {/* Statit: kurssien määrä, tulevien määrä, vetäjien määrä */}
          <div className="home-hero-stats">
            <div className="home-hero-stat-item">
              <div className="home-hero-stat-number">{allCourses.length}</div>
              <div className="home-hero-stat-label">{t("home.statCourses")}</div>
            </div>

            <div className="home-hero-stat-item">
              <div className="home-hero-stat-number">{upcoming.length}</div>
              <div className="home-hero-stat-label">
                {t("home.statUpcoming")}
              </div>
            </div>

            <div className="home-hero-stat-item">
              <div className="home-hero-stat-number">{providerCount}</div>
              <div className="home-hero-stat-label">
                {t("home.statProviders")}
              </div>
            </div>
          </div>
        </div>

        {/* Tulevat tapahtumat (marquee/looppi) */}
        <div className="surface-card home-upcoming-card">
          <div className="home-upcoming-header">
            <h2 className="home-upcoming-title">{t("home.upcomingTitle")}</h2>
            <div className="home-upcoming-count">
              <span className="home-upcoming-count-number">{upcoming.length}</span>
              <span>{t("home.upcomingCountShort")}</span>
            </div>
          </div>

          {/* Jos löytyy tulevia, näytetään liukuva lista. Muuten placeholder. */}
          {loopedUpcoming.length > 0 ? (
            <div
              className="upcoming-marquee"
              // Hover/touch pysäyttää animaation (helpottaa klikkaamista)
              onMouseEnter={() => setMarqueePaused(true)}
              onMouseLeave={() => setMarqueePaused(false)}
              onTouchStart={() => setMarqueePaused(true)}
              onTouchEnd={() => setMarqueePaused(false)}
            >
              <div
                className={
                  "upcoming-marquee-track" + (marqueePaused ? " is-paused" : "")
                }
              >
                {loopedUpcoming.map((s, idx) => (
                  // Button: klikkaamalla avataan detail-modaali (setDetail)
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
                          ? new Date(s.datetime).toLocaleDateString(locale)
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
              <div className="upcoming-card-date">{t("services.noPreview")}</div>
            </div>
          )}
        </div>
      </section>

      {/* Kurssinostot (featured) */}
      <section className="home-courses-section">
        <div className="home-courses-header">
          <div>
            <h2 className="home-courses-title">{t("home.popularTitle")}</h2>
            <p className="home-courses-subtitle">{t("home.popularSubtitle")}</p>
          </div>
          <Link to="/courses" className="btn-secondary">
            {t("home.viewAllCourses")}
          </Link>
        </div>

        {/* Virheviesti */}
        {error && <div className="error-banner">{error}</div>}

        {/* Lataustila: items on null ja ei virhettä */}
        {!items && !error && (
          <div className="upcoming-card-date">{t("services.loading")}</div>
        )}

        {/* Featured-grid: klikkaus avaa modalin */}
        <div className="home-courses-grid">
          {featuredCourses.map((s) => (
            <button
              key={s.id}
              type="button"
              className="home-course-card"
              onClick={() => setDetail(s)}
            >
              <div className="home-course-image-wrapper">
                <img
                  src={s.image || "https://placehold.co/800x450?text=Kuva"}
                  alt=""
                  className="home-course-image"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x450?text=Kuva";
                  }}
                />
              </div>
              <div className="home-course-content">
                <div className="home-course-date">
                  {s.datetime
                    ? new Date(s.datetime).toLocaleDateString(locale)
                    : t("course.timeTBA")}
                </div>
                <div className="home-course-title">{s.name}</div>
                <div className="home-course-provider">{s.service_provider}</div>
                {s.location && (
                  <div className="home-course-meta">{s.location}</div>
                )}
              </div>
            </button>
          ))}

          {/* Jos ei featured-kursseja mutta data on ladattu */}
          {featuredCourses.length === 0 && items && (
            <div className="upcoming-card-date">{t("services.noPreview")}</div>
          )}
        </div>
      </section>

      {/* Detail-modaali: näkyy kun detail != null */}
      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
