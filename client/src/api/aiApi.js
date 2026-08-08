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

export function authorizeConnector(externalAuthId) {
  return http("/ai/connector/authorize", {
    method: "POST",
    body: { external_auth_id: externalAuthId },
  });
}
