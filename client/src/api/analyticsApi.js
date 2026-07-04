import { http } from "./http.js";

export function getSummary({ from, to }) {
  return http(
    `/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}
