import { useI18n } from "../i18n";

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">
          {t("help.title")}
        </h1>
        <p className="text-sm text-neutral-700">
          {t("help.intro")}
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-lg">
          {t("help.faqTitle")}
        </h2>
        <div className="space-y-2 text-sm">
          <div>
            <div className="font-semibold">{t("help.q1")}</div>
            <div className="text-neutral-700">{t("help.a1")}</div>
          </div>
          <div>
            <div className="font-semibold">{t("help.q2")}</div>
            <div className="text-neutral-700">{t("help.a2")}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-2 text-xs text-neutral-600">
        <h2 className="font-semibold text-sm">
          {t("help.termsTitle")}
        </h2>
        <p>{t("help.termsText")}</p>
      </section>
    </main>
  );
}
