import { http } from "./http.js";

export function register({ email, password, username }) {
  return http("/auth/register", {
    method: "POST",
    body: { email, password, username },
  });
}

export function login({ login, password }) {
  return http("/auth/login", { method: "POST", body: { login, password } });
}

export function setUsername({ username }) {
  return http("/auth/username", { method: "POST", body: { username } });
}

export async function logout() {
  await http("/auth/logout", { method: "POST", credentials: "include" });
}

export function me() {
  return http("/auth/me");
}

export function changePassword({ currentPassword, newPassword }) {
  return http("/auth/password", {
    method: "PATCH",
    body: { currentPassword, newPassword },
  });
}
