const STORAGE_KEY = "workoutdb_quick_log_display_prefs_v1";

/**
 * Persisted UI preferences for one-time (quick) log sessions — device-local only.
 * @returns {{ useRIR?: boolean, useRPE?: boolean, useExerciseNotes?: boolean, useSetNotes?: boolean, useSessionNotes?: boolean }}
 * `useSetNotes` is the set-notes visibility flag (default false when absent).
 * `useSessionNotes` is legacy in storage; Quick Workout no longer reads or surfaces it.
 */
export function loadQuickWorkoutLogPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, boolean>} partial */
export function saveQuickWorkoutLogPrefs(partial) {
  try {
    const prev = loadQuickWorkoutLogPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...partial }));
  } catch {
    /* quota / private mode */
  }
}
