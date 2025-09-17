import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const http = axios.create({
  baseURL: API_BASE, // => /mock
  headers: { "Content-Type": "application/json" },
});

export type LoginResponse = { token: string; email: string };

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await http.post("/auth/login", { email, password }); // -> /mock/auth/login
  return res.data;
}
