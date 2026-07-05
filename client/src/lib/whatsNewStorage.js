const STORAGE_KEY = "workoutdb-whats-new-seen";

/**
 * Device-local "last release the user has seen" marker for the What's New
 * modal. Stores a release id from client/src/data/whatsNew.js. Device-local
 * like the theme decision; all reads go through this accessor so
 * account-level promotion later is one swap (same pattern as
 * weightUnitPref.js).
 */
export function loadLastSeenRelease() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? String(raw) : null;
  } catch {
    return null;
  }
}

/** @param {string} releaseId */
export function saveLastSeenRelease(releaseId) {
  if (!releaseId) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(releaseId));
  } catch {
    /* quota / private mode */
  }
}
