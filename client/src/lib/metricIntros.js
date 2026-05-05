/** localStorage: first-time metric intro cards (live session). */
export const SEEN_RPE_INTRO_KEY = "workoutdb.seenRpeIntro";
export const SEEN_RIR_INTRO_KEY = "workoutdb.seenRirIntro";

/** Same copy for intro cards and (?) explainers — single source of truth. */
export const METRIC_INTRO_COPY = {
  rpe:
    "RPE = Rate of Perceived Exertion. A 1–10 scale of how hard a set felt. 10 = couldn't do another rep, 7 = had 3 in the tank.",
  rir:
    "RIR = Reps in Reserve. How many more reps you could've done. 0 = total failure, 3 = three more in the tank.",
};

export function readSeenRpeIntro() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SEEN_RPE_INTRO_KEY) === "1";
}

export function readSeenRirIntro() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SEEN_RIR_INTRO_KEY) === "1";
}

export function markSeenRpeIntro() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_RPE_INTRO_KEY, "1");
}

export function markSeenRirIntro() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_RIR_INTRO_KEY, "1");
}
