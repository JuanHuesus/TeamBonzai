import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { toMessage } from "../lib/error";
import { useAuth } from "../useAuth";

export default function Register() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { register } = useAuth();

  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!firstname.trim() || !surname.trim() || !email.trim() || !password) {
      setError(t("common.error"));
      return;
    }
    if (password !== password2) {
      setError(t("register.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await register({
        firstname: firstname.trim(),
        surname: surname.trim(),
        email: email.trim(),
        hashed_password: password, // ⬅ tärkeä: kentän nimi
      });

      // AuthContext.register + applyAuth hoitaa tokenin ja profiilin
      nav("/");
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-4">{t("register.title")}</h1>
      <p className="text-sm text-neutral-600 mb-4">
        {t("register.info")}
      </p>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-3"
      >
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

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? t("register.submitting") : t("register.submit")}
        </button>

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
