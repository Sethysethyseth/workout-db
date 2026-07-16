import { http } from "./http.js";

export function searchExercises(q, { limit = 10 } = {}) {
  const params = new URLSearchParams({ q: String(q ?? "") });
  if (limit != null) {
    params.set("limit", String(limit));
  }
  return http(`/exercises/search?${params.toString()}`);
}

export function resolveExerciseNames(names) {
  return http("/exercises/resolve", { method: "POST", body: { names } });
}

export function getMuscles() {
  return http("/exercises/muscles");
}

export function createCustomExercise({ name, muscles }) {
  return http("/exercises/custom", { method: "POST", body: { name, muscles } });
}

export function listCustomExercises() {
  return http("/exercises/custom");
}

export function deleteCustomExercise(id) {
  return http(`/exercises/custom/${id}`, { method: "DELETE" });
}
