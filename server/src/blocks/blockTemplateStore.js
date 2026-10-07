const {
  normalizeBlockWeeksArray,
  parseOptionalBoolean,
  parseOptionalDurationWeeks,
} = require("../lib/templateExerciseNormalize");
const { stampBlockWeeksArray } = require("../lib/exerciseIdentity");

function getPrisma() {
  return require("../lib/prisma");
}

const blockExerciseInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    blockWorkoutSets: {
      orderBy: {
        order: "asc",
      },
    },
  },
};

const blockWorkoutInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    exercises: blockExerciseInclude,
  },
};

const blockWeekInclude = {
  orderBy: {
    order: "asc",
  },
  include: {
    workouts: blockWorkoutInclude,
  },
};

function blockWeeksDurationConflictMessage(weekCount, durationEnabled, durationWeeksValue) {
  if (!durationEnabled || durationWeeksValue == null) return null;
  if (weekCount > durationWeeksValue) {
    return `This block has ${weekCount} weeks but duration is set to ${durationWeeksValue}. Remove weeks or increase duration before saving.`;
  }
  return null;
}

/**
 * Strip donor exercise identity ids from a loaded block tree so clone re-stamps
 * against the cloner's library. Keeps names, notes, labels, and v2 set fields.
 * @param {object} sourceTree - prisma blockTemplate with weeks include
 * @returns {object} create-body-shaped payload (no exerciseId / userExerciseId)
 */
function buildClonePayload(sourceTree) {
  return {
    name: `${sourceTree.name} (Copy)`,
    description: sourceTree.description,
    isPublic: false,
    durationWeeks: sourceTree.durationWeeks,
    useRIR: Boolean(sourceTree.useRIR),
    useRPE: Boolean(sourceTree.useRPE),
    useDuration: Boolean(sourceTree.useDuration),
    weeks: (sourceTree.weeks || []).map((week) => ({
      order: week.order,
      label: week.label,
      workouts: (week.workouts || []).map((w) => ({
        order: w.order,
        name: w.name,
        exercises: (w.exercises || []).map((exercise) => {
          const base = {
            order: exercise.order,
            exerciseName: exercise.exerciseName,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            notes: exercise.notes,
            restSec: exercise.restSec,
            effortCap: Boolean(exercise.effortCap),
            perSide:
              exercise.perSide === true || exercise.perSide === false
                ? exercise.perSide
                : null,
          };
          const sets = exercise.blockWorkoutSets || [];
          if (sets.length > 0) {
            return {
              ...base,
              sets: sets.map((s) => ({
                order: s.order,
                reps: s.reps,
                repsMax: s.repsMax,
                weight: s.weight,
                rpe: s.rpe,
                rir: s.rir,
                notes: s.notes,
                durationSec: s.durationSec,
              })),
            };
          }
          return base;
        }),
      })),
    })),
  };
}

/**
 * One create path for builder, import, and connector.
 * `source` and `isDraft` are server-set only - never read from body by callers.
 * @returns {{ ok: true, blockTemplate: object } | { ok: false, status: number, error: string }}
 */
async function createBlockTemplateForUser(
  userId,
  body,
  { source = "builder", isDraft = false, sourceUnit } = {}
) {
  const {
    name,
    description,
    isPublic,
    durationWeeks,
    weeks,
    useRIR,
    useRPE,
    useDuration,
  } = body || {};

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : null;

  if (!trimmedName) {
    return {
      ok: false,
      status: 400,
      error: "Block template name is required",
    };
  }

  const useDurParsed = parseOptionalBoolean(useDuration);
  if (!useDurParsed.ok) {
    return { ok: false, status: useDurParsed.status, error: useDurParsed.error };
  }

  const hasWeeksPayload =
    durationWeeks !== undefined &&
    durationWeeks !== null &&
    !(typeof durationWeeks === "string" && durationWeeks.trim() === "");

  const durationEnabled =
    useDurParsed.value !== undefined ? useDurParsed.value : hasWeeksPayload;

  let weeksValue = null;
  if (durationEnabled) {
    const dur = parseOptionalDurationWeeks(durationWeeks);
    if (!dur.ok) {
      return { ok: false, status: dur.status, error: dur.error };
    }
    weeksValue = dur.value !== undefined ? dur.value : null;
  }

  const norm = normalizeBlockWeeksArray(weeks);
  if (!norm.ok) {
    return { ok: false, status: norm.status, error: norm.error };
  }

  const durationConflict = blockWeeksDurationConflictMessage(
    norm.value.length,
    durationEnabled,
    weeksValue
  );
  if (durationConflict) {
    return { ok: false, status: 400, error: durationConflict };
  }

  const userExerciseRows = await getPrisma().userExercise.findMany({
    where: { userId },
  });
  const stampedWeeks = stampBlockWeeksArray(norm.value, userExerciseRows);

  const resolvedIsDraft = Boolean(isDraft);
  const data = {
    name: trimmedName,
    description: trimmedDescription,
    isPublic: resolvedIsDraft ? false : Boolean(isPublic),
    isDraft: resolvedIsDraft,
    source: source == null ? "builder" : String(source),
    userId,
    weeks: {
      create: stampedWeeks,
    },
    useDuration: durationEnabled,
    durationWeeks: durationEnabled ? weeksValue : null,
  };

  // BK11: connector drafts record the unit the AI wrote (unconverted).
  if (sourceUnit === "lb" || sourceUnit === "kg") {
    data.sourceUnit = sourceUnit;
  }

  if (useRIR !== undefined) {
    const b = parseOptionalBoolean(useRIR);
    if (!b.ok) {
      return { ok: false, status: b.status, error: b.error };
    }
    data.useRIR = b.value;
  }
  if (useRPE !== undefined) {
    const b = parseOptionalBoolean(useRPE);
    if (!b.ok) {
      return { ok: false, status: b.status, error: b.error };
    }
    data.useRPE = b.value;
  }

  const blockTemplate = await getPrisma().blockTemplate.create({
    data,
    include: {
      weeks: blockWeekInclude,
    },
  });

  return { ok: true, blockTemplate };
}

module.exports = {
  createBlockTemplateForUser,
  buildClonePayload,
  blockWeekInclude,
  blockWeeksDurationConflictMessage,
};
