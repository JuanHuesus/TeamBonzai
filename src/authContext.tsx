/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { api } from "./api";
import type { LoginResponse } from "./types";

type AuthCtx = {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));

  const login = async (emailIn: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", { email: emailIn, password });
    setToken(data.token);
    setEmail(data.email);
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
  };

  useEffect(() => {}, [token]);

  return <AuthContext.Provider value={{ token, email, login, logout }}>{children}</AuthContext.Provider>;
}
