import { http } from "./http.js";

export function startSession(templateId) {
  return http(`/sessions/start/${templateId}`, { method: "POST", body: {} });
}

export function getMySessions() {
  return http("/sessions/mine");
}

export function getSessionById(id) {
  return http(`/sessions/${id}`);
}

export function updateSession(id, { notes, performedAt }) {
  const body = {};
  if (notes !== undefined) body.notes = notes;
  if (performedAt !== undefined) body.performedAt = performedAt;
  return http(`/sessions/${id}`, { method: "PATCH", body });
}

export function deleteSession(id) {
  return http(`/sessions/${id}`, { method: "DELETE" });
}

export function completeSession(id) {
  return http(`/sessions/${id}/complete`, { method: "POST" });
}

export function createSet(sessionId, payload) {
  return http(`/sessions/${sessionId}/sets`, { method: "POST", body: payload });
}

export function updateSet(setId, payload) {
  return http(`/sessions/sets/${setId}`, { method: "PATCH", body: payload });
}

export function deleteSet(setId) {
  return http(`/sessions/sets/${setId}`, { method: "DELETE" });
}

