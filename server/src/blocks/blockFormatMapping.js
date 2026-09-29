/**
 * Format <-> create-payload / API tree mapping.
 * Spec: docs/specs/blocks-v2.md section 3.3.
 */

/**
 * Validated format block -> POST /block-templates body shape.
 * @param {object} block - normalized format v1 block
 */
function formatToCreatePayload(block) {
  const effort = block.effort || "none";
  const payload = {
    name: block.name,
    description: block.description != null ? block.description : null,
    isPublic: false,
    useDuration: false,
    durationWeeks: null,
    useRPE: effort === "rpe",
    useRIR: effort === "rir",
    weeks: (block.weeks || []).map((week, wi) => {
      const w = {
        order: wi + 1,
        workouts: (week.days || []).map((day, di) => ({
          order: di + 1,
          name: day.name,
          exercises: (day.exercises || []).map((ex, ei) => {
            const sets = Array.isArray(ex.sets) ? ex.sets : [];
            const exercise = {
              order: ei + 1,
              exerciseName: ex.name,
              sets: sets.map((s, si) => {
                const row = { order: si + 1 };
                if (s.reps != null) row.reps = s.reps;
                if (s.repsMax != null) row.repsMax = s.repsMax;
                if (s.durationSec != null) row.durationSec = s.durationSec;
                if (s.weight != null) row.weight = s.weight;
                if (s.rpe != null) row.rpe = s.rpe;
                if (s.rir != null) row.rir = s.rir;
                return row;
              }),
            };
            if (ex.notes) exercise.notes = ex.notes;
            if (ex.restSec != null) exercise.restSec = ex.restSec;
            if (ex.effortCap) exercise.effortCap = true;
            // targetSets derived
            exercise.targetSets = sets.length;
            const repsParts = sets
              .map((s) => (s.reps != null ? String(s.reps) : ""))
              .filter(Boolean);
            if (repsParts.length > 0) {
              exercise.targetReps = repsParts.every((r) => r === repsParts[0])
                ? repsParts[0]
                : repsParts.join(" / ");
            }
            return exercise;
          }),
        })),
      };
      if (week.label) w.label = week.label;
      return w;
    }),
  };
  return payload;
}

/**
 * API BlockTemplate tree -> format v1 (always array set form).
 * @param {object} tree - GET /block-templates/:id shape
 * @param {{ unit?: "lb"|"kg" }} [options]
 */
function blockTreeToFormat(tree, options = {}) {
  const weeksIn = Array.isArray(tree.weeks) ? [...tree.weeks] : [];
  weeksIn.sort((a, b) => (a.order || 0) - (b.order || 0));

  let effort = "none";
  if (tree.useRPE) effort = "rpe";
  else if (tree.useRIR) effort = "rir";

  const weeks = weeksIn.map((week) => {
    const workouts = Array.isArray(week.workouts) ? [...week.workouts] : [];
    workouts.sort((a, b) => (a.order || 0) - (b.order || 0));
    const days = workouts.map((w) => {
      const exercisesIn = Array.isArray(w.exercises) ? [...w.exercises] : [];
      exercisesIn.sort((a, b) => (a.order || 0) - (b.order || 0));
      const exercises = exercisesIn.map((ex) => {
        const rawSets = Array.isArray(ex.blockWorkoutSets)
          ? [...ex.blockWorkoutSets]
          : Array.isArray(ex.sets)
            ? [...ex.sets]
            : [];
        rawSets.sort((a, b) => (a.order || 0) - (b.order || 0));
        const sets = rawSets.map((s) => {
          const row = {};
          if (s.reps != null) row.reps = s.reps;
          if (s.repsMax != null) row.repsMax = s.repsMax;
          if (s.durationSec != null) row.durationSec = s.durationSec;
          if (s.weight != null) row.weight = s.weight;
          if (s.rpe != null) row.rpe = s.rpe;
          if (s.rir != null) row.rir = s.rir;
          return row;
        });
        const out = {
          name: ex.exerciseName || ex.name,
          sets,
        };
        if (ex.notes) out.notes = ex.notes;
        if (ex.restSec != null) out.restSec = ex.restSec;
        if (ex.effortCap) out.effortCap = true;
        return out;
      });
      return { name: w.name, exercises };
    });
    const weekOut = { days };
    if (week.label) weekOut.label = week.label;
    return weekOut;
  });

  const block = {
    format: "logchamp.block",
    version: 1,
    name: tree.name,
    effort,
    weeks,
  };
  if (tree.description) block.description = tree.description;
  if (options.unit) block.unit = options.unit;
  return block;
}

module.exports = {
  formatToCreatePayload,
  blockTreeToFormat,
};
