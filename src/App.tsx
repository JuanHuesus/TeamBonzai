// jee jee jee, single page appi

import { Link, Outlet } from "react-router-dom"; //sisäinen link
import { useAuth } from "./useAuth"; 
import { useI18n } from "./i18n"; 

export default function AppLayout() {
 
  const { email, logout, role } = useAuth(); // logout tyhjentää authin


  const { t, lang, setLang } = useI18n(); //t = käännösfunktio


  const isModerator = role === "admin" || role === "moderator";


  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER: brändi + nav + lang */}
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="page-shell py-3 flex items-center justify-between gap-4">
          {/* Brändi / home-linkki */}
          <div className="flex items-center gap-2">
            {/* tätä saa joku pätevä kaunistaa. meikän artistisilla kyvyillä ei parempaa tuu :D*/}
            <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              C
            </div>

            {/*  */}
            <Link to="/" className="font-bold tracking-tight text-xl text-slate-900">
              ChefUP
            </Link>
          </div>

          {/* Päävalikko:
              hidden md:flex = piilossa puhelimessa, näkyy pc:llä. !!!! tän voi mahdolliseti poistaan ghpages vaiheen jälkeen.
              Tähän kans tarvis jonkun mobiili navigaation jos haluaa jatkokehittää */}
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

            {/* mod check */}
            {isModerator && (
              <Link className="hover:text-slate-900 hover:underline" to="/moderation">
                {t("nav.moderation")}
              </Link>
            )}

            {/* authin mukaan napit:
                - jos email on -> näytetään logout
                - muuten login + register */}
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

          {/* “pill”-UI näyttää aktiivisen kielen korostettuna. */}
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



      {/* ---- OUTLET ---- */}
      <div className="flex-1">
        <Outlet />
      </div>

  

      {/* FOOTER */}
      <footer className="border-t border-orange-100 mt-8 py-6 text-sm text-neutral-600 bg-white/80">
        <div className="page-shell text-center">
          <div>ChefUP · {t("footer.tagline")}</div>

          <div className="mt-1">
            {t("footer.contact")}:{" "}
            {/* mailto toimii tyylliin vaan win koneissa? */}
            <a href="mailto:chefup@example.com" className="underline">
              chefup@example.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
