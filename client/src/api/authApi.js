import { http } from "./http.js";

export function register({ email, password }) {
  return http("/auth/register", { method: "POST", body: { email, password } });
}

export function login({ email, password }) {
  return http("/auth/login", { method: "POST", body: { email, password } });
}

export async function logout() {
  await http("/auth/logout", { method: "POST" });
}

export function me() {
  return http("/auth/me");
}

