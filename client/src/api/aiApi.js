import { http } from "./http.js";

export function getAiConsent() {
  return http("/ai/consent");
}

export function grantAiConsent() {
  return http("/ai/consent", { method: "POST" });
}

export function revokeAiConsent() {
  return http("/ai/consent", { method: "DELETE" });
}
