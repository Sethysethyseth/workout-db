import { http } from "./http.js";

export function resolveExerciseNames(names) {
  return http("/exercises/resolve", { method: "POST", body: { names } });
}
