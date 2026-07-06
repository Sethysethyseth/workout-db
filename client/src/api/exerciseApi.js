import { http } from "./http.js";

export function resolveExerciseNames(names) {
  return http("/exercises/resolve", { method: "POST", body: { names } });
}

export function getMuscles() {
  return http("/exercises/muscles");
}

export function createCustomExercise({ name, muscles }) {
  return http("/exercises/custom", { method: "POST", body: { name, muscles } });
}
