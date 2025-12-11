import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useI18n } from "./i18n";

export default function AppLayout() {
  const { email, logout, role } = useAuth();
  const { t, lang, setLang } = useI18n();

  const isModerator = role === "admin" || role === "moderator";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Logo / brändi */}
            <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            <Link to="/" className="font-bold tracking-tight text-xl">
              ChefUP
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link className="hover:underline" to="/">
              {t("nav.home")}
            </Link>
            <Link className="hover:underline" to="/courses">
              {t("nav.courses")}
            </Link>
            <Link className="hover:underline" to="/profile">
              {t("nav.profile")}
            </Link>
            <Link className="hover:underline" to="/help">
              {t("nav.help")}
            </Link>
            {isModerator && (
              <Link className="hover:underline" to="/moderation">
                {t("nav.moderation")}
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
              <>
                <Link to="/login" className="rounded-xl px-3 py-1.5 border">
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl px-3 py-1.5 border"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </nav>

          {/* Kieli-switcher */}
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="border-t mt-8 py-6 text-center text-sm text-neutral-500">
        <div>ChefUP · {t("footer.tagline")}</div>
        <div className="mt-1">
          {t("footer.contact")}:{" "}
          <a href="mailto:chefup@example.com" className="underline">
            chefup@example.com
          </a>
        </div>
        <div className="mt-1 text-xs">
          API: <code>{import.meta.env.VITE_API_BASE_URL}</code>
        </div>
      </footer>
    </div>
  );
}
