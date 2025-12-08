import { useI18n } from "../i18n";

export default function Help() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        {t("help.title")}
      </h1>
      <p className="text-neutral-700 mb-6">{t("help.intro")}</p>

      <section className="space-y-4 mb-8">
        <div>
          <h2 className="font-semibold">{t("help.q1")}</h2>
          <p className="text-sm text-neutral-700">{t("help.a1")}</p>
        </div>
        <div>
          <h2 className="font-semibold">{t("help.q2")}</h2>
          <p className="text-sm text-neutral-700">{t("help.a2")}</p>
        </div>
        <div>
          <h2 className="font-semibold">{t("help.q3")}</h2>
          <p className="text-sm text-neutral-700">{t("help.a3")}</p>
        </div>
        <div>
          <h2 className="font-semibold">{t("help.q4")}</h2>
          <p className="text-sm text-neutral-700">{t("help.a4")}</p>
        </div>
      </section>

      <section className="border-t pt-6">
        <h2 className="font-semibold mb-2">{t("help.termsTitle")}</h2>
        <p className="text-sm text-neutral-700">{t("help.termsBody")}</p>
      </section>
    </main>
  );
}
