/**
 * Pure helpers for starting a day from a block and deriving run progress.
 * Spec: docs/specs/blocks-v2.md section 7.
 */

function resolveEffort(tree) {
  if (tree && tree.useRPE) return "rpe";
  if (tree && tree.useRIR) return "rir";
  return null;
}

function sortedByOrder(items) {
  return [...(items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

function planSetsFromExercise(exercise) {
  const raw =
    exercise.blockWorkoutSets ||
    exercise.sets ||
    [];
  return sortedByOrder(raw).map((s) => ({
    reps: s.reps != null ? s.reps : null,
    repsMax: s.repsMax != null ? s.repsMax : null,
    durationSec: s.durationSec != null ? s.durationSec : null,
    weight: s.weight != null ? s.weight : null,
    rpe: s.rpe != null ? s.rpe : null,
    rir: s.rir != null ? s.rir : null,
  }));
}

/**
 * @param {object} tree - block template with weeks -> workouts -> exercises -> sets
 * @param {number} weekOrder
 * @param {number} workoutOrder
 * @param {{ blockName: string }} opts
 * @returns {{ name: string, exercises: object[] } | null}
 */
function buildSessionFromBlockWorkout(tree, weekOrder, workoutOrder, { blockName } = {}) {
  if (!tree || blockName == null) return null;

  const week = (tree.weeks || []).find((w) => w.order === weekOrder);
  if (!week) return null;

  const workout = (week.workouts || []).find((w) => w.order === workoutOrder);
  if (!workout) return null;

  const effort = resolveEffort(tree);
  const name = `${blockName} · W${weekOrder} · ${workout.name}`;

  const exercises = sortedByOrder(workout.exercises).map((ex) => ({
    order: ex.order,
    exerciseName: ex.exerciseName,
    exerciseId: ex.exerciseId != null ? ex.exerciseId : null,
    userExerciseId: ex.userExerciseId != null ? ex.userExerciseId : null,
    targetSets: ex.targetSets != null ? ex.targetSets : null,
    targetReps: ex.targetReps != null ? ex.targetReps : null,
    notes: ex.notes != null ? ex.notes : null,
    plan: {
      v: 1,
      effort,
      effortCap: Boolean(ex.effortCap),
      perSide:
        ex.perSide === true || ex.perSide === false ? ex.perSide : null,
      restSec: ex.restSec != null ? ex.restSec : null,
      // Author notes snapshot - cue/coach read from here so the lifter's
      // sessionExercise.notes field stays lifter-owned after start.
      notes: ex.notes != null ? ex.notes : null,
      sets: planSetsFromExercise(ex),
    },
  }));

  return { name, exercises };
}

/**
 * @param {object} tree
 * @param {Array<{ blockWeekOrder: number, blockWorkoutOrder: number, completedAt: Date|string|null, id: number }>} sessions
 */
function computeRunProgress(tree, sessions) {
  const sessionList = sessions || [];
  const weeksIn = sortedByOrder(tree && tree.weeks);

  const weeks = weeksIn.map((week) => {
    const workouts = sortedByOrder(week.workouts);
    const days = workouts.map((workout) => {
      const matching = sessionList.filter(
        (s) =>
          s.blockWeekOrder === week.order &&
          s.blockWorkoutOrder === workout.order
      );
      const completed = matching.find((s) => s.completedAt != null);
      const open = matching.find((s) => s.completedAt == null);

      let status = "todo";
      let sessionId = null;
      if (completed) {
        status = "done";
        sessionId = completed.id;
      } else if (open) {
        status = "in_progress";
        sessionId = open.id;
      }

      return {
        order: workout.order,
        name: workout.name,
        status,
        sessionId,
      };
    });

    return {
      order: week.order,
      label: week.label != null ? week.label : null,
      done: days.filter((d) => d.status === "done").length,
      total: days.length,
      days,
    };
  });

  const unfinishedWeek = weeks.find((w) =>
    w.days.some((d) => d.status !== "done")
  );
  let currentWeekOrder = null;
  if (unfinishedWeek) {
    currentWeekOrder = unfinishedWeek.order;
  } else if (weeks.length > 0) {
    currentWeekOrder = weeks[weeks.length - 1].order;
  }

  const allDone =
    weeks.length > 0 && weeks.every((w) => w.days.every((d) => d.status === "done"));

  let nextDay = null;
  if (!allDone && currentWeekOrder != null) {
    const currentWeek = weeks.find((w) => w.order === currentWeekOrder);
    const next = currentWeek && currentWeek.days.find((d) => d.status !== "done");
    if (next) {
      nextDay = { weekOrder: currentWeekOrder, workoutOrder: next.order };
    }
  }

  return { weeks, currentWeekOrder, nextDay };
}

/**
 * Summarize where a run left off for pause/resume UX.
 * Built on computeRunProgress (same inputs). Returns null when finished
 * or when no day is done/in_progress (nothing to resume).
 *
 * @param {object} tree
 * @param {Array<{ blockWeekOrder: number, blockWorkoutOrder: number, completedAt: Date|string|null, id: number }>} sessions
 * @returns {{ nextDay: { weekOrder: number, workoutOrder: number }, dayName: string, doneDays: number, totalDays: number } | null}
 */
function summarizeLeftOff(tree, sessions) {
  const progress = computeRunProgress(tree, sessions);
  if (progress.nextDay == null) return null;

  let doneDays = 0;
  let totalDays = 0;
  let hasProgress = false;
  for (const week of progress.weeks || []) {
    for (const day of week.days || []) {
      totalDays += 1;
      if (day.status === "done") {
        doneDays += 1;
        hasProgress = true;
      } else if (day.status === "in_progress") {
        hasProgress = true;
      }
    }
  }

  if (!hasProgress) return null;

  const week = (progress.weeks || []).find(
    (w) => w.order === progress.nextDay.weekOrder
  );
  const day =
    week &&
    (week.days || []).find((d) => d.order === progress.nextDay.workoutOrder);
  const dayName =
    day && day.name != null && String(day.name).trim()
      ? String(day.name).trim()
      : `Day ${progress.nextDay.workoutOrder}`;

  return {
    nextDay: {
      weekOrder: progress.nextDay.weekOrder,
      workoutOrder: progress.nextDay.workoutOrder,
    },
    dayName,
    doneDays,
    totalDays,
  };
}

module.exports = {
  buildSessionFromBlockWorkout,
  computeRunProgress,
  summarizeLeftOff,
  resolveEffort,
};
