import {
  exerciseRxSummary,
  slotBadge,
} from "../builder/blockBuilderState.js";

export { exerciseRxSummary, slotBadge };

/**
 * Map a Prisma block exercise (blockWorkoutSets) into the builder exercise
 * shape exerciseRxSummary expects - without inventing client ids for sets.
 */
export function mapApiExerciseForRun(ex) {
  const rawSets = Array.isArray(ex?.blockWorkoutSets)
    ? [...ex.blockWorkoutSets]
    : Array.isArray(ex?.sets)
      ? [...ex.sets]
      : [];
  rawSets.sort((a, b) => (a.order || 0) - (b.order || 0));

  const sets =
    rawSets.length > 0
      ? rawSets.map((s) => ({
          id: s.id,
          reps: s.reps != null ? s.reps : null,
          repsMax: s.repsMax != null ? s.repsMax : null,
          durationSec: s.durationSec != null ? s.durationSec : null,
          weight: s.weight != null ? s.weight : null,
          rpe: s.rpe != null ? s.rpe : null,
          rir: s.rir != null ? s.rir : null,
        }))
      : fallbackSetsFromTargets(ex);

  return {
    id: ex?.id,
    exerciseName: ex?.exerciseName || ex?.name || "",
    notes: ex?.notes != null ? String(ex.notes) : "",
    restSec: ex?.restSec != null ? Number(ex.restSec) : null,
    effortCap: Boolean(ex?.effortCap),
    sets,
  };
}

function fallbackSetsFromTargets(ex) {
  const count =
    ex?.targetSets != null && Number(ex.targetSets) > 0 ? Number(ex.targetSets) : 0;
  if (!count) return [];
  const reps =
    ex?.targetReps != null && Number.isFinite(Number(ex.targetReps))
      ? Number(ex.targetReps)
      : null;
  return Array.from({ length: count }, () => ({
    reps,
    repsMax: null,
    durationSec: null,
    weight: null,
    rpe: null,
    rir: null,
  }));
}

/** Count exercises + planned sets on a workout node. */
export function countWorkoutVolume(workout) {
  const exercises = Array.isArray(workout?.exercises) ? workout.exercises : [];
  let sets = 0;
  for (const ex of exercises) {
    const mapped = mapApiExerciseForRun(ex);
    sets += mapped.sets?.length || 0;
  }
  return { exercises: exercises.length, sets };
}

export function resolveBlockEffort(block) {
  if (block?.useRPE) return "rpe";
  if (block?.useRIR) return "rir";
  return "none";
}
