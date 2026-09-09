const STORAGE_KEY = "workoutdb-coach-key";

/**
 * Bring-your-own Anthropic key for the in-app coach. Kept in sessionStorage
 * only: it lives in this browser tab, is sent per request, and is never
 * stored on the server. Closing the tab forgets it. All reads go through
 * this accessor so a server-side encrypted store later is one swap.
 */
export function loadCoachKey() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function saveCoachKey(key) {
  try {
    const trimmed = typeof key === "string" ? key.trim() : "";
    if (!trimmed) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    /* private mode / quota */
  }
}

export function clearCoachKey() {
  saveCoachKey("");
}

export function looksLikeAnthropicKey(key) {
  return typeof key === "string" && /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}
