const STORAGE_KEY = "workoutdb-coach-key";

/**
 * Shape check for an Anthropic key before it is sent to the server.
 * The server repeats the same check and is the authority.
 */
export function looksLikeAnthropicKey(key) {
  return typeof key === "string" && /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/** Drop the pre-vault sessionStorage key. Safe to call more than once. */
export function purgeLegacyCoachKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
