/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { api } from "./api";
import type { AuthResponse, UserProfile } from "./types";

type AuthCtx = {
  token: string | null;
  email: string | null;
  role: string | null;
  userId: string | null;

  login: (email: string, hashed_password: string) => Promise<void>;
  register: (payload: {
    firstname: string;
    surname: string;
    email: string;
    hashed_password: string;
    phone_number?: string;
    description?: string;
    profile_image?: string;
  }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx | null>(null);

async function fetchUserProfile(id: string, token: string): Promise<UserProfile | null> {
  try {
    const { data } = await api.get<UserProfile>(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));

  const applyAuth = async (auth: AuthResponse, emailFallback?: string): Promise<void> => {
    const jwt = auth.userToken;

    // tallenna token ja userId heti
    localStorage.setItem("token", jwt);
    setToken(jwt);

    localStorage.setItem("userId", auth.id);
    setUserId(auth.id);

    const profile = await fetchUserProfile(auth.id, jwt);

    const finalEmail = profile?.email ?? emailFallback ?? null;
    const finalRole = profile?.user_role ?? null;

    setEmail(finalEmail);
    setRole(finalRole);

    if (finalEmail) localStorage.setItem("email", finalEmail);
    else localStorage.removeItem("email");

    if (finalRole) localStorage.setItem("role", finalRole);
    else localStorage.removeItem("role");
  };

  const login = async (emailIn: string, hashed_password: string) => {
    const { data } = await api.post<AuthResponse>("/users/login", {
      email: emailIn,
      hashed_password,
    });
    await applyAuth(data, emailIn);
  };

  const register: AuthCtx["register"] = async ({
    firstname,
    surname,
    email: emailIn,
    hashed_password,
    phone_number,
    description,
    profile_image,
  }) => {
    const { data } = await api.post<AuthResponse>("/users/signup", {
      firstname,
      surname,
      email: emailIn,
      phone_number,
      description,
      hashed_password,
      profile_image,
    });

    await applyAuth(data, emailIn);
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    setRole(null);
    setUserId(null);

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
  };

  useEffect(() => {
    // tila pysyy localStoragen kanssa synkassa
  }, [token, role, userId]);

  return (
    <AuthContext.Provider value={{ token, email, role, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

