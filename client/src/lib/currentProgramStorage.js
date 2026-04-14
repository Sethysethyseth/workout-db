const KEY = "workoutdb.currentProgram.v1";

/**
 * @typedef {{ kind: "workout" | "block", id: number, name: string }} CurrentProgramRef
 */

/** @returns {CurrentProgramRef | null} */
export function readCurrentProgram() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || (o.kind !== "workout" && o.kind !== "block")) return null;
    const id = Number(o.id);
    if (!Number.isInteger(id) || id <= 0) return null;
    const name = typeof o.name === "string" ? o.name : "";
    return { kind: o.kind, id, name };
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
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}
