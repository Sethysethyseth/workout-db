function parsePositiveInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNullableInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

function parseNullableFloat(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed;
}

/**
 * Normalizes one exercise from POST/PATCH body into Prisma nested create shape.
 * Supports optional per-exercise `sets` for TemplateSet rows; otherwise targetSets/targetReps/notes only.
 * @returns {{ ok: true, value: object } | { ok: false, status: number, error: string }}
 */
function normalizeExerciseForCreate(raw, index) {
  const exerciseName =
    typeof raw.exerciseName === "string" ? raw.exerciseName.trim() : "";

  if (!exerciseName) {
    return { ok: false, status: 400, error: "Each exercise must have an exerciseName" };
  }

  let order = raw.order;
  if (order == null) {
    order = index + 1;
  }

  if (!Number.isInteger(order) || order <= 0) {
    return { ok: false, status: 400, error: "Exercise order must be a positive integer" };
  }

  const notes =
    typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim() : null;

  const hasSetsArray = Array.isArray(raw.sets);
  const templateSetsCreate = [];

  if (hasSetsArray) {
    if (raw.sets.length === 0) {
      return {
        ok: false,
        status: 400,
        error: "Each exercise must include at least one set when sets is provided",
      };
    }
    const seenSetOrders = new Set();
    for (let sIdx = 0; sIdx < raw.sets.length; sIdx += 1) {
      const s = raw.sets[sIdx] || {};
      let setOrder = s.order;
      if (setOrder == null) {
        setOrder = sIdx + 1;
      }
      if (!Number.isInteger(setOrder) || setOrder <= 0) {
        return {
          ok: false,
          status: 400,
          error: "Set order must be a positive integer",
        };
      }
      if (seenSetOrders.has(setOrder)) {
        return {
          ok: false,
          status: 400,
          error: "Set order values must be unique within an exercise",
        };
      }
      seenSetOrders.add(setOrder);

      const reps = parseNullableInt(s.reps);
      if (Number.isNaN(reps) || (reps !== null && reps <= 0)) {
        return {
          ok: false,
          status: 400,
          error: "reps must be a positive integer when provided",
        };
      }

      const weight = parseNullableFloat(s.weight);
      if (Number.isNaN(weight) || (weight !== null && weight < 0)) {
        return {
          ok: false,
          status: 400,
          error: "weight must be a non-negative number when provided",
        };
      }

      const rpe = parseNullableFloat(s.rpe);
      if (Number.isNaN(rpe) || (rpe !== null && rpe < 0)) {
        return {
          ok: false,
          status: 400,
          error: "rpe must be a non-negative number when provided",
        };
      }

      const rir = parseNullableInt(s.rir);
      if (Number.isNaN(rir) || (rir !== null && rir < 0)) {
        return {
          ok: false,
          status: 400,
          error: "rir must be a non-negative integer when provided",
        };
      }

      const setNotes =
        typeof s.notes === "string" && s.notes.trim() ? s.notes.trim() : null;

      const row = { order: setOrder };
      if (reps != null) row.reps = reps;
      if (weight != null) row.weight = weight;
      if (rpe != null) row.rpe = rpe;
      if (rir != null) row.rir = rir;
      if (setNotes != null) row.notes = setNotes;
      templateSetsCreate.push(row);
    }
  }

  let targetSets = raw.targetSets == null ? null : Number(raw.targetSets);
  if (targetSets != null) {
    if (!Number.isInteger(targetSets) || targetSets <= 0) {
      return {
        ok: false,
        status: 400,
        error: "targetSets must be a positive integer when provided",
      };
    }
  }

  const targetReps =
    raw.targetReps == null ? null : String(raw.targetReps).trim();

  if (templateSetsCreate.length > 0) {
    targetSets = templateSetsCreate.length;
    const repsParts = templateSetsCreate
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((row) => (row.reps != null ? String(row.reps) : ""))
      .filter(Boolean);
    let derivedTargetReps = null;
    if (repsParts.length > 0) {
      derivedTargetReps = repsParts.every((r) => r === repsParts[0])
        ? repsParts[0]
        : repsParts.join(" / ");
    }
    const exercise = {
      order,
      exerciseName,
      notes,
      targetSets,
      targetReps: derivedTargetReps || (targetReps || null),
      templateSets: {
        create: templateSetsCreate,
      },
    };
    return { ok: true, value: exercise };
  }

  const exercise = {
    order,
    exerciseName,
    notes,
  };

  if (targetSets != null) {
    exercise.targetSets = targetSets;
  }

  if (targetReps) {
    exercise.targetReps = targetReps;
  }

  return { ok: true, value: exercise };
}

/**
 * @param {unknown[]} exercises
 * @returns {{ ok: true, value: object[] } | { ok: false, status: number, error: string }}
 */
function normalizeExercisesArray(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Template must include at least one exercise",
    };
  }

  const normalized = [];
  const seenOrders = new Set();

  for (let index = 0; index < exercises.length; index += 1) {
    const raw = exercises[index] || {};
    const result = normalizeExerciseForCreate(raw, index);
    if (!result.ok) {
      return result;
    }
    const { order } = result.value;
    if (seenOrders.has(order)) {
      return {
        ok: false,
        status: 400,
        error: "Exercise order values must be unique within the template",
      };
    }
    seenOrders.add(order);
    normalized.push(result.value);
  }

  return { ok: true, value: normalized };
}

/**
 * Prisma nested create uses blockWorkoutSets; normalizeExerciseForCreate emits templateSets.
 */
function mapExerciseCreateToBlockWorkout(exerciseValue) {
  const { templateSets, ...rest } = exerciseValue;
  if (templateSets) {
    return { ...rest, blockWorkoutSets: templateSets };
  }
  return rest;
}

/**
 * @param {unknown[]} workouts — each: { order?, name|title, exercises[] }
 * @returns {{ ok: true, value: object[] } | { ok: false, status: number, error: string }}
 */
function normalizeBlockWorkoutsArray(workouts) {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Block must include at least one workout",
    };
  }

  const normalized = [];
  const seenOrders = new Set();

  for (let index = 0; index < workouts.length; index += 1) {
    const raw = workouts[index] || {};

    let order = raw.order;
    if (order == null) {
      order = index + 1;
    }
    if (!Number.isInteger(order) || order <= 0) {
      return {
        ok: false,
        status: 400,
        error: "Workout order must be a positive integer",
      };
    }
    if (seenOrders.has(order)) {
      return {
        ok: false,
        status: 400,
        error: "Workout order values must be unique within the block",
      };
    }
    seenOrders.add(order);

    const titleOrName = raw.name != null ? raw.name : raw.title;
    const nameRaw = typeof titleOrName === "string" ? titleOrName.trim() : "";
    const name = nameRaw || `Workout ${order}`;

    const normEx = normalizeExercisesArray(raw.exercises);
    if (!normEx.ok) {
      return normEx;
    }

    const exercisesCreate = normEx.value.map(mapExerciseCreateToBlockWorkout);

    normalized.push({
      order,
      name,
      exercises: {
        create: exercisesCreate,
      },
    });
  }

  return { ok: true, value: normalized };
}

/**
 * @param {unknown[]} weeks — each: { order?, workouts[] } where workouts matches normalizeBlockWorkoutsArray
 * @returns {{ ok: true, value: object[] } | { ok: false, status: number, error: string }}
 */
function normalizeBlockWeeksArray(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Block must include at least one week",
    };
  }

  const normalized = [];
  const seenOrders = new Set();

  for (let index = 0; index < weeks.length; index += 1) {
    const raw = weeks[index] || {};

    let order = raw.order;
    if (order == null) {
      order = index + 1;
    }
    if (!Number.isInteger(order) || order <= 0) {
      return {
        ok: false,
        status: 400,
        error: "Week order must be a positive integer",
      };
    }
    if (seenOrders.has(order)) {
      return {
        ok: false,
        status: 400,
        error: "Week order values must be unique within the block",
      };
    }
    seenOrders.add(order);

    const normW = normalizeBlockWorkoutsArray(raw.workouts);
    if (!normW.ok) {
      return normW;
    }

    normalized.push({
      order,
      workouts: {
        create: normW.value,
      },
    });
  }

  return { ok: true, value: normalized };
}

/**
 * Optional positive integer or null (omit / empty string).
 */
function parseOptionalDurationWeeks(value) {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return {
      ok: false,
      status: 400,
      error: "durationWeeks must be a positive integer when provided",
    };
  }
  return { ok: true, value: n };
}

function parseOptionalBoolean(value) {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value === "boolean") {
    return { ok: true, value };
  }
  return {
    ok: false,
    status: 400,
    error: "Expected a boolean value",
  };
}

module.exports = {
  normalizeExercisesArray,
  normalizeBlockWorkoutsArray,
  normalizeBlockWeeksArray,
  parseOptionalDurationWeeks,
  parseOptionalBoolean,
  parsePositiveInt,
};
