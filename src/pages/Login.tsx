import { useState, type FormEvent } from "react";
import { useAuth } from "../useAuth";
import { useNavigate, Link } from "react-router-dom";
import { toMessage } from "../lib/error";
import { useI18n } from "../i18n";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("aino.koskinen@example.com");
  const [password, setPassword] = useState("testi");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch (e: unknown) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-4">{t("login.title")}</h1>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm space-y-3"
      >
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
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        <button
          disabled={loading}
          className="w-full rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-50 text-sm"
        >
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      <p className="mt-3 text-xs text-neutral-600">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="underline">
          {t("login.goToRegister")}
        </Link>
      </p>
    </main>
  );
}
