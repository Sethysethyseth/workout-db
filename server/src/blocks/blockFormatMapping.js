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
            if (ex.perSide === true || ex.perSide === false) {
              exercise.perSide = ex.perSide;
            }
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
 * Older block exercises can carry only targetSets / targetReps with no set
 * rows. Rebuild set objects from those so an export re-imports cleanly
 * (the builder hydrates the same way - blockBuilderState.js).
 * @returns {{ sets: object[], note: string | null }}
 */
function setsFromTargets(ex) {
  const count =
    Number.isInteger(ex.targetSets) && ex.targetSets >= 1 && ex.targetSets <= 20
      ? ex.targetSets
      : 3;
  const raw = ex.targetReps != null ? String(ex.targetReps).trim() : "";
  let set = {};
  let note = null;
  let m;
  if (raw === "") {
    set = {};
  } else if ((m = raw.match(/^(\d+(?:\.\d+)?)$/)) && Number(m[1]) > 0) {
    set = { reps: Number(m[1]) };
  } else if ((m = raw.match(/^(\d+)\s*-\s*(\d+)$/)) && Number(m[2]) > Number(m[1]) && Number(m[1]) > 0) {
    set = { reps: Number(m[1]), repsMax: Number(m[2]) };
  } else if ((m = raw.match(/^(\d+)s$/)) && Number(m[1]) >= 1 && Number(m[1]) <= 3600) {
    set = { durationSec: Number(m[1]) };
  } else {
    note = `Reps: ${raw}`;
  }
  return { sets: Array.from({ length: count }, () => ({ ...set })), note };
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
        let targetsNote = null;
        let sets;
        if (rawSets.length === 0) {
          const fromTargets = setsFromTargets(ex);
          sets = fromTargets.sets;
          targetsNote = fromTargets.note;
        } else {
          sets = rawSets.map((s) => {
            const row = {};
            if (s.reps != null) row.reps = s.reps;
            if (s.repsMax != null) row.repsMax = s.repsMax;
            if (s.durationSec != null) row.durationSec = s.durationSec;
            if (s.weight != null) row.weight = s.weight;
            if (s.rpe != null) row.rpe = s.rpe;
            if (s.rir != null) row.rir = s.rir;
            return row;
          });
        }
        const out = {
          name: ex.exerciseName || ex.name,
          sets,
        };
        const notes = [ex.notes, targetsNote].filter(Boolean).join("\n");
        if (notes) out.notes = notes;
        if (ex.restSec != null) out.restSec = ex.restSec;
        if (ex.effortCap) out.effortCap = true;
        if (ex.perSide === true || ex.perSide === false) out.perSide = ex.perSide;
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
