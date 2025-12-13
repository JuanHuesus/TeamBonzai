/* eslint-disable react-refresh/only-export-components */
// AuthContext / AuthProvider:
// Tämä tiedosto tarjoaa koko sovellukselle kirjautumistilan (token + userId + email + role)
// React Contextin kautta. Lisäksi se tarjoaa login/register/logout -funktiot.
//
// Käyttö projektissa:
// - App rootissa kääritään sovellus <AuthProvider>...</AuthProvider>
// - useAuth-hook (erillisessä tiedostossa) lukee AuthContextia ja tarjoaa arvot komponenteille.

import { createContext, useEffect, useState } from "react"; // Context + state + effect
import { api } from "./api"; // yhteinen axios-instanssi (baseURL + token-interceptor)
import type { AuthResponse, UserProfile } from "./types"; // backendin vastaustyypit

// Contextin “rajapinta”: mitä muut komponentit saavat käyttöönsä.
type AuthCtx = {
  token: string | null; // Bearer token (JWT tms)
  email: string | null; // käyttäjän email (näytetään UI:ssa)
  role: string | null; // rooli (default/admin/moderator tms)
  userId: string | null; // käyttäjän UUID (omistajuus-vertailuihin ym)

  // login ottaa email+password ja kirjautuu sisään
  login: (email: string, hashed_password: string) => Promise<void>;

  // register tekee signupin ja myös kirjauttaa sisään (token tulee responseen)
  register: (payload: {
    firstname: string;
    surname: string;
    email: string;
    hashed_password: string;
    phone_number?: string;
    description?: string;
    profile_image?: string;
  }) => Promise<void>;

  // logout tyhjentää state + localStorage
  logout: () => void;
};

// Luodaan itse Context. Alkuarvo null -> pakottaa käyttämään Provideria.
export const AuthContext = createContext<AuthCtx | null>(null);

/**
 * Hakee user-profiilin backendistä userId:llä.
 * Tätä käytetään, jotta saadaan “oikea” email ja rooli (ei luoteta pelkkään login-responseen).
 */
async function fetchUserProfile(id: string, token: string): Promise<UserProfile | null> {
  try {
    const { data } = await api.get<UserProfile>(`/users/${id}`, {
      // varmistetaan Authorization varmasti tähän pyyntöön
      // (api-instanssilla on myös interceptor, mutta tämä tekee asian eksplisiittiseksi)
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    // jos profiilin haku epäonnistuu, auth voi silti olla “osittain” päällä (token + userId)
    console.error("Failed to fetch user profile", err);
    return null;
  }
}

/**
 * AuthProvider: komponentti joka pitää auth-tilaa ja jakaa sen lapsille Contextin kautta.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Alustetaan state localStoragesta -> refreshin jälkeen käyttäjä pysyy kirjautuneena
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));

  /**
   * applyAuth: yhteinen “kirjaudu sisään” -polku loginin ja registerin jälkeen.
   * - tallentaa token+userId heti (jotta API-kutsut onnistuvat)
   * - hakee profiilin, jotta saadaan rooli ja “varma” email
   * - päivittää localStorage + state
   */
  const applyAuth = async (auth: AuthResponse, emailFallback?: string): Promise<void> => {
    const jwt = auth.userToken;

    // 1) token ja userId talteen heti
    localStorage.setItem("token", jwt);
    setToken(jwt);

    localStorage.setItem("userId", auth.id);
    setUserId(auth.id);

    // 2) haetaan profiili (rooli, email jne.) käyttäjätiedosta
    const profile = await fetchUserProfile(auth.id, jwt);

    // 3) päätetään lopulliset arvot:
    // - email profiilista, tai fallbackina se mitä käyttäjä kirjoitti
    // - role profiilista
    const finalEmail = profile?.email ?? emailFallback ?? null;
    const finalRole = profile?.user_role ?? null;

    // 4) päivitetään state
    setEmail(finalEmail);
    setRole(finalRole);

    // 5) pidetään localStorage synkassa (poistetaan jos null)
    if (finalEmail) localStorage.setItem("email", finalEmail);
    else localStorage.removeItem("email");

    if (finalRole) localStorage.setItem("role", finalRole);
    else localStorage.removeItem("role");
  };

  /**
   * login: kutsuu backendin login-endpointtia.
   * Backend palauttaa AuthResponse (token + userId), jonka jälkeen applyAuth hoitaa loput.
   */
  const login = async (emailIn: string, hashed_password: string) => {
    const { data } = await api.post<AuthResponse>("/users/login", {
      email: emailIn,
      hashed_password,
    });

    await applyAuth(data, emailIn);
  };

  /**
   * register: kutsuu backendin signup-endpointtia.
   * Tämän jälkeen käyttäjä on “sisällä”, koska response sisältää tokenin.
   */
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

  /**
   * logout: tyhjentää kaiken auth-tilan ja localStoragen.
   * Tämä käytännössä “kirjaa ulos” frontissa.
   */
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

  // Tämä effect ei tee mitään, mutta kertoo idean:
  // “state ja localStorage pidetään synkassa”.
  // (Käytännössä synkka tehdään applyAuth/logoutissa.)
  useEffect(() => {
    // tila pysyy localStoragen kanssa synkassa
  }, [token, role, userId]);

  // Provider välittää arvot kaikille lapsikomponenteille
  return (
    <AuthContext.Provider value={{ token, email, role, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
