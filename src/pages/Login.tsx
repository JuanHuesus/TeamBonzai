import { useState, type FormEvent } from "react";
import { useAuth } from "../useAuth";
import { useNavigate, Link } from "react-router-dom";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";

/**
 * Login-sivu:
 * - näyttää sähköposti + salasana -lomakkeen
 * - kutsuu useAuth().login(...) kun käyttäjä lähettää lomakkeen
 * - onnistuneen loginin jälkeen navigoi etusivulle "/"
 */
export default function Login() {
  // login-funktio tulee auth-kontekstista (hoitaa kirjautumisen backendille)
  const { login } = useAuth();

  // nav(...) = ohjelmallinen navigointi (esim. loginin jälkeen etusivulle)
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI-tilat: virhe ja lataus
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Käännöstekstit (FI/EN)
  const { t } = useI18n();

  /**
   * Lomakkeen lähetys:
   * - estetään selaimen oletus submit (ei sivun refreshia)
   * - kutsutaan login(email, password)
   * - jos onnistuu -> siirrytään etusivulle
   * - jos epäonnistuu -> näytetään virhe
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      nav("/");
    } catch (e: unknown) {
      // toMessage muuttaa virheen luettavaan muotoon (esim. axios error -> teksti)
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Keskitetty kirjautumisnäkymä
    <main className="mx-auto max-w-md px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-4">{t("login.title")}</h1>

      {/* Lomake */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-3"
      >
        {/* Email-kenttä */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("login.email")}
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Salasana-kenttä */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("login.password")}
          </label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Virheviesti (näytetään vain jos error != null) */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit-nappi:
            - disabled jos login on käynnissä
            - teksti vaihtuu loading-tilan mukaan */}
        <button
          disabled={loading}
          className="w-full rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      {/* Linkki rekisteröintiin */}
      <p className="mt-3 text-xs text-neutral-600">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="underline">
          {t("login.goToRegister")}
        </Link>
      </p>
    </main>
  );
}
