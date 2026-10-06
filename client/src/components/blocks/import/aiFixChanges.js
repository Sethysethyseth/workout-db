/**
 * Pure helper: describe what the AI import fix changed between two previews.
 * Used under the "AI read: ..." line after a successful fix (bkrf1c / P2-8).
 */

/**
 * @param {object | null | undefined} preview
 * @returns {{ name: string, key: string, sets: object[], notes: string }[]}
 */
function flattenExercises(preview) {
  const weeks = Array.isArray(preview?.block?.weeks) ? preview.block.weeks : [];
  const out = [];
  for (let wi = 0; wi < weeks.length; wi++) {
    const days = Array.isArray(weeks[wi]?.days) ? weeks[wi].days : [];
    for (let di = 0; di < days.length; di++) {
      const exercises = Array.isArray(days[di]?.exercises) ? days[di].exercises : [];
      for (let ei = 0; ei < exercises.length; ei++) {
        const ex = exercises[ei] || {};
        const name = ex.name != null ? String(ex.name).trim() : "";
        if (!name) continue;
        out.push({
          name,
          key: `${wi}:${di}:${ei}:${name.toLowerCase()}`,
          sets: Array.isArray(ex.sets) ? ex.sets : [],
          notes: ex.notes != null ? String(ex.notes).trim() : "",
        });
      }
    }
  }
  return out;
}

/**
 * @param {object[]} sets
 * @returns {string}
 */
function formatDose(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return "none";

  const timed = sets.every(
    (s) => s && s.durationSec != null && s.durationSec !== ""
  );
  if (timed) {
    const first = Number(sets[0].durationSec);
    const same = sets.every((s) => Number(s.durationSec) === first);
    if (same && Number.isFinite(first)) {
      return `${sets.length} x ${first} s`;
    }
    return `${sets.length} timed sets`;
  }

  const repsList = sets.map((s) => {
    const reps = s?.reps;
    const repsMax = s?.repsMax;
    if (reps == null) return null;
    if (repsMax != null && repsMax !== reps) return `${reps}-${repsMax}`;
    return String(reps);
  });
  if (repsList.every((r) => r != null) && repsList.every((r) => r === repsList[0])) {
    return `${sets.length} x ${repsList[0]}`;
  }
  if (repsList.some((r) => r != null)) {
    return `${sets.length} sets`;
  }
  return `${sets.length} sets`;
}

/**
 * @param {{ name: string, sets: object[], notes: string }} before
 * @param {{ name: string, sets: object[], notes: string }} after
 * @returns {string | null}
 */
function lineForChange(before, after) {
  const beforeDose = formatDose(before.sets);
  const afterDose = formatDose(after.sets);
  const beforeWasNote = beforeDose === "none" && Boolean(before.notes);

  if (beforeDose === afterDose && before.notes === after.notes) return null;

  if (beforeWasNote && afterDose !== "none") {
    return `${after.name} - ${afterDose} (was a note)`;
  }
  if (beforeDose !== afterDose) {
    return `${after.name} - sets: ${beforeDose} -> ${afterDose}`;
  }
  if (before.notes !== after.notes) {
    if (!before.notes && after.notes) {
      return `${after.name} - note added`;
    }
    if (before.notes && !after.notes) {
      return `${after.name} - note removed`;
    }
    return `${after.name} - note changed`;
  }
  return null;
}

/**
 * Compare original vs AI-fixed import previews.
 * @param {object | null | undefined} originalPreview
 * @param {object | null | undefined} aiPreview
 * @returns {string[]} up to 8 change lines, then "+N more" if needed
 */
export function aiFixChanges(originalPreview, aiPreview) {
  const beforeList = flattenExercises(originalPreview);
  const afterList = flattenExercises(aiPreview);
  if (afterList.length === 0 && beforeList.length === 0) return [];

  const beforeByKey = new Map(beforeList.map((ex) => [ex.key, ex]));
  const beforeByName = new Map();
  for (const ex of beforeList) {
    const k = ex.name.toLowerCase();
    if (!beforeByName.has(k)) beforeByName.set(k, []);
    beforeByName.get(k).push(ex);
  }

  const usedBefore = new Set();
  const lines = [];

  for (const after of afterList) {
    let before = beforeByKey.get(after.key);
    if (before && !usedBefore.has(before.key)) {
      usedBefore.add(before.key);
    } else {
      before = null;
      const pool = beforeByName.get(after.name.toLowerCase()) || [];
      const next = pool.find((b) => !usedBefore.has(b.key));
      if (next) {
        before = next;
        usedBefore.add(next.key);
      }
    }

    if (!before) {
      const dose = formatDose(after.sets);
      if (dose !== "none") {
        lines.push(`${after.name} - sets: none -> ${dose}`);
      } else if (after.notes) {
        lines.push(`${after.name} - note added`);
      } else {
        lines.push(`${after.name} - added`);
      }
      continue;
    }

    const line = lineForChange(before, after);
    if (line) lines.push(line);
  }

  for (const before of beforeList) {
    if (usedBefore.has(before.key)) continue;
    lines.push(`${before.name} - removed`);
  }

  if (lines.length <= 8) return lines;
  const extra = lines.length - 8;
  return [...lines.slice(0, 8), `+${extra} more`];
}
