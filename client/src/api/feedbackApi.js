import { http } from "./http.js";

export function createFeedback(body) {
  return http("/feedback", { method: "POST", body });
}

export function listFeedback() {
  return http("/feedback", { method: "GET" });
}
