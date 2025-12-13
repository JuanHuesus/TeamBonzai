// Register.tsx
// Rekisteröitymissivu: kerää käyttäjän tiedot, validoi ne kevyesti frontissa,
// kutsuu AuthContextin register()-funktiota (joka tekee API-kutsun backendille)
// ja navigoi etusivulle kun rekisteröinti onnistuu.

import { useState, type FormEvent } from "react"; // useState = lomakkeen tila, FormEvent = TS-tyyppi submit-eventille
import { useNavigate, Link } from "react-router-dom"; // useNavigate = sivun vaihto koodista, Link = sisäinen linkki ilman reloadia
import { useI18n } from "../i18n"; // i18n-hook: t(key) palauttaa käännetyn tekstin
import { toMessage } from "../lib/error"; // muuntaa error-olion selkeäksi tekstiksi UI:lle
import { useAuth } from "../useAuth"; // auth-hook: tarjoaa register()-funktion (ja muut auth-toiminnot)

export default function Register() {
  // t() käytetään UI-teksteihin (suomi/englanti jne.)
  const { t } = useI18n();

  // nav() vaihdetaan reittiä ohjelmallisesti (esim. onnistuneen rekisteröinnin jälkeen)
  const nav = useNavigate();

  // register() tulee projektin auth-kerroksesta:
  // yleensä se tekee POST /api/auth/register tms ja tallentaa tokenin/profiilin
  const { register } = useAuth();

  // Lomakkeen kentät pidetään state-muuttujissa -> inputit ovat "controlled components"
  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // error: näytetään virheviesti käyttäjälle
  const [error, setError] = useState<string | null>(null);

  // loading: estää tuplaklikkaukset ja näyttää "lähettää..." tekstin
  const [loading, setLoading] = useState(false);

  // onSubmit: ajetaan kun formi lähetetään
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // estää selaimen oletus-submitin (page reload)
    setError(null); // nollataan vanha virhe

    // Kevyt validointi frontissa:
    // - trim() poistaa turhat välilyönnit alusta/lopusta
    if (!firstname.trim() || !surname.trim() || !email.trim() || !password) {
      setError(t("common.error")); // yleinen "täytä kaikki kentät" tms
      return;
    }

    // Salasanan varmistus
    if (password !== password2) {
      setError(t("register.passwordMismatch"));
      return;
    }

    setLoading(true); // UI: nappi disabled + "submitting"
    try {
      // Kutsutaan auth-kerroksen registeriä.
      // Tämä abstrahoi pois sen, missä endpointissa on backend ja miten token tallennetaan.
      await register({
        firstname: firstname.trim(),
        surname: surname.trim(),
        email: email.trim(),

        // HUOM: backend odottaa kenttää nimellä "hashed_password".
        // Tässä annetaan raakateksti password -> backend (toivottavasti) hashää sen.
        // (Kentän nimi voi olla tekninen legacy-nimi vaikka sisältö ei vielä olisi hash.)
        hashed_password: password,
      });

      // Onnistui:
      // Kommentin idea: register() todennäköisesti tallentaa tokenin ja user-profiilin (applyAuth tms)
      // joten tämän jälkeen käyttäjä on käytännössä "kirjautunut sisään".
      nav("/"); // ohjataan etusivulle
    } catch (e: unknown) {
      // Backend/verkko/validointi-virheet -> toMessage tekee niistä luettavan
      setError(toMessage(e));
    } finally {
      setLoading(false); // vapautetaan nappi, myös virhetilanteessa
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8 md:py-12">
      {/* Otsikot ja infot tulevat i18n:stä */}
      <h1 className="text-2xl font-bold mb-4">{t("register.title")}</h1>
      <p className="text-sm text-neutral-600 mb-4">{t("register.info")}</p>

      {/* Formi: onSubmit hoitaa validoinnin + API-kutsun */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-3"
      >
        {/* Etunimi */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.firstname")}
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={firstname} // controlled input -> arvo tulee state:stä
            onChange={(e) => setFirstname(e.target.value)} // päivittää statea jokaisella näppäilyllä
          />
        </div>

        {/* Sukunimi */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.surname")}
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.email")}
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Salasana */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.password")}
          </label>
          <input
            type="password" // selaimen salasana-UI
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Salasanan vahvistus */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.passwordConfirm")}
          </label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        {/* Virheviesti (jos error != null) */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit-nappi: disabled loading-tilassa */}
        <button
          disabled={loading}
          className="w-full rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? t("register.submitting") : t("register.submit")}
        </button>

        {/* Alalinkki login-sivulle (tekstit näyttää olevan nimetty vähän hassusti i18n:ssä) */}
        <div className="text-xs text-neutral-600 mt-2">
          {t("login.noAccount")}{" "}
          <Link to="/login" className="underline">
            {t("login.goToRegister")}
          </Link>
        </div>
      </form>
    </main>
  );
}
