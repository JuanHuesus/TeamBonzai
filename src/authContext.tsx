/* eslint-disable react-refresh/only-export-components */

// Täällä/tämä tarjoaa kirjautumistilan (token + userId + email + role) react contextilla
// + login/register/logout funktiot
// use Auth() käyttävät komponentit voi käyttää täältä tilaa ja toimintoja

// HUOM! Täällä ei ole profiilitietoja (firstname, surname, jne) hae ne profiilisivulla

import { createContext, useState } from "react"; 
import { api } from "./api"; 
import type { AuthResponse, UserProfile } from "./types"; 


// muut komponentit käyttää näitä
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

  // tyhjentää state + localStorage
  logout: () => void;
};

// varsinainen context
export const AuthContext = createContext<AuthCtx | null>(null);//null, että arvo tulee providerilta


// profiilin haku, login/register jälkeen
async function fetchUserProfile(id: string, token: string): Promise<UserProfile | null> {
  try {
    const { data } = await api.get<UserProfile>(`/users/${id}`, {

      headers: { Authorization: `Bearer ${token}` }, // varuiksi varmistetaan token headerissa jos login/register kutsusta poiketaan
    });
    return data;
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    return null;
  }
}


// authProvider pitää auth-tilaa ja jakaa sen lapsille Contextin kautta

export function AuthProvider({ children }: { children: React.ReactNode }) {

  // state alustetaan localStoragesta, hjotta refreshin jälkeen user pysyy kirjautuneena
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));


  // asettaa auth-tilan login/register jälkeen, eli tallettaa tokenin + hakee profiilin
  const applyAuth = async (auth: AuthResponse, emailFallback?: string): Promise<void> => {
    const jwt = auth.userToken;

    //token ja userId talteen heti
    localStorage.setItem("token", jwt);
    setToken(jwt);

    localStorage.setItem("userId", auth.id);
    setUserId(auth.id);

    const profile = await fetchUserProfile(auth.id, jwt);

    // lopullinen email+role: profiilista, tai fallback email loginin yhteydessä(eli käyttäjän kirjaama)
    const finalEmail = profile?.email ?? emailFallback ?? null;
    const finalRole = profile?.user_role ?? null;

   
    setEmail(finalEmail);
    setRole(finalRole);

    //localStorage synkassa, poistetaan jos null
    if (finalEmail) localStorage.setItem("email", finalEmail);
    else localStorage.removeItem("email");

    if (finalRole) localStorage.setItem("role", finalRole);
    else localStorage.removeItem("role");
  };


   //login kutsuu backendin login-endpointtia ja asettaa auth tilan(jos onnistuu)
   

  const login = async (emailIn: string, hashed_password: string) => {
    const { data } = await api.post<AuthResponse>("/users/login", {
      email: emailIn,
      hashed_password,
    });

    await applyAuth(data, emailIn);
  };

 
  //register kutsuu backendin signup-endpointtia.
  //käyttäjä on sisällä jos responsessa on token
  
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

  
  //tyhjää auth + localstorage

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



  // provider välittää kaikille muksuille auth-tilan + funktiot
  return (
    <AuthContext.Provider value={{ token, email, role, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
