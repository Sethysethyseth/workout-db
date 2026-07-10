import { http } from "./http.js";

export function getSummary({ from, to }) {
  return http(
    `/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export function getExerciseIndex() {
  return http("/analytics/exercises");
}

export function getExerciseDetail({ exerciseId, userExerciseId, from, to }) {
  const params = new URLSearchParams();
  if (exerciseId) params.set("exerciseId", exerciseId);
  else if (userExerciseId != null) params.set("userExerciseId", String(userExerciseId));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return http(`/analytics/exercise?${params.toString()}`);
}
