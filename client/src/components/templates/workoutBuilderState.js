/**
 * Workout template ↔ API mapping for WorkoutBuilder.
 *
 * - exercisesToTemplateApi: sends `sets[]` so the server persists TemplateSet (reps, weight, RIR, RPE).
 * - templateToBuilderExercises: rebuilds builder state from GET responses; prefers `templateSets`, else targetSets/targetReps.
 *
 * Limitations: TemplateSet.notes are not edited in the UI yet — if present on the server, they are not round-tripped
 * through the builder. Exercise-level `notes` are preserved.
 */

export function createEmptySet() {
  return {
    id: crypto.randomUUID(),
    reps: "",
    weight: "",
    rir: "",
    rpe: "",
  };
}

export function createEmptyExercise() {
  return {
    id: crypto.randomUUID(),
    exerciseName: "",
    notes: "",
    sets: [createEmptySet()],
  };
}

export function createInitialExercises() {
  return [createEmptyExercise()];
}

function toOptionalPositiveInt(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

function toOptionalNonNegFloat(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function toOptionalNonNegInt(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

/**
 * Maps WorkoutBuilder exercises to POST/PATCH /templates exercise payload.
 * Sends per-set rows so the API can persist TemplateSet; also sets targetReps for older clients.
 */
export function exercisesToTemplateApi(exercises) {
  return exercises.map((ex, idx) => {
    const sets = Array.isArray(ex.sets) ? ex.sets : [];

    const repsParts = sets
      .map((s) => String(s.reps || "").trim())
      .filter(Boolean);
    let targetReps = null;
    if (repsParts.length > 0) {
      targetReps = repsParts.every((r) => r === repsParts[0])
        ? repsParts[0]
        : repsParts.join(" / ");
    }

    const setsPayload = sets.map((s, i) => {
      const row = { order: i + 1 };
      const reps = toOptionalPositiveInt(s.reps);
      if (reps !== undefined) row.reps = reps;
      const weight = toOptionalNonNegFloat(s.weight);
      if (weight !== undefined) row.weight = weight;
      const rpe = toOptionalNonNegFloat(s.rpe);
      if (rpe !== undefined) row.rpe = rpe;
      const rir = toOptionalNonNegInt(s.rir);
      if (rir !== undefined) row.rir = rir;
      return row;
    });

    const row = {
      order: idx + 1,
      exerciseName: String(ex.exerciseName || "").trim(),
      sets: setsPayload,
    };

    const exerciseNotes = String(ex.notes || "").trim();
    if (exerciseNotes) row.notes = exerciseNotes;

    if (targetReps) row.targetReps = targetReps;

    return row;
  });
}

/** @see module comment above for round-trip limits. */
export function templateToBuilderExercises(template) {
  if (!template || !Array.isArray(template.exercises)) {
    return createInitialExercises();
  }

  const sorted = [...template.exercises].sort((a, b) => a.order - b.order);

  return sorted.map((ex) => {
    const rawSets = Array.isArray(ex.templateSets)
      ? ex.templateSets
      : Array.isArray(ex.blockWorkoutSets)
        ? ex.blockWorkoutSets
        : [];
    const templateSets = [...rawSets].sort((a, b) => a.order - b.order);

    let sets;
    if (templateSets.length > 0) {
      sets = templateSets.map((s) => ({
        id: crypto.randomUUID(),
        reps: s.reps != null ? String(s.reps) : "",
        weight: s.weight != null ? String(s.weight) : "",
        rir: s.rir != null ? String(s.rir) : "",
        rpe: s.rpe != null ? String(s.rpe) : "",
      }));
    } else {
      const count =
        ex.targetSets != null && ex.targetSets > 0 ? ex.targetSets : 1;
      const repsStr = ex.targetReps ? String(ex.targetReps) : "";
      const repsParts = repsStr.split(/\s*\/\s*/).filter(Boolean);
      sets = [];
      for (let i = 0; i < count; i += 1) {
        const r =
          repsParts.length === 1
            ? repsParts[0]
            : repsParts[i] != null
              ? repsParts[i]
              : "";
        sets.push({
          id: crypto.randomUUID(),
          reps: r || "",
          weight: "",
          rir: "",
          rpe: "",
        });
      }
    }

    return {
      id: crypto.randomUUID(),
      exerciseName: ex.exerciseName || "",
      notes: ex.notes || "",
      sets,
    };
  });
}

/**
 * One-line summary of an exercise row from GET /templates (list or detail) for UI lists.
 */
export function newBlockWorkout() {
  return {
    id: crypto.randomUUID(),
    title: "",
    exercises: createInitialExercises(),
  };
}

/** Payload workouts[] for POST/PATCH /block-templates */
export function blockWorkoutsToApiPayload(blockWorkouts) {
  return blockWorkouts.map((w, i) => ({
    order: i + 1,
    name: (w.title && String(w.title).trim()) || `Workout ${i + 1}`,
    exercises: exercisesToTemplateApi(w.exercises),
  }));
}

/** Hydrate block editor state from GET /block-templates/:id */
export function blockTemplateToBlockWorkouts(blockTemplate) {
  if (!blockTemplate || !Array.isArray(blockTemplate.workouts) || blockTemplate.workouts.length === 0) {
    return [newBlockWorkout()];
  }
  const sorted = [...blockTemplate.workouts].sort((a, b) => a.order - b.order);
  return sorted.map((w) => ({
    id: crypto.randomUUID(),
    title: w.name || "",
    exercises: templateToBuilderExercises({ exercises: w.exercises }),
  }));
}

/** One-line summary for list cards, e.g. "4 weeks • 4 workouts" */
export function formatBlockTemplateSummary(blockTemplate) {
  const n = Array.isArray(blockTemplate.workouts) ? blockTemplate.workouts.length : 0;
  const w = blockTemplate.durationWeeks;
  const weekPart =
    w != null && Number.isFinite(Number(w))
      ? `${w} week${Number(w) === 1 ? "" : "s"}`
      : null;
  if (weekPart) {
    return `${weekPart} • ${n} workout${n === 1 ? "" : "s"}`;
  }
  return `${n} workout${n === 1 ? "" : "s"}`;
}

export function summarizeExerciseTargets(ex) {
  if (!ex) return "";
  const rawSets = Array.isArray(ex.templateSets)
    ? ex.templateSets
    : Array.isArray(ex.blockWorkoutSets)
      ? ex.blockWorkoutSets
      : [];
  const templateSets = [...rawSets].sort((a, b) => a.order - b.order);

  if (templateSets.length > 0) {
    return templateSets
      .map((s, i) => {
        const parts = [];
        if (s.reps != null) parts.push(`${s.reps} reps`);
        if (s.weight != null) parts.push(`@${s.weight}`);
        if (s.rir != null) parts.push(`RIR ${s.rir}`);
        if (s.rpe != null) parts.push(`RPE ${s.rpe}`);
        const meta = parts.length ? parts.join(" · ") : "open";
        return `S${i + 1}: ${meta}`;
      })
      .join(" · ");
  }

  const ts =
    ex.targetSets != null && ex.targetSets > 0 ? `${ex.targetSets} sets` : null;
  const tr = ex.targetReps ? String(ex.targetReps).trim() : null;
  const legacy = [ts, tr ? `${tr} reps` : null].filter(Boolean).join(" · ");
  return legacy || "—";
}
