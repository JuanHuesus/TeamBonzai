// src/components/RequireAdmin.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { token, isAdmin } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Moderointi</h1>
        <p>Sinulla ei ole oikeuksia nähdä tätä sivua.</p>
      </div>
    );
  }

  return <>{children}</>;
}
