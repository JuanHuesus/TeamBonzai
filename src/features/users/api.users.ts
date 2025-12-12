// src/features/users/api.users.ts
import { api } from "../../api";
import type { User, UserProfile } from "../../types";

export type RegisterPayload = {
  firstname: string;
  surname: string;
  email: string;
  hashed_password: string;
  phone_number?: string;
  description?: string;
};

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/users/signup", payload);
  return data;
}

/** Hae käyttäjän profiili (nimen näyttämiseen, esim. arviointiosioon) */
export async function getUserProfileById(id: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${id}`);
  return data;
}
