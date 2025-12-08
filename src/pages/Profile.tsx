import { Link } from "react-router-dom";
import { useAuth } from "../useAuth";
import { useI18n } from "../i18n";

export default function Profile() {
  const { email } = useAuth();
  const { t } = useI18n();

  if (!email) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          {t("profile.title")}
        </h1>
        <p className="mb-4 text-neutral-700">{t("profile.notLoggedIn")}</p>
        <Link
          to="/login"
          className="inline-flex rounded-xl px-4 py-2 border bg-black text-white text-sm"
        >
          {t("profile.goToLogin")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        {t("profile.title")}
      </h1>
      <div className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-4">
        <div>
          <div className="text-sm font-medium text-neutral-500">
            {t("profile.email")}
          </div>
          <div className="text-base font-mono mt-1">{email}</div>
        </div>
        <p className="text-sm text-neutral-600">
          {t("profile.placeholderIntro")}
        </p>
      </div>
    </main>
  );
}
