// ProfilePage.tsx
// Profiilisivu: näyttää kirjautuneen käyttäjän sähköpostin ja listaa hänen tekemänsä raportit.
// Tämä on “oma näkymä” käyttäjälle (ei moderaattorin näkymä).

import { useEffect, useState } from "react"; // React-hookit: state + sivuvaikutukset
import { useAuth } from "../useAuth"; // projektin auth-hook: antaa käyttäjän tiedot (tässä email)
import { listServices } from "../features/services/api.services";
import type { ListedService } from "../types";
import ServiceCard from "../features/services/ServiceCard";
import { useI18n } from "../i18n"; // i18n-hook: t(key) hakee käännökset
import { getMyReports } from "../features/reports/api.reports";
// API-kutsu backendille: hakee "minun raporttini" (kirjautuneen käyttäjän tekemät raportit)
import type { Report } from "../types"; // TypeScript-tyyppi raporttilistalle
import { toMessage } from "../lib/error"; // muuntaa virheen luettavaksi viestiksi

export default function ProfilePage() {
  // useAuth() antaa tässä sähköpostin ja userId -> toimii käytännössä “onko kirjautunut” -tarkistuksena
  const { email, userId } = useAuth();

  // Käännökset UI-teksteille
  const { t } = useI18n();

  // reports: null = ei vielä ladattu, [] = ladattu mutta ei raportteja, [..] = data löytyy
  const [reports, setReports] = useState<Report[] | null>(null);

  // userCourses: null = ei vielä ladattu, [] = ladattu mutta ei kursseja, [..] = data löytyy
  const [userCourses, setUserCourses] = useState<ListedService[] | null>(null);

  // error: jos getMyReports epäonnistuu, näytetään viesti
  const [error, setError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // useEffect: kun email muuttuu (eli kirjautuminen tapahtuu / poistuu), ajetaan raporttien haku
  useEffect(() => {
    // Jos ei ole emailia, käyttäjä ei ole kirjautunut -> ei haeta raportteja
    if (!email) return;

    // IIFE (Immediately Invoked Function Expression):
    (async () => {
      try {
        const data = await getMyReports(); // API: hae kirjautuneen käyttäjän raportit
        setReports(data); // tallenna UI:lle
      } catch (e: unknown) {
        setError(toMessage(e)); // virhe -> käyttäjäystävällinen teksti
      }
    })();
  }, [email]); // ajetaan uudestaan jos email muuttuu

  // Hae käyttäjän omat kurssit/palvelut
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const all = await listServices();
        // Suodatetaan vain käyttäjän luomat kurssit
        const mine = all.filter((svc) => svc.listing_creator === userId);
        setUserCourses(mine);
      } catch (e: unknown) {
        setCoursesError(toMessage(e));
      }
    })();
  }, [userId]);

  // Jos ei ole kirjautunut, näytetään “kirjaudu sisään” -näkymä
  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t("profile.title")}</h1>
        <p className="text-sm text-neutral-600">
          {t("profile.loginRequired")}
        </p>
      </main>
    );
  }

  // Kirjautuneen käyttäjän profiilinäkymä
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      {/* Profiilin “perustiedot” -kortti */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{t("profile.title")}</h1>

        {/* Näytetään käyttäjän email (tulee useAuth-hookista) */}
        <p className="text-sm">
          {t("profile.emailLabel")}: <strong>{email}</strong>
        </p>

        {/* Pieni seliteteksti käyttäjälle */}
        <p className="mt-2 text-xs text-neutral-500">
          {t("profile.subtitle")}
        </p>
      </section>

      {/* Omat kurssit/palvelut -kortti */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">
          {t("profile.myCoursesTitle")}
        </h2>
        {coursesError && (
          <div className="mb-2 rounded-xl border bg-red-50 text-red-600 p-2 text-sm">
            {coursesError}
          </div>
        )}
        {!userCourses && (
          <div className="text-sm text-neutral-500">
            {t("profile.loadingCourses")}
          </div>
        )}
        {userCourses && userCourses.length === 0 && (
          <div className="text-sm text-neutral-500">
            {t("profile.noCourses")}
          </div>
        )}
        {userCourses && userCourses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {userCourses.map((svc) => (
              <ServiceCard key={svc.id} s={svc} onOpen={() => {}} />
            ))}
          </div>
        )}
      </section>

      {/* “Minun raportit” -kortti */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">
          {t("profile.myReportsTitle")}
        </h2>

        {/* Virheviesti jos raporttien haku epäonnistuu */}
        {error && (
          <div className="mb-2 rounded-xl border bg-red-50 text-red-600 p-2 text-sm">
            {error}
          </div>
        )}

        {/* Kun reports on null -> dataa ei ole vielä tullut */}
        {!reports && (
          <div className="text-sm text-neutral-500">
            {t("profile.loadingReports")}
          </div>
        )}

        {/* Kun reports on ladattu mutta tyhjä */}
        {reports && reports.length === 0 && (
          <div className="text-sm text-neutral-500">
            {t("profile.noReports")}
          </div>
        )}

        {/* Kun reports sisältää raportteja -> listataan ne */}
        {reports && reports.length > 0 && (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id} // Reactille listan vakaa avain
                className="border rounded-xl p-2 text-xs bg-neutral-50"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Raportin kohde: palvelu vai käyttäjä */}
                  <span className="font-semibold">
                    {r.target_type === "service"
                      ? t("profile.reportService")
                      : t("profile.reportUser")}
                  </span>

                  {/* Raportin status pillinä */}
                  <span className="inline-flex rounded-full px-2 py-0.5 border">
                    {r.status}
                  </span>
                </div>

                {/* Luontiaika backendistä -> muotoillaan fi-FI */}
                <div className="mt-1 text-[10px] text-neutral-500">
                  {new Date(r.created).toLocaleString("fi-FI")}
                </div>

                {/* Raportin syy ja mahdolliset lisätiedot */}
                <div className="mt-1 font-semibold">{r.reason}</div>
                {r.details && (
                  <div className="mt-1 text-neutral-700">{r.details}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
