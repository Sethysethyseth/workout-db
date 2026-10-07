/**
 * Pure block-builder state: API tree <-> local state <-> POST/PATCH payload,
 * plus edit operations. No React, no fetch. BK5b adds copyForward on top.
 */

import { makeId } from "../../../lib/makeId.js";
import { formatDuration } from "../ui/rxFormat.js";

const LB_PER_KG = 2.20462;
const MAX_WEEKS = 52;
const MAX_DAYS = 7;
const MAX_EXERCISES = 40;
const MAX_SETS = 20;

/** @returns {"lb"|"kg"} */
export function normalizeUnit(unit) {
  const u = String(unit ?? "").toLowerCase();
  if (u === "kg") return "kg";
  return "lb";
}

/** Device pref ("lbs"|"kg") -> format unit ("lb"|"kg"). */
export function deviceUnitToFormat(unit) {
  return normalizeUnit(unit === "lbs" ? "lb" : unit);
}

function roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

/**
 * Convert a weight from `fromUnit` to `toUnit`. Both accept lb/lbs/kg.
 * @returns {number}
 */
export function convertWeight(weight, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (from === to) return weight;
  if (from === "kg" && to === "lb") return roundToHalf(weight * LB_PER_KG);
  return roundToHalf(weight / LB_PER_KG);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createEmptySet(overrides = {}) {
  return {
    id: makeId(),
    reps: overrides.reps !== undefined ? overrides.reps : null,
    repsMax: overrides.repsMax !== undefined ? overrides.repsMax : null,
    durationSec: overrides.durationSec !== undefined ? overrides.durationSec : null,
    weight: overrides.weight !== undefined ? overrides.weight : null,
    rpe: overrides.rpe !== undefined ? overrides.rpe : null,
    rir: overrides.rir !== undefined ? overrides.rir : null,
    // Not editable in the builder; carried so saving never drops the set
    // notes older blocks were built with.
    notes: overrides.notes !== undefined ? overrides.notes : null,
  };
}

/** Default new exercise: 3 sets x 8 reps, no load. */
export function createEmptyExercise(overrides = {}) {
  const sets =
    overrides.sets != null
      ? overrides.sets
      : [createEmptySet({ reps: 8 }), createEmptySet({ reps: 8 }), createEmptySet({ reps: 8 })];
  return {
    id: makeId(),
    exerciseName: overrides.exerciseName != null ? String(overrides.exerciseName) : "",
    notes: overrides.notes != null ? String(overrides.notes) : "",
    restSec: overrides.restSec !== undefined ? overrides.restSec : null,
    effortCap: Boolean(overrides.effortCap),
    notInLibrary: Boolean(overrides.notInLibrary),
    sets,
  };
}

export function createEmptyDay(name = "Day 1") {
  return {
    id: makeId(),
    name,
    exercises: [],
  };
}

export function createEmptyWeek(label = "") {
  return {
    id: makeId(),
    label: label != null ? String(label) : "",
    days: [createEmptyDay("Day 1")],
  };
}

/** Fresh create-mode builder state. */
export function createInitialState(overrides = {}) {
  return {
    name: overrides.name != null ? String(overrides.name) : "",
    description: overrides.description != null ? String(overrides.description) : "",
    isPublic: Boolean(overrides.isPublic),
    effort: overrides.effort === "rpe" || overrides.effort === "rir" ? overrides.effort : "none",
    isDraft: Boolean(overrides.isDraft),
    sourceUnit: overrides.sourceUnit != null ? normalizeUnit(overrides.sourceUnit) : null,
    weeks: overrides.weeks != null ? overrides.weeks : [createEmptyWeek()],
  };
}

function mapApiSet(s) {
  return createEmptySet({
    reps: s.reps != null ? Number(s.reps) : null,
    repsMax: s.repsMax != null ? Number(s.repsMax) : null,
    durationSec: s.durationSec != null ? Number(s.durationSec) : null,
    weight: s.weight != null ? Number(s.weight) : null,
    rpe: s.rpe != null ? Number(s.rpe) : null,
    rir: s.rir != null ? Number(s.rir) : null,
    notes: typeof s.notes === "string" && s.notes.trim() ? s.notes : null,
  });
}

/**
 * Older exercises can carry only targetSets / targetReps with no set rows.
 * Rebuild the sets from those so a save doesn't rewrite them to 3 x 8.
 */
function setsFromTargets(ex) {
  const count =
    Number.isInteger(ex.targetSets) && ex.targetSets >= 1 && ex.targetSets <= MAX_SETS
      ? ex.targetSets
      : 3;
  const raw = ex.targetReps != null ? String(ex.targetReps).trim() : "";
  let fields = { reps: null };
  let unparsed = null;
  let m;
  if (raw === "") {
    fields = { reps: null };
  } else if ((m = raw.match(/^(\d+(?:\.\d+)?)$/))) {
    fields = { reps: Number(m[1]) };
  } else if ((m = raw.match(/^(\d+)\s*-\s*(\d+)$/)) && Number(m[2]) > Number(m[1])) {
    fields = { reps: Number(m[1]), repsMax: Number(m[2]) };
  } else if ((m = raw.match(/^(\d+)s$/)) && Number(m[1]) >= 1) {
    fields = { durationSec: Number(m[1]) };
  } else {
    unparsed = raw;
  }
  const sets = Array.from({ length: count }, () => createEmptySet(fields));
  return { sets, unparsed };
}

function mapApiExercise(ex) {
  const rawSets = Array.isArray(ex.blockWorkoutSets)
    ? [...ex.blockWorkoutSets]
    : Array.isArray(ex.sets)
      ? [...ex.sets]
      : [];
  rawSets.sort((a, b) => (a.order || 0) - (b.order || 0));
  let sets;
  let notes = ex.notes != null ? String(ex.notes) : "";
  if (rawSets.length) {
    sets = rawSets.map(mapApiSet);
  } else {
    const fromTargets = setsFromTargets(ex);
    sets = fromTargets.sets;
    if (fromTargets.unparsed) {
      const line = `Reps: ${fromTargets.unparsed}`;
      notes = notes ? `${notes}\n${line}` : line;
    }
  }
  return {
    id: makeId(),
    exerciseName: ex.exerciseName || ex.name || "",
    notes,
    restSec: ex.restSec != null ? Number(ex.restSec) : null,
    effortCap: Boolean(ex.effortCap),
    notInLibrary: false,
    sets,
  };
}

/**
 * Hydrate builder state from GET /block-templates/:id `blockTemplate` tree.
 */
export function hydrateFromApi(blockTemplate) {
  if (!blockTemplate || typeof blockTemplate !== "object") {
    return createInitialState();
  }

  let effort = "none";
  if (blockTemplate.useRPE) effort = "rpe";
  else if (blockTemplate.useRIR) effort = "rir";

  const weeksIn = Array.isArray(blockTemplate.weeks) ? [...blockTemplate.weeks] : [];
  weeksIn.sort((a, b) => (a.order || 0) - (b.order || 0));

  const weeks =
    weeksIn.length === 0
      ? [createEmptyWeek()]
      : weeksIn.map((week) => {
          const workouts = Array.isArray(week.workouts) ? [...week.workouts] : [];
          workouts.sort((a, b) => (a.order || 0) - (b.order || 0));
          const days =
            workouts.length === 0
              ? [createEmptyDay("Day 1")]
              : workouts.map((w, di) => ({
                  id: makeId(),
                  name: w.name || `Day ${di + 1}`,
                  exercises: Array.isArray(w.exercises)
                    ? [...w.exercises]
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(mapApiExercise)
                    : [],
                }));
          return {
            id: makeId(),
            label: week.label != null ? String(week.label) : "",
            days,
          };
        });

  return {
    name: blockTemplate.name != null ? String(blockTemplate.name) : "",
    description: blockTemplate.description != null ? String(blockTemplate.description) : "",
    isPublic: Boolean(blockTemplate.isPublic),
    effort,
    isDraft: Boolean(blockTemplate.isDraft),
    sourceUnit:
      blockTemplate.sourceUnit === "lb" ||
      blockTemplate.sourceUnit === "lbs" ||
      blockTemplate.sourceUnit === "kg"
        ? normalizeUnit(blockTemplate.sourceUnit)
        : null,
    weeks,
  };
}

function numOrOmit(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function serializeSet(s, order) {
  const row = { order };
  const reps = numOrOmit(s.reps);
  const repsMax = numOrOmit(s.repsMax);
  const durationSec = numOrOmit(s.durationSec);
  const weight = numOrOmit(s.weight);
  const rpe = numOrOmit(s.rpe);
  const rir = numOrOmit(s.rir);

  if (reps != null) row.reps = reps;
  if (repsMax != null) row.repsMax = repsMax;
  if (durationSec != null) row.durationSec = durationSec;
  // Omit weight for bodyweight - never 0
  if (weight != null && weight > 0) row.weight = weight;
  if (rpe != null) row.rpe = rpe;
  if (rir != null) row.rir = rir;
  if (typeof s.notes === "string" && s.notes.trim()) row.notes = s.notes.trim();
  return row;
}

function serializeExercise(ex, order) {
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  const setsPayload = sets.map((s, i) => serializeSet(s, i + 1));
  const row = {
    order,
    exerciseName: String(ex.exerciseName || "").trim(),
    sets: setsPayload,
    targetSets: setsPayload.length,
  };
  const notes = String(ex.notes || "").trim();
  if (notes) row.notes = notes;

  // Rest: 0 / null / undefined -> omit (saves null on server via absence)
  const rest = ex.restSec;
  if (rest != null && Number(rest) > 0) {
    row.restSec = Number(rest);
  }

  if (ex.effortCap) row.effortCap = true;

  const repsParts = setsPayload
    .map((s) => (s.reps != null ? String(s.reps) : ""))
    .filter(Boolean);
  if (repsParts.length > 0) {
    row.targetReps = repsParts.every((r) => r === repsParts[0])
      ? repsParts[0]
      : repsParts.join(" / ");
  }

  return row;
}

/**
 * Serialize builder state to POST/PATCH /block-templates body.
 * Every v2 field (label, restSec, effortCap, repsMax, durationSec) is included when set.
 */
export function serializeToPayload(state) {
  const effort = state.effort === "rpe" || state.effort === "rir" ? state.effort : "none";
  const name = String(state.name || "").trim();
  const description = String(state.description || "").trim();

  return {
    name,
    description: description ? description : null,
    isPublic: Boolean(state.isPublic),
    useRPE: effort === "rpe",
    useRIR: effort === "rir",
    useDuration: false,
    durationWeeks: null,
    weeks: (state.weeks || []).map((week, wi) => {
      const w = {
        order: wi + 1,
        workouts: (week.days || []).map((day, di) => ({
          order: di + 1,
          name: String(day.name || "").trim() || `Day ${di + 1}`,
          exercises: (day.exercises || []).map((ex, ei) => serializeExercise(ex, ei + 1)),
        })),
      };
      const label = String(week.label || "").trim();
      if (label) w.label = label;
      return w;
    }),
  };
}

/**
 * Client validation mirroring spec 3.1 (subset needed for Save).
 * @returns {{ ok: true } | { ok: false, errors: { path: string, message: string }[] }}
 */
export function validateState(state) {
  const errors = [];
  const push = (path, message) => {
    if (errors.length < 50) errors.push({ path, message });
  };

  const name = String(state.name || "").trim();
  if (!name) push("name", "Block name is required");
  else if (name.length > 120) push("name", "Block name must be at most 120 characters");

  const description = String(state.description || "");
  if (description.length > 2000) push("description", "Description must be at most 2000 characters");

  const weeks = state.weeks || [];
  if (weeks.length < 1 || weeks.length > MAX_WEEKS) {
    push("weeks", `Block must have 1-${MAX_WEEKS} weeks`);
  }

  let totalSets = 0;
  weeks.forEach((week, wi) => {
    const label = String(week.label || "");
    if (label.length > 40) push(`weeks[${wi}].label`, "Week label must be at most 40 characters");

    const days = week.days || [];
    if (days.length < 1) {
      push(`weeks[${wi}].days`, `Week must have 1-${MAX_DAYS} days`);
    } else if (days.length > MAX_DAYS) {
      push(
        `weeks[${wi}].days`,
        `Week ${wi + 1} has ${days.length} days - a week holds at most ${MAX_DAYS}.`
      );
    }

    days.forEach((day, di) => {
      const dayName = String(day.name || "").trim();
      if (!dayName) push(`weeks[${wi}].days[${di}].name`, "Day name is required");
      else if (dayName.length > 60) {
        push(`weeks[${wi}].days[${di}].name`, "Day name must be at most 60 characters");
      }

      const exercises = day.exercises || [];
      if (exercises.length === 0) {
        const dayLabel = dayName || `Day ${di + 1}`;
        push(
          `weeks[${wi}].days[${di}]`,
          `Week ${wi + 1} · ${dayLabel} has no exercises`
        );
      }
      if (exercises.length > MAX_EXERCISES) {
        push(
          `weeks[${wi}].days[${di}].exercises`,
          `At most ${MAX_EXERCISES} exercises per day`
        );
      }

      exercises.forEach((ex, ei) => {
        const exPath = `weeks[${wi}].days[${di}].exercises[${ei}]`;
        const exName = String(ex.exerciseName || "").trim();
        if (!exName) push(`${exPath}.name`, "Every exercise needs a name");
        else if (exName.length > 120) push(`${exPath}.name`, "Exercise name must be at most 120 characters");

        const notes = String(ex.notes || "");
        if (notes.length > 1000) push(`${exPath}.notes`, "Notes must be at most 1000 characters");

        if (ex.restSec != null) {
          const r = Number(ex.restSec);
          if (!Number.isInteger(r) || r < 0 || r > 3600) {
            push(`${exPath}.restSec`, "Rest must be an integer 0-3600");
          }
        }

        const sets = ex.sets || [];
        if (sets.length < 1 || sets.length > MAX_SETS) {
          push(`${exPath}.sets`, `Exercise must have 1-${MAX_SETS} sets`);
        }
        totalSets += sets.length;

        sets.forEach((s, si) => {
          const sp = `${exPath}.sets[${si}]`;
          const reps = s.reps == null || s.reps === "" ? null : Number(s.reps);
          const repsMax = s.repsMax == null || s.repsMax === "" ? null : Number(s.repsMax);
          const durationSec =
            s.durationSec == null || s.durationSec === "" ? null : Number(s.durationSec);
          const weight = s.weight == null || s.weight === "" ? null : Number(s.weight);
          const rpe = s.rpe == null || s.rpe === "" ? null : Number(s.rpe);
          const rir = s.rir == null || s.rir === "" ? null : Number(s.rir);

          if (reps != null) {
            if (!Number.isFinite(reps) || !(reps > 0) || reps > 1000) {
              push(`${sp}.reps`, "Reps must be > 0 and at most 1000");
            }
          }
          if (repsMax != null) {
            if (reps == null) push(`${sp}.repsMax`, "repsMax requires reps");
            else if (!(repsMax > reps) || repsMax > 1000) {
              push(`${sp}.repsMax`, "repsMax must be greater than reps and at most 1000");
            }
          }
          if (durationSec != null) {
            if (!Number.isInteger(durationSec) || durationSec < 1 || durationSec > 3600) {
              push(`${sp}.durationSec`, "Duration must be an integer 1-3600");
            }
          }
          if (reps != null && durationSec != null) {
            push(sp, "A set cannot have both reps and duration");
          }
          if (weight != null) {
            if (!Number.isFinite(weight) || !(weight > 0) || weight > 2000) {
              push(`${sp}.weight`, "Weight must be > 0 and at most 2000 (omit for bodyweight)");
            }
          }
          if (rpe != null) {
            if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10 || (rpe * 2) % 1 !== 0) {
              push(`${sp}.rpe`, "RPE must be 1-10 in steps of 0.5");
            }
          }
          if (rir != null) {
            if (!Number.isInteger(rir) || rir < 0 || rir > 10) {
              push(`${sp}.rir`, "RIR must be an integer 0-10");
            }
          }
        });
      });
    });
  });

  if (totalSets > 5000) push("weeks", "At most 5000 sets in the whole block");

  return errors.length ? { ok: false, errors } : { ok: true };
}

function deepCloneWeek(week) {
  return {
    id: makeId(),
    label: week.label != null ? String(week.label) : "",
    days: (week.days || []).map(deepCloneDay),
  };
}

function deepCloneDay(day) {
  return {
    id: makeId(),
    name: day.name != null ? String(day.name) : "",
    exercises: (day.exercises || []).map(deepCloneExercise),
  };
}

function deepCloneExercise(ex) {
  return {
    id: makeId(),
    exerciseName: ex.exerciseName != null ? String(ex.exerciseName) : "",
    notes: ex.notes != null ? String(ex.notes) : "",
    restSec: ex.restSec != null ? Number(ex.restSec) : null,
    effortCap: Boolean(ex.effortCap),
    notInLibrary: Boolean(ex.notInLibrary),
    sets: (ex.sets || []).map((s) =>
      createEmptySet({
        reps: s.reps,
        repsMax: s.repsMax,
        durationSec: s.durationSec,
        weight: s.weight,
        rpe: s.rpe,
        rir: s.rir,
      })
    ),
  };
}

function updateWeekAt(state, weekIdx, updater) {
  const weeks = (state.weeks || []).map((w, i) => (i === weekIdx ? updater(w) : w));
  return { ...state, weeks };
}

function updateDayAt(state, weekIdx, dayIdx, updater) {
  return updateWeekAt(state, weekIdx, (week) => ({
    ...week,
    days: (week.days || []).map((d, i) => (i === dayIdx ? updater(d) : d)),
  }));
}

function updateExerciseAt(state, weekIdx, dayIdx, exIdx, updater) {
  return updateDayAt(state, weekIdx, dayIdx, (day) => ({
    ...day,
    exercises: (day.exercises || []).map((ex, i) => (i === exIdx ? updater(ex) : ex)),
  }));
}

/* ---------- meta ---------- */

export function setName(state, name) {
  return { ...state, name: String(name ?? "") };
}

export function setDescription(state, description) {
  return { ...state, description: String(description ?? "") };
}

export function setEffort(state, effort) {
  const next = effort === "rpe" || effort === "rir" ? effort : "none";
  return { ...state, effort: next };
}

export function setIsPublic(state, isPublic) {
  return { ...state, isPublic: Boolean(isPublic) };
}

export function clearDraftFlag(state) {
  return { ...state, isDraft: false, sourceUnit: null };
}

/* ---------- weeks ---------- */

/** Append a deep copy of the last week and select it (caller tracks selection). */
export function addWeekCopy(state) {
  const weeks = state.weeks || [];
  if (weeks.length >= MAX_WEEKS) return state;
  const last = weeks[weeks.length - 1] || createEmptyWeek();
  const copy = deepCloneWeek(last);
  // Copied week keeps structure but drops the label (new week is unlabeled)
  copy.label = "";
  return { ...state, weeks: [...weeks, copy] };
}

export function duplicateWeek(state, weekIdx) {
  const weeks = state.weeks || [];
  const src = weeks[weekIdx];
  if (!src || weeks.length >= MAX_WEEKS) return state;
  const copy = deepCloneWeek(src);
  const next = [...weeks];
  next.splice(weekIdx + 1, 0, copy);
  return { ...state, weeks: next };
}

export function setWeekLabel(state, weekIdx, label) {
  const trimmed = String(label ?? "").slice(0, 40);
  return updateWeekAt(state, weekIdx, (w) => ({ ...w, label: trimmed }));
}

export function moveWeek(state, weekIdx, direction) {
  const weeks = [...(state.weeks || [])];
  const target = weekIdx + direction;
  if (target < 0 || target >= weeks.length) return state;
  const tmp = weeks[weekIdx];
  weeks[weekIdx] = weeks[target];
  weeks[target] = tmp;
  return { ...state, weeks };
}

export function clearWeek(state, weekIdx) {
  return updateWeekAt(state, weekIdx, (w) => ({
    ...w,
    days: [createEmptyDay("Day 1")],
  }));
}

export function deleteWeek(state, weekIdx) {
  const weeks = state.weeks || [];
  if (weeks.length <= 1) return state;
  return { ...state, weeks: weeks.filter((_, i) => i !== weekIdx) };
}

/* ---------- days ---------- */

export function addDay(state, weekIdx) {
  return updateWeekAt(state, weekIdx, (week) => {
    const days = week.days || [];
    if (days.length >= MAX_DAYS) return week;
    const name = `Day ${days.length + 1}`;
    return { ...week, days: [...days, createEmptyDay(name)] };
  });
}

export function renameDay(state, weekIdx, dayIdx, name) {
  const trimmed = String(name ?? "").slice(0, 60);
  return updateDayAt(state, weekIdx, dayIdx, (d) => ({ ...d, name: trimmed }));
}

export function duplicateDay(state, weekIdx, dayIdx) {
  return updateWeekAt(state, weekIdx, (week) => {
    const days = [...(week.days || [])];
    if (days.length >= MAX_DAYS) return week;
    const src = days[dayIdx];
    if (!src) return week;
    days.splice(dayIdx + 1, 0, deepCloneDay(src));
    return { ...week, days };
  });
}

export function moveDay(state, weekIdx, dayIdx, direction) {
  return updateWeekAt(state, weekIdx, (week) => {
    const days = [...(week.days || [])];
    const target = dayIdx + direction;
    if (target < 0 || target >= days.length) return week;
    const tmp = days[dayIdx];
    days[dayIdx] = days[target];
    days[target] = tmp;
    return { ...week, days };
  });
}

export function deleteDay(state, weekIdx, dayIdx) {
  return updateWeekAt(state, weekIdx, (week) => {
    const days = week.days || [];
    if (days.length <= 1) return week;
    return { ...week, days: days.filter((_, i) => i !== dayIdx) };
  });
}

/**
 * Remove every day with zero exercises. Weeks left with no days are removed
 * too, except the last remaining week (kept as-is so the block never goes
 * weekless).
 */
export function removeEmptyDays(state) {
  const weeksIn = state.weeks || [];
  const next = [];
  for (const week of weeksIn) {
    const days = (week.days || []).filter((d) => (d.exercises || []).length > 0);
    if (days.length > 0) next.push({ ...week, days });
  }
  if (next.length === 0) {
    const last = weeksIn[weeksIn.length - 1] || createEmptyWeek();
    return { ...state, weeks: [last] };
  }
  return { ...state, weeks: next };
}

/** True when a week label names a deload (case-insensitive). */
export function isDeloadLabel(label) {
  return /deload/i.test(String(label || "").trim());
}

/* ---------- exercises ---------- */

export function addExercise(state, weekIdx, dayIdx, exercise) {
  return updateDayAt(state, weekIdx, dayIdx, (day) => {
    const exercises = day.exercises || [];
    if (exercises.length >= MAX_EXERCISES) return day;
    const ex = exercise || createEmptyExercise();
    return { ...day, exercises: [...exercises, ex] };
  });
}

export function updateExercise(state, weekIdx, dayIdx, exIdx, patch) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => ({ ...ex, ...patch }));
}

export function replaceExercise(state, weekIdx, dayIdx, exIdx, nextExercise) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, () => {
    const base = nextExercise || createEmptyExercise();
    return { ...base, id: makeId() };
  });
}

export function duplicateExercise(state, weekIdx, dayIdx, exIdx) {
  return updateDayAt(state, weekIdx, dayIdx, (day) => {
    const exercises = [...(day.exercises || [])];
    if (exercises.length >= MAX_EXERCISES) return day;
    const src = exercises[exIdx];
    if (!src) return day;
    exercises.splice(exIdx + 1, 0, deepCloneExercise(src));
    return { ...day, exercises };
  });
}

export function moveExercise(state, weekIdx, dayIdx, exIdx, direction) {
  return updateDayAt(state, weekIdx, dayIdx, (day) => {
    const exercises = [...(day.exercises || [])];
    const target = exIdx + direction;
    if (target < 0 || target >= exercises.length) return day;
    const tmp = exercises[exIdx];
    exercises[exIdx] = exercises[target];
    exercises[target] = tmp;
    return { ...day, exercises };
  });
}

export function deleteExercise(state, weekIdx, dayIdx, exIdx) {
  return updateDayAt(state, weekIdx, dayIdx, (day) => ({
    ...day,
    exercises: (day.exercises || []).filter((_, i) => i !== exIdx),
  }));
}

/* ---------- sets ---------- */

export function addSet(state, weekIdx, dayIdx, exIdx) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => {
    const sets = ex.sets || [];
    if (sets.length >= MAX_SETS) return ex;
    const last = sets[sets.length - 1];
    const next = last
      ? createEmptySet({
          reps: last.reps,
          repsMax: last.repsMax,
          durationSec: last.durationSec,
          weight: last.weight,
          rpe: last.rpe,
          rir: last.rir,
        })
      : createEmptySet({ reps: 8 });
    return { ...ex, sets: [...sets, next] };
  });
}

export function updateSet(state, weekIdx, dayIdx, exIdx, setIdx, patch) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => ({
    ...ex,
    sets: (ex.sets || []).map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
  }));
}

export function deleteSet(state, weekIdx, dayIdx, exIdx, setIdx) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => {
    const sets = ex.sets || [];
    if (sets.length <= 1) return ex;
    return { ...ex, sets: sets.filter((_, i) => i !== setIdx) };
  });
}

/** Copy set 1's fields onto every other set. */
export function fillAllFromSet1(state, weekIdx, dayIdx, exIdx) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => {
    const sets = ex.sets || [];
    if (!sets.length) return ex;
    const first = sets[0];
    return {
      ...ex,
      sets: sets.map((s, i) =>
        i === 0
          ? s
          : {
              ...s,
              reps: first.reps,
              repsMax: first.repsMax,
              durationSec: first.durationSec,
              weight: first.weight,
              rpe: first.rpe,
              rir: first.rir,
            }
      ),
    };
  });
}

/** Toggle reps <-> timed mode for an exercise's sets. */
export function toggleTimed(state, weekIdx, dayIdx, exIdx, timed) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => ({
    ...ex,
    sets: (ex.sets || []).map((s) => {
      if (timed) {
        const dur =
          s.durationSec != null && s.durationSec !== ""
            ? Number(s.durationSec)
            : 30;
        return { ...s, durationSec: dur, reps: null, repsMax: null };
      }
      const reps =
        s.reps != null && s.reps !== ""
          ? Number(s.reps)
          : s.durationSec != null
            ? 8
            : 8;
      return { ...s, reps, durationSec: null };
    }),
  }));
}

/** Enable/disable repsMax range on all sets (reps mode only). */
export function toggleRange(state, weekIdx, dayIdx, exIdx, enabled) {
  return updateExerciseAt(state, weekIdx, dayIdx, exIdx, (ex) => ({
    ...ex,
    sets: (ex.sets || []).map((s) => {
      if (!enabled) return { ...s, repsMax: null };
      if (s.repsMax != null) return s;
      const reps = s.reps != null && s.reps !== "" ? Number(s.reps) : null;
      if (reps == null) return s;
      return { ...s, repsMax: reps + 2 };
    }),
  }));
}

/**
 * Convert every weight in the draft from sourceUnit to targetUnit (nearest 0.5).
 * Clears sourceUnit afterward (conversion is a normal unsaved edit).
 */
export function convertUnits(state, targetUnit) {
  const from = state.sourceUnit;
  if (!from) return state;
  const to = normalizeUnit(targetUnit);
  if (normalizeUnit(from) === to) {
    return { ...state, sourceUnit: null };
  }

  const weeks = (state.weeks || []).map((week) => ({
    ...week,
    days: (week.days || []).map((day) => ({
      ...day,
      exercises: (day.exercises || []).map((ex) => ({
        ...ex,
        sets: (ex.sets || []).map((s) => {
          if (s.weight == null || s.weight === "") return s;
          const w = Number(s.weight);
          if (!Number.isFinite(w) || w <= 0) return s;
          return { ...s, weight: convertWeight(w, from, to) };
        }),
      })),
    })),
  }));

  return { ...state, weeks, sourceUnit: null };
}

/**
 * Copy week `fromWeek` (1-indexed) forward through `throughWeek`, replacing
 * weeks fromWeek+1..throughWeek with deep copies of the source week. Each
 * target keeps its own label; missing weeks are created (up to MAX_WEEKS).
 * Sets with a weight get `weight + loadStep * (targetWeek - fromWeek)`,
 * rounded to the nearest 0.5. By default, target weeks whose label contains
 * "deload" (case-insensitive) are left untouched; pass `overwriteDeload: true`
 * to overwrite them too. Callers may pass `unit` for UI labeling; it does not
 * affect the numbers (already in the device unit).
 *
 * @returns {{ state: object, error?: string }}
 */
export function copyForward(
  state,
  { fromWeek, throughWeek, loadStep, overwriteDeload = false } = {}
) {
  const step = Number(loadStep);
  if (!Number.isFinite(step) || step < 0) {
    return { state, error: "loadStep must be zero or positive" };
  }

  const from = Number(fromWeek);
  const through = Number(throughWeek);
  const weeksIn = state.weeks || [];

  if (!Number.isInteger(from) || from < 1 || from > weeksIn.length) {
    return { state, error: "fromWeek is out of range" };
  }
  if (!Number.isInteger(through) || through <= from) {
    return { state, error: "throughWeek must be greater than fromWeek" };
  }
  if (through > MAX_WEEKS) {
    return { state, error: `throughWeek must be at most ${MAX_WEEKS}` };
  }

  const src = weeksIn[from - 1];
  const weeks = weeksIn.map((w) => w);

  while (weeks.length < through) {
    weeks.push(createEmptyWeek());
  }

  for (let weekNum = from + 1; weekNum <= through; weekNum++) {
    const targetIdx = weekNum - 1;
    const keepLabel = weeks[targetIdx]?.label != null ? String(weeks[targetIdx].label) : "";
    if (!overwriteDeload && isDeloadLabel(keepLabel)) {
      continue;
    }
    const bump = step * (weekNum - from);
    const copy = applyWeightBump(deepCloneWeek(src), bump);
    copy.label = keepLabel;
    weeks[targetIdx] = copy;
  }

  return { state: { ...state, weeks } };
}

/** Apply a flat weight bump to every set that already has a positive weight. */
function applyWeightBump(week, bump) {
  if (!bump) return week;
  return {
    ...week,
    days: (week.days || []).map((day) => ({
      ...day,
      exercises: (day.exercises || []).map((ex) => ({
        ...ex,
        sets: (ex.sets || []).map((s) => {
          if (s.weight == null || s.weight === "") return s;
          const w = Number(s.weight);
          if (!Number.isFinite(w) || w <= 0) return s;
          return { ...s, weight: roundToHalf(w + bump) };
        }),
      })),
    })),
  };
}

/**
 * First representative weight on an exercise (set 1, else first positive).
 * @returns {number | null}
 */
export function firstExerciseWeight(exercise) {
  const sets = exercise?.sets || [];
  for (const s of sets) {
    if (s.weight == null || s.weight === "") continue;
    const w = Number(s.weight);
    if (Number.isFinite(w) && w > 0) return w;
  }
  return null;
}

/**
 * Live preview lines for a copy-forward: up to `limit` changed exercises,
 * e.g. "Week 2: Bench Press 185 → 190 lb".
 * @returns {string[]}
 */
export function previewCopyForward(
  state,
  { fromWeek, throughWeek, loadStep, unit, overwriteDeload = false } = {},
  limit = 3
) {
  const step = Number(loadStep);
  const from = Number(fromWeek);
  const through = Number(throughWeek);
  const u = normalizeUnit(unit);
  const lines = [];
  if (!Number.isFinite(step) || step < 0) return lines;
  if (!Number.isInteger(from) || !Number.isInteger(through) || through <= from) return lines;

  const src = state.weeks?.[from - 1];
  if (!src) return lines;

  for (let weekNum = from + 1; weekNum <= Math.min(through, MAX_WEEKS); weekNum++) {
    const targetLabel = state.weeks?.[weekNum - 1]?.label;
    if (!overwriteDeload && isDeloadLabel(targetLabel)) continue;
    const bump = step * (weekNum - from);
    for (const day of src.days || []) {
      for (const ex of day.exercises || []) {
        const fromW = firstExerciseWeight(ex);
        if (fromW == null) continue;
        const toW = roundToHalf(fromW + bump);
        const name = String(ex.exerciseName || "").trim() || "Exercise";
        lines.push(`Week ${weekNum}: ${name} ${fromW} → ${toW} ${u}`);
        if (lines.length >= limit) return lines;
      }
    }
  }
  return lines;
}

/**
 * Deload weeks in the copy-forward range that will be skipped by default.
 * @returns {{ weekNum: number, label: string }[]}
 */
export function skippedDeloadWeeks(state, { fromWeek, throughWeek } = {}) {
  const from = Number(fromWeek);
  const through = Number(throughWeek);
  const out = [];
  if (!Number.isInteger(from) || !Number.isInteger(through) || through <= from) return out;
  for (let weekNum = from + 1; weekNum <= Math.min(through, MAX_WEEKS); weekNum++) {
    const label = state.weeks?.[weekNum - 1]?.label;
    if (isDeloadLabel(label)) {
      out.push({ weekNum, label: String(label).trim() });
    }
  }
  return out;
}

/** Compact cell rx for progression view: `3×8 @185`, `3×45s`, or null if empty. */
export function compactExerciseRx(exercise, unit) {
  if (!exercise) return null;
  const sets = exercise.sets || [];
  if (!sets.length) return null;

  const summary = exerciseRxSummary(exercise, { unit });
  if (!summary.uniform || !summary.rx) {
    return summary.summary || null;
  }
  const rx = summary.rx;
  if (rx.durationSec != null) {
    const dur = formatDuration(rx.durationSec);
    return dur ? `${rx.sets}×${dur}` : null;
  }
  if (rx.reps == null) {
    if (rx.weight != null) return `${rx.sets}× @${rx.weight}`;
    return `${rx.sets}×`;
  }
  const dose =
    rx.repsMax != null && rx.repsMax !== rx.reps
      ? `${rx.sets}×${rx.reps}-${rx.repsMax}`
      : `${rx.sets}×${rx.reps}`;
  if (rx.weight != null) return `${dose} @${rx.weight}`;
  return dose;
}

/** Week has any named exercise (for delete confirm). */
export function weekHasExercises(week) {
  return (week?.days || []).some((d) => (d.exercises || []).some((ex) => String(ex.exerciseName || "").trim()));
}

/** Day has any exercises. */
export function dayHasExercises(day) {
  return (day?.exercises || []).length > 0;
}

/**
 * Build ExerciseRx props (or a non-uniform summary) from an exercise + effort scale.
 * @returns {{ uniform: boolean, rx?: object, summary?: string }}
 */
export function exerciseRxSummary(exercise, { effort, unit } = {}) {
  const sets = exercise?.sets || [];
  if (!sets.length) return { uniform: true, rx: { sets: 0 } };

  const timed = sets.every((s) => s.durationSec != null && s.durationSec !== "");
  const allReps = sets.every((s) => s.durationSec == null || s.durationSec === "");

  const first = sets[0];
  const same = (a, b) => {
    const na = a == null || a === "" ? null : Number(a);
    const nb = b == null || b === "" ? null : Number(b);
    return na === nb;
  };

  const uniform =
    sets.length > 0 &&
    sets.every(
      (s) =>
        same(s.reps, first.reps) &&
        same(s.repsMax, first.repsMax) &&
        same(s.durationSec, first.durationSec) &&
        same(s.weight, first.weight) &&
        same(s.rpe, first.rpe) &&
        same(s.rir, first.rir)
    );

  if (uniform) {
    const effortValue =
      effort === "rpe"
        ? first.rpe != null && first.rpe !== ""
          ? Number(first.rpe)
          : null
        : effort === "rir"
          ? first.rir != null && first.rir !== ""
            ? Number(first.rir)
            : null
          : null;
    return {
      uniform: true,
      rx: {
        sets: sets.length,
        reps: first.reps != null && first.reps !== "" ? Number(first.reps) : null,
        repsMax: first.repsMax != null && first.repsMax !== "" ? Number(first.repsMax) : null,
        durationSec:
          first.durationSec != null && first.durationSec !== ""
            ? Number(first.durationSec)
            : null,
        weight: first.weight != null && first.weight !== "" ? Number(first.weight) : null,
        unit: unit || null,
        effort: effort === "rpe" || effort === "rir" ? effort : null,
        effortValue,
        effortCap: Boolean(exercise.effortCap),
        restSec: exercise.restSec,
      },
    };
  }

  // Non-uniform: "4 sets · 5 → 8 · 225 → 185 lb"
  const parts = [`${sets.length} sets`];
  if (allReps) {
    const repsVals = sets
      .map((s) => (s.reps != null && s.reps !== "" ? Number(s.reps) : null))
      .filter((n) => n != null);
    if (repsVals.length) {
      const lo = Math.min(...repsVals);
      const hi = Math.max(...repsVals);
      parts.push(lo === hi ? String(lo) : `${lo} → ${hi}`);
    }
  } else if (timed) {
    const durs = sets
      .map((s) => (s.durationSec != null ? Number(s.durationSec) : null))
      .filter((n) => n != null);
    if (durs.length) {
      const lo = Math.min(...durs);
      const hi = Math.max(...durs);
      parts.push(lo === hi ? `${lo}s` : `${lo}s → ${hi}s`);
    }
  }
  const weights = sets
    .map((s) => (s.weight != null && s.weight !== "" ? Number(s.weight) : null))
    .filter((n) => n != null && n > 0);
  if (weights.length) {
    const lo = Math.min(...weights);
    const hi = Math.max(...weights);
    const u = unit || "lb";
    parts.push(lo === hi ? `${lo} ${u}` : `${hi} → ${lo} ${u}`);
  }
  return { uniform: false, summary: parts.join(" · ") };
}

/** Slot letter for exercise index: 0->A, 1->B, ... */
export function slotBadge(index) {
  if (index < 26) return String.fromCharCode(65 + index);
  return `A${index - 25}`;
}

/** Deep-clone helpers exported for BK5b. */
export {
  deepCloneWeek,
  deepCloneDay,
  deepCloneExercise,
  cloneJson,
  MAX_WEEKS,
  MAX_DAYS,
  MAX_EXERCISES,
  MAX_SETS,
};
