import { http } from "./http.js";

/**
 * Fired after a mutation that changes which session (if any) is active, so
 * ActiveSessionContext can update immediately instead of waiting for its
 * next poll. detail: { type: "completed" | "deleted", sessionId }.
 */
export const SESSIONS_CHANGED_EVENT = "sessions:changed";

function notifySessionsChanged(detail) {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT, { detail }));
  } catch {
    // never let a notification failure break the mutation itself
  }
}

export function createAdHocSession() {
  return http("/sessions", { method: "POST", body: {} });
}

export function startSession(templateId) {
  return http(`/sessions/start/${templateId}`, { method: "POST", body: {} });
}

export function addSessionExercise(sessionId, payload) {
  return http(`/sessions/${sessionId}/exercises`, { method: "POST", body: payload });
}

export function updateSessionExercise(sessionId, exerciseId, payload) {
  return http(`/sessions/${sessionId}/exercises/${exerciseId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function getMySessions() {
  return http("/sessions/mine");
}

export function getSessionById(id) {
  return http(`/sessions/${id}`);
}

export function updateSession(id, { notes, performedAt, name }) {
  const body = {};
  if (notes !== undefined) body.notes = notes;
  if (performedAt !== undefined) body.performedAt = performedAt;
  if (name !== undefined) body.name = name;
  return http(`/sessions/${id}`, { method: "PATCH", body });
}

export async function deleteSession(id) {
  const data = await http(`/sessions/${id}`, { method: "DELETE" });
  notifySessionsChanged({ type: "deleted", sessionId: id });
  return data;
}

export async function completeSession(id, body = undefined) {
  const data = await http(`/sessions/${id}/complete`, {
    method: "POST",
    ...(body !== undefined ? { body } : {}),
  });
  notifySessionsChanged({ type: "completed", sessionId: id });
  return data;
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

export function deleteSessionExercise(sessionExerciseId) {
  return http(`/sessions/exercises/${sessionExerciseId}`, { method: "DELETE" });
}

