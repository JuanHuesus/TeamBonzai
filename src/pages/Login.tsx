import { useState } from "react";
import { useAuth } from "../useAuth";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { toMessage } from "../lib/error";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("aino.koskinen@example.com");
  const [password, setPassword] = useState("testi");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="container">
      <h1>Kirjaudu</h1>
      <form onSubmit={onSubmit} className="card">
        <label>Sähköposti</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Salasana</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button disabled={loading}>{loading ? "Kirjaudutaan..." : "Kirjaudu"}</button>
      </form>
    </div>
  );
}
