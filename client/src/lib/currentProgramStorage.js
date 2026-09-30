const KEY = "workoutdb.currentProgram.v1";

/**
 * Workout-only "current program" for Home quick-picks.
 * Block entries are obsolete (BK8 runs via BlockRun) - reading one clears it.
 * @typedef {{ kind: "workout", id: number, name: string }} CurrentProgramRef
 */

/** @returns {CurrentProgramRef | null} */
export function readCurrentProgram() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o) return null;
    if (o.kind === "block") {
      localStorage.removeItem(KEY);
      return null;
    }
    if (o.kind !== "workout") return null;
    const id = Number(o.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    const name = typeof o.name === "string" ? o.name : "";
    return { kind: "workout", id, name };
  } catch {
    return null;
  }
}

/** @param {CurrentProgramRef | null} entry */
export function writeCurrentProgram(entry) {
  try {
    if (!entry) {
      localStorage.removeItem(KEY);
      return;
    }
    // Block write path removed (BK8) - ignore, do not persist.
    if (entry.kind === "block") {
      return;
    }
    if (entry.kind !== "workout") return;
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}
