const PREFIX = "workoutdb-block-builder-draft:";

function storageKey(blockKey) {
  return `${PREFIX}${blockKey == null ? "new" : String(blockKey)}`;
}

/** @returns {object | null} */
export function readBuilderDraft(blockKey) {
  try {
    const raw = localStorage.getItem(storageKey(blockKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.state || typeof parsed.state !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBuilderDraft(blockKey, state) {
  try {
    localStorage.setItem(
      storageKey(blockKey),
      JSON.stringify({
        savedAt: Date.now(),
        state,
      })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearBuilderDraft(blockKey) {
  try {
    localStorage.removeItem(storageKey(blockKey));
  } catch {
    /* ignore */
  }
}
