import { useSyncExternalStore } from "react";

/**
 * One switch for every motion branch in JS. CSS handles its own half via
 * `@media (prefers-reduced-motion: reduce)`; JS-driven effects (count-ups,
 * measured indicators, canvases) ask this hook before scheduling anything.
 * The pure `prefersReducedMotion()` is exported for non-React callers.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function mediaQuery() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(QUERY);
}

export function prefersReducedMotion() {
  const mq = mediaQuery();
  return mq ? mq.matches : false;
}

function subscribe(onChange) {
  const mq = mediaQuery();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getServerSnapshot() {
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, getServerSnapshot);
}
