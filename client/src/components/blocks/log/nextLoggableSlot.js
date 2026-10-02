/**
 * Visible-slot index of the next row that may create (or complete) a logged set.
 * Positional: the first draft or incomplete persisted slot wins; later drafts
 * stay local until they become this index.
 *
 * @param {Array<{ isDraft?: boolean, set?: object | null }> | null | undefined} slots
 * @returns {number} index, or -1 when nothing can log
 */
export function nextLoggableSlotIndex(slots) {
  if (!Array.isArray(slots)) return -1;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot) continue;
    if (slot.isDraft) return i;
    if (!persistedSetIsLogged(slot.set)) return i;
  }
  return -1;
}

/** Same dose rule as blockSetIsLogged - kept local to avoid a JSX import cycle. */
function persistedSetIsLogged(set) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (t(set.durationSec) !== "") return true;
  return t(set.reps) !== "";
}
