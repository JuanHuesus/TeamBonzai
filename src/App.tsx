// AppLayout.tsx
// Sovelluksen “kehys”: header + footer ovat aina näkyvissä,
// ja keskellä Outlet renderöi sen sivun, joka vastaa nykyistä reittiä.
// Tänne kannattaa laittaa yhteinen navigaatio, brändi ja kielivalinta.

import { Link, Outlet } from "react-router-dom"; // Link = sisäinen linkki, Outlet = “paikka” johon reittien sivut renderöityvät
import { useAuth } from "./useAuth"; // auth-hook: email/role kertoo kirjautumisen ja roolin, logout tekee uloskirjautumisen
import { useI18n } from "./i18n"; // i18n-hook: t(key) käännökset, lang ja setLang kielenvaihtoon

export default function AppLayout() {
  // Auth-tila:
  // - email: jos löytyy, käyttäjä on käytännössä kirjautunut
  // - role: roolipohjaiseen näkyvyyteen (esim. moderointi-linkki)
  // - logout: tyhjentää authin (token + user jne.)
  const { email, logout, role } = useAuth();

  // i18n:
  // - t("...") hakee käännöstekstin
  // - lang kertoo nykyisen kielen
  // - setLang vaihtaa kielen
  const { t, lang, setLang } = useI18n();

  // Moderointi näkyy vain admin/moderator rooleille.
  // Huom: tämä on vain UI-tason piilotus — backendin pitää silti estää access.
  const isModerator = role === "admin" || role === "moderator";

  // Layout-rakenne:
  // - sticky header (pysyy ylhäällä scrollissa)
  // - Outlet keskellä (reitin sisältö)
  // - footer alhaalla
  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER: brändi + nav + kielivalinta */}
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="page-shell py-3 flex items-center justify-between gap-4">
          {/* Brändi / etusivu-linkki */}
          <div className="flex items-center gap-2">
            {/* “C”-ikoni (pieni brändimerkki) */}
            <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              C
            </div>

            {/* Brändin nimi linkkinä etusivulle */}
            <Link to="/" className="font-bold tracking-tight text-xl text-slate-900">
              ChefUP
            </Link>
          </div>

          {/* Päävalikko:
              hidden md:flex = piilossa puhelimessa, näkyy tablet/desktopissa.
              (Mobiilinavigaatio pitäisi olla erikseen, jos halutaan sama menu myös pienille ruuduille.) */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <Link className="hover:text-slate-900 hover:underline" to="/">
              {t("nav.home")}
            </Link>
            <Link className="hover:text-slate-900 hover:underline" to="/courses">
              {t("nav.courses")}
            </Link>
            <Link className="hover:text-slate-900 hover:underline" to="/profile">
              {t("nav.profile")}
            </Link>
            <Link className="hover:text-slate-900 hover:underline" to="/help">
              {t("nav.help")}
            </Link>

            {/* Roolipohjainen linkki moderointiin */}
            {isModerator && (
              <Link className="hover:text-slate-900 hover:underline" to="/moderation">
                {t("nav.moderation")}
              </Link>
            )}

            {/* Authin mukaan eri napit:
                - jos email on olemassa -> näytetään Logout
                - muuten näytetään Login + Register */}
            {email ? (
              <button className="btn-secondary" onClick={logout}>
                {t("nav.logout")}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="btn-secondary">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </nav>

          {/* Kielivalinta:
              Vaihtaa vain frontin kielen (ei vaadi backend-kutsuja).
              “pill”-UI näyttää aktiivisen kielen korostettuna. */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-slate-200 rounded-full px-1 py-0.5 text-xs bg-white/70">
              <button
                type="button"
                onClick={() => setLang("fi")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "fi" ? "bg-emerald-600 text-white" : "text-slate-700"
                }`}
              >
                FI
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "en" ? "bg-emerald-600 text-white" : "text-slate-700"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Outlet = reitin sivu renderöityy tähän.
          AppLayout toimii siis “kuorena” kaikille sivuille. */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* FOOTER: perusinfo / yhteystiedot (tällä hetkellä placeholder) */}
      <footer className="border-t border-orange-100 mt-8 py-6 text-sm text-neutral-600 bg-white/80">
        <div className="page-shell text-center">
          <div>ChefUP · {t("footer.tagline")}</div>

          <div className="mt-1">
            {t("footer.contact")}:{" "}
            {/* mailto-linkki avaa sähköpostiohjelman */}
            <a href="mailto:chefup@example.com" className="underline">
              chefup@example.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
