import { useContext } from "react";
import { AuthContext } from "./authContext";


export function useAuth() {
  // luuetaan authContextin tämänhetkinen arvo lähimmästä providerista ylöspäin
  const ctx = useContext(AuthContext);

  // jos ctx on null, komponentti ei oo <AuthProvider>...</AuthProvider> sisällä
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  //palautetaan auth-objekti ( role, userId, login jne)
  return ctx;
}
