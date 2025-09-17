import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function AppLayout() {
  const { email, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500" />
            <Link to="/" className="font-bold tracking-tight text-xl">Novi</Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link className="hover:underline" to="/">Kurssit</Link>
            <a className="hover:underline" href="#">Opettajille</a>
            <a className="hover:underline" href="#">Hinnoittelu</a>
            {email ? (
              <button className="rounded-xl px-3 py-1.5 border" onClick={logout}>Kirjaudu ulos</button>
            ) : (
              <Link to="/login" className="rounded-xl px-3 py-1.5 border">Kirjaudu</Link>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t py-6 text-center text-sm text-neutral-500">
        MVP • API: <code>{import.meta.env.VITE_API_BASE_URL}</code>
      </footer>
    </div>
  );
}
