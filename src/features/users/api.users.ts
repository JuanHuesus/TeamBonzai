import { api } from "../../api";
import type { User } from "../../types";

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
