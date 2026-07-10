const STORAGE_KEY = "workoutdb-analytics-weeks";

const VALID_WEEKS = new Set([2, 4, 8, 12]);

/**
 * Device-local analytics range lens (weeks). URL is not the channel - range
 * is a filter, not an address. All reads go through this accessor so
 * account-level promotion later is one swap (same pattern as weightUnitPref).
 */
export function loadAnalyticsWeeks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = Number(raw);
    return VALID_WEEKS.has(n) ? n : 4;
  } catch {
    return 4;
  }
}

/** @param {2 | 4 | 8 | 12} weeks */
export function saveAnalyticsWeeks(weeks) {
  if (!VALID_WEEKS.has(weeks)) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(weeks));
  } catch {
    /* quota / private mode */
  }
}
