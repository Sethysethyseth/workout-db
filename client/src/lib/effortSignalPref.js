const STORAGE_KEY = "workoutdb-effort-signal";

/**
 * Device-local effort-signal preference: which of RIR / RPE new templates
 * and quick logs default to. Plain string, same shape as weightUnitPref.
 * Default is "rir". Never stores null - null is a legacy UI-only state.
 */
export function loadEffortSignal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "rir" || raw === "rpe" ? raw : "rir";
  } catch {
    return "rir";
  }
}

/** @param {"rir" | "rpe"} signal */
export function saveEffortSignal(signal) {
  if (signal !== "rir" && signal !== "rpe") return;
  try {
    localStorage.setItem(STORAGE_KEY, signal);
  } catch {
    /* quota / private mode */
  }
}
