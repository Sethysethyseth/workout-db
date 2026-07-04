const STORAGE_KEY = "workoutdb-weight-unit";

/**
 * Display-only weight-unit preference: declares what unit the user logs in.
 * Stored weights are unit-agnostic numbers and are NEVER converted.
 * Device-local for now; all reads go through this accessor so account-level
 * promotion later is one swap (same pattern as the theme-storage decision).
 */
export function loadWeightUnit() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "kg" || raw === "lbs" ? raw : "lbs";
  } catch {
    return "lbs";
  }
}

/** @param {"lbs" | "kg"} unit */
export function saveWeightUnit(unit) {
  if (unit !== "lbs" && unit !== "kg") return;
  try {
    localStorage.setItem(STORAGE_KEY, unit);
  } catch {
    /* quota / private mode */
  }
}
