import { makeId } from "../../../lib/makeId.js";

/**
 * Map a LogChamp Block Format exercise onto ExerciseCard's local shape.
 * @param {object} ex format exercise ({ name, sets, … })
 */
export function formatExerciseForCard(ex) {
  const sets = Array.isArray(ex?.sets)
    ? ex.sets.map((s) => ({
        id: makeId(),
        reps: s?.reps ?? null,
        repsMax: s?.repsMax ?? null,
        durationSec: s?.durationSec ?? null,
        weight: s?.weight ?? null,
        rpe: s?.rpe ?? null,
        rir: s?.rir ?? null,
        notes: s?.notes ?? null,
      }))
    : [];
  return {
    id: makeId(),
    exerciseName: ex?.name != null ? String(ex.name) : "",
    notes: ex?.notes != null ? String(ex.notes) : "",
    restSec: ex?.restSec != null ? Number(ex.restSec) : null,
    effortCap: Boolean(ex?.effortCap),
    notInLibrary: false,
    sets,
  };
}
