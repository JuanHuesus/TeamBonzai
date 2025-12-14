// käyttäjä täyttää rekisteröitymislomakkeen ja lähettää sen
// kutsutaan useAuth().register(...) -> jos onnistuu, ohjataan etusivulle.
//
// tää tiedosto ei itse tee axios/fetch -kutsuj
// vaan käyttää (useAuth) joka hoitaa backendin

import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";
import { useAuth } from "../useAuth";

export default function Register() {
  const { t } = useI18n();

  const nav = useNavigate();
  const { register } = useAuth(); // rekisteröintifunktio auth-kontekstista

  // inputin arvo on sidottu Reactin stateen.
  // eli inputin value tulee state:sta ja onChange päivittää statea.
  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // nappia ei voi spämmiä


  // kutsutaan kun käyttäjä lähettää lomakkeen
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // estää selaimen reload-submitin 
    setError(null); 

    // pakolliset kentät täytetty
    // ! tätä validaatiota voisi laajentaa !
    if (!firstname.trim() || !surname.trim() || !email.trim() || !password) {
      setError(t("common.error"));
      return;
    }

    if (password !== password2) {
      setError(t("register.passwordMismatch"));
      return;
    }

    // estetään nappia spämmiämällä useampi submit yhtä aikaa
    setLoading(true);
    try {
      
      await register({ //register-funktio auth-kontekstista
        firstname: firstname.trim(),
        surname: surname.trim(),
        email: email.trim(),

        // jostain syystä password nimi on hashed_password, mutta tällä tarkoitetaan ihan normaalia salasanaa 
        hashed_password: password,
      });


      // jos rekisteröinti onnistui, navigoidaan etusivulle, muuten virhe
      nav("/");
    } catch (e: unknown) { 

      setError(toMessage(e)); 
    } finally {
      setLoading(false); // nappi taas käyttöön
    }
  };



  // ----- rekisteröintilomakkeen UI -----

  return (
    <main className="mx-auto max-w-md px-4 py-8 md:py-12">
      {/* otsikot */}
      <h1 className="text-2xl font-bold mb-4">{t("register.title")}</h1>
      <p className="text-sm text-neutral-600 mb-4">{t("register.info")}</p>

      {/* form: submit hoidetaan onSubmit-funktiolla */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-3"
      >
        {/* etunimi */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.firstname")}
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </div>

        {/* sukunimi */}
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

        {/* email */}
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

        {/* salasana */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("register.password")}
          </label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* salasana uudestaan */}
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

        {/* virhe näkyy vain jos error on asetettu */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        {/* nappi menee disabled kun loading=true (ettei voi spämmätä submitia) */}
        <button
          disabled={loading}
          className="w-full rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? t("register.submitting") : t("register.submit")}
        </button>

        {/* linkki login-sivulle */}
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
