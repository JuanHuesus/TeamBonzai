import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useI18n } from "./i18n";

export default function AppLayout() {
  const { email, logout } = useAuth();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl">
              🍳
            </div>
            <Link to="/" className="font-bold tracking-tight text-xl">
              {t("brand.name")}
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link className="hover:underline" to="/">
              {t("nav.home")}
            </Link>
            <Link className="hover:underline" to="/courses">
              {t("nav.courses")}
            </Link>
            <Link className="hover:underline" to="/upcoming">
              {t("nav.upcoming")}
            </Link>
            <Link className="hover:underline" to="/help">
              {t("nav.help")}
            </Link>
            {email && (
              <Link className="hover:underline" to="/profile">
                {t("nav.profile")}
              </Link>
            )}

            {email ? (
              <button
                className="rounded-xl px-3 py-1.5 border"
                onClick={logout}
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/login" className="rounded-xl px-3 py-1.5 border">
                {t("nav.login")}
              </Link>
            )}

            <div className="flex items-center gap-1 border rounded-full px-1 py-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLang("fi")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "fi"
                    ? "bg-emerald-600 text-white"
                    : "text-neutral-700"
                }`}
              >
                FI
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "en"
                    ? "bg-emerald-600 text-white"
                    : "text-neutral-700"
                }`}
              >
                EN
              </button>
            </div>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t py-6 text-center text-sm text-neutral-600 mt-8">
        <div className="space-y-1">
          <div className="font-semibold">
            {t("footer.contact")}: {t("brand.name")}
          </div>
          <div>
            {t("footer.email")}:{" "}
            <a
              href="mailto:info@chefup.test"
              className="underline decoration-dotted"
            >
              info@chefup.test
            </a>{" "}
            • {t("footer.phone")}: +358 40 000 0000
          </div>
          <div className="text-xs">
            {t("footer.demoNote")}
            <code>{import.meta.env.VITE_API_BASE_URL}</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
