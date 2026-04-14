import { makeId } from "../../lib/makeId.js";

/**
 * Workout template ↔ API mapping for WorkoutBuilder.
 *
 * - exercisesToTemplateApi: sends `sets[]` so the server persists TemplateSet (reps, weight, RIR, RPE).
 * - templateToBuilderExercises: rebuilds builder state from GET responses; prefers `templateSets`, else targetSets/targetReps.
 *
 * TemplateSet.notes round-trip when present on the server.
 */

export function createEmptySet() {
  return {
    id: makeId(),
    reps: "",
    weight: "",
    rir: "",
    rpe: "",
    notes: "",
  };
}

export function createEmptyExercise() {
  return {
    id: makeId(),
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
      const setNotes = String(s.notes ?? "").trim();
      if (setNotes) row.notes = setNotes;
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
        id: makeId(),
        reps: s.reps != null ? String(s.reps) : "",
        weight: s.weight != null ? String(s.weight) : "",
        rir: s.rir != null ? String(s.rir) : "",
        rpe: s.rpe != null ? String(s.rpe) : "",
        notes: s.notes != null ? String(s.notes) : "",
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
          id: makeId(),
          reps: r || "",
          weight: "",
          rir: "",
          rpe: "",
          notes: "",
        });
      }
    }

    return {
      id: makeId(),
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
    id: makeId(),
    title: "",
    exercises: createInitialExercises(),
  };
}

export function newBlockWeek() {
  return {
    id: makeId(),
    workouts: [newBlockWorkout()],
  };
}

/**
 * When duration is enabled and the field holds a positive integer, returns that cap for week count.
 * Otherwise null (no cap from duration).
 */
export function parseBlockDurationWeekCap(useDuration, durationWeeksRaw) {
  if (!useDuration) return null;
  const s = String(durationWeeksRaw ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function setRowIsBlank(set) {
  if (!set || typeof set !== "object") return true;
  const keys = Object.keys(set).filter((k) => k !== "id");
  return keys.every((k) => !String(set[k] ?? "").trim());
}

/** True when the week matches a freshly created week (single default workout / exercise / set, no user text). */
export function isBlockWeekPristine(week) {
  if (!week || typeof week !== "object") return false;
  const workouts = Array.isArray(week.workouts) ? week.workouts : [];
  if (workouts.length !== 1) return false;
  const w = workouts[0];
  if (String(w.title ?? "").trim()) return false;
  const exercises = Array.isArray(w.exercises) ? w.exercises : [];
  if (exercises.length !== 1) return false;
  const ex = exercises[0];
  if (String(ex.exerciseName ?? "").trim() || String(ex.notes ?? "").trim()) return false;
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  if (sets.length !== 1) return false;
  return setRowIsBlank(sets[0]);
}

function cloneSetDeep(set) {
  const { id: _omit, ...rest } = set && typeof set === "object" ? set : {};
  return { id: makeId(), ...rest };
}

function cloneExerciseDeep(ex) {
  const sets = Array.isArray(ex?.sets) ? ex.sets.map(cloneSetDeep) : [];
  return {
    id: makeId(),
    exerciseName: ex.exerciseName != null ? String(ex.exerciseName) : "",
    notes: ex.notes != null ? String(ex.notes) : "",
    sets: sets.length ? sets : [createEmptySet()],
  };
}

function cloneBlockWorkoutDeep(w) {
  const exercises = Array.isArray(w?.exercises) ? w.exercises.map(cloneExerciseDeep) : [];
  return {
    id: makeId(),
    title: w.title != null ? String(w.title) : "",
    exercises: exercises.length ? exercises : createInitialExercises(),
  };
}

/**
 * Deep-clone all workouts from a source week: new ids for every workout, exercise, and set.
 * Preserves string and primitive set fields (reps, weight, RIR, RPE, and any future columns).
 * Returns a non-empty workouts array (one empty workout if the source list is empty).
 */
export function cloneBlockWeekWorkoutsFromSource(sourceWeek) {
  const list = Array.isArray(sourceWeek?.workouts) ? sourceWeek.workouts : [];
  const mapped = list.map(cloneBlockWorkoutDeep);
  return mapped.length ? mapped : [newBlockWorkout()];
}

/** Replace `blockWeeks[weekIdx].workouts` with a deep clone of the previous week’s workouts. */
export function applyCopyPreviousWeek(blockWeeks, weekIdx) {
  if (!Array.isArray(blockWeeks) || weekIdx < 1) return blockWeeks;
  const source = blockWeeks[weekIdx - 1];
  const target = blockWeeks[weekIdx];
  if (!source || !target) return blockWeeks;
  const workouts = cloneBlockWeekWorkoutsFromSource(source);
  return blockWeeks.map((wk, i) => (i === weekIdx ? { ...wk, workouts } : wk));
}

/** Payload workouts[] inside one week for POST/PATCH /block-templates */
export function blockWorkoutsToApiPayload(blockWorkouts) {
  return blockWorkouts.map((w, i) => ({
    order: i + 1,
    name: (w.title && String(w.title).trim()) || `Workout ${i + 1}`,
    exercises: exercisesToTemplateApi(w.exercises),
  }));
}

/** Payload weeks[] for POST/PATCH /block-templates */
export function blockWeeksToApiPayload(blockWeeks) {
  return blockWeeks.map((week, wi) => ({
    order: wi + 1,
    workouts: blockWorkoutsToApiPayload(week.workouts),
  }));
}

/** Hydrate block editor state from GET /block-templates/:id */
export function blockTemplateToBlockWeeks(blockTemplate) {
  if (!blockTemplate || !Array.isArray(blockTemplate.weeks) || blockTemplate.weeks.length === 0) {
    return [newBlockWeek()];
  }
  const sortedWeeks = [...blockTemplate.weeks].sort((a, b) => a.order - b.order);
  return sortedWeeks.map((week) => ({
    id: makeId(),
    workouts:
      !Array.isArray(week.workouts) || week.workouts.length === 0
        ? [newBlockWorkout()]
        : [...week.workouts]
            .sort((a, b) => a.order - b.order)
            .map((w) => ({
              id: makeId(),
              title: w.name || "",
              exercises: templateToBuilderExercises({ exercises: w.exercises }),
            })),
  }));
}

/** One-line summary for list cards */
export function formatBlockTemplateSummary(blockTemplate) {
  const weeks = Array.isArray(blockTemplate.weeks) ? blockTemplate.weeks : [];
  const weekCount = weeks.length;
  const workoutCount = weeks.reduce(
    (acc, wk) => acc + (Array.isArray(wk.workouts) ? wk.workouts.length : 0),
    0
  );
  const w = blockTemplate.durationWeeks;
  const weekPart =
    w != null && Number.isFinite(Number(w))
      ? `${w} week${Number(w) === 1 ? "" : "s"}`
      : null;

  let structureLabel;
  if (weekCount <= 1) {
    structureLabel = `${workoutCount} workout${workoutCount === 1 ? "" : "s"}`;
  } else {
    structureLabel = `${weekCount} training weeks · ${workoutCount} workout${workoutCount === 1 ? "" : "s"}`;
  }

  if (weekPart) {
    return `${weekPart} • ${structureLabel}`;
  }
  return structureLabel;
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
