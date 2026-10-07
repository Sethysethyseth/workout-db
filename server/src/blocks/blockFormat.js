/**
 * LogChamp Block Format v1 — validator (pure).
 * Spec: docs/specs/blocks-v2.md sections 3.1–3.2.
 */

const FORMAT_ID = "logchamp.block";
const FORMAT_VERSION = 1;
const KG_TO_LB = 2.20462;
const MAX_ERRORS = 50;
const MAX_TOTAL_SETS = 5000;
/** Hard cap: a week holds at most this many days. Shared by Format v1, AI schema, save path. */
const MAX_DAYS_PER_WEEK = 7;

const KNOWN_TOP = new Set([
  "format",
  "version",
  "name",
  "description",
  "unit",
  "effort",
  "weeks",
]);
const KNOWN_WEEK = new Set(["label", "days"]);
const KNOWN_DAY = new Set(["name", "exercises"]);
const KNOWN_EXERCISE = new Set([
  "name",
  "notes",
  "restSec",
  "effortCap",
  "perSide",
  "sets",
  // shorthand set fields (only valid when sets is an integer)
  "reps",
  "repsMax",
  "durationSec",
  "weight",
  "rpe",
  "rir",
]);
const KNOWN_SET = new Set([
  "reps",
  "repsMax",
  "durationSec",
  "weight",
  "rpe",
  "rir",
]);
const SHORTHAND_SET_FIELDS = [
  "reps",
  "repsMax",
  "durationSec",
  "weight",
  "rpe",
  "rir",
];

function roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

function convertWeight(weight, fromUnit, toUnit) {
  if (fromUnit === toUnit || fromUnit == null || toUnit == null) {
    return weight;
  }
  if (fromUnit === "kg" && toUnit === "lb") {
    return roundToHalf(weight * KG_TO_LB);
  }
  if (fromUnit === "lb" && toUnit === "kg") {
    return roundToHalf(weight / KG_TO_LB);
  }
  return weight;
}

function isHalfStep(n) {
  return Number.isFinite(n) && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

/**
 * @param {unknown} input
 * @param {{ targetUnit?: "lb" | "kg" }} [options]
 * @returns {{ ok: true, block: object, stats: object } | { ok: false, errors: { path: string, message: string }[] }}
 */
function validateBlockDraft(input, options = {}) {
  const targetUnit = options.targetUnit;
  const errors = [];

  function pushError(path, message) {
    if (errors.length < MAX_ERRORS) {
      errors.push({ path, message });
    }
  }

  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    pushError("", "Block must be a JSON object");
    return { ok: false, errors };
  }

  // Detect unknown keys at top level first (still collect other errors)
  for (const key of Object.keys(input)) {
    if (!KNOWN_TOP.has(key)) {
      pushError(key, `unknown field - put it in notes`);
    }
  }

  if (input.format !== FORMAT_ID) {
    pushError("format", `must be exactly "${FORMAT_ID}"`);
  }
  if (input.version !== FORMAT_VERSION) {
    pushError("version", `must be exactly ${FORMAT_VERSION}`);
  }

  let name = null;
  if (typeof input.name !== "string") {
    pushError("name", "required string, 1-120 characters");
  } else {
    name = input.name.trim();
    if (name.length < 1 || name.length > 120) {
      pushError("name", "required string, 1-120 characters");
    }
  }

  let description;
  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      pushError("description", "must be a string up to 2000 characters");
    } else if (input.description.length > 2000) {
      pushError("description", "must be a string up to 2000 characters");
    } else {
      description = input.description;
    }
  }

  let sourceUnit;
  if (input.unit !== undefined) {
    if (input.unit !== "lb" && input.unit !== "kg") {
      pushError("unit", 'must be "lb" or "kg"');
    } else {
      sourceUnit = input.unit;
    }
  }

  let declaredEffort;
  if (input.effort !== undefined) {
    if (
      input.effort !== "rpe" &&
      input.effort !== "rir" &&
      input.effort !== "none"
    ) {
      pushError("effort", 'must be "rpe", "rir", or "none"');
    } else {
      declaredEffort = input.effort;
    }
  }

  if (!Array.isArray(input.weeks)) {
    pushError("weeks", "required array of 1-52 weeks");
  } else if (input.weeks.length < 1 || input.weeks.length > 52) {
    pushError("weeks", "required array of 1-52 weeks");
  }

  const outWeeks = [];
  let totalSets = 0;
  let timedSets = 0;
  let dayCount = 0;
  let exerciseCount = 0;
  let sawRpe = false;
  let sawRir = false;

  const weeks = Array.isArray(input.weeks) ? input.weeks : [];

  for (let wi = 0; wi < weeks.length; wi += 1) {
    const weekPath = `weeks[${wi}]`;
    const week = weeks[wi];
    if (week == null || typeof week !== "object" || Array.isArray(week)) {
      pushError(weekPath, "must be an object");
      continue;
    }
    for (const key of Object.keys(week)) {
      if (!KNOWN_WEEK.has(key)) {
        pushError(`${weekPath}.${key}`, `unknown field - put it in notes`);
      }
    }

    let label;
    if (week.label !== undefined) {
      if (typeof week.label !== "string" || week.label.length > 40) {
        pushError(`${weekPath}.label`, "optional string, max 40 characters");
      } else {
        label = week.label;
      }
    }

    if (!Array.isArray(week.days)) {
      pushError(
        `${weekPath}.days`,
        `required array of 1-${MAX_DAYS_PER_WEEK} days`
      );
      continue;
    }
    if (week.days.length < 1) {
      pushError(
        `${weekPath}.days`,
        `required array of 1-${MAX_DAYS_PER_WEEK} days`
      );
    } else if (week.days.length > MAX_DAYS_PER_WEEK) {
      pushError(
        `${weekPath}.days`,
        `Week ${wi + 1} has ${week.days.length} days - a week holds at most ${MAX_DAYS_PER_WEEK}.`
      );
    }

    const outDays = [];
    for (let di = 0; di < week.days.length; di += 1) {
      const dayPath = `${weekPath}.days[${di}]`;
      const day = week.days[di];
      if (day == null || typeof day !== "object" || Array.isArray(day)) {
        pushError(dayPath, "must be an object");
        continue;
      }
      for (const key of Object.keys(day)) {
        if (!KNOWN_DAY.has(key)) {
          pushError(`${dayPath}.${key}`, `unknown field - put it in notes`);
        }
      }

      let dayName = null;
      if (typeof day.name !== "string") {
        pushError(`${dayPath}.name`, "required string, 1-60 characters");
      } else {
        dayName = day.name.trim();
        if (dayName.length < 1 || dayName.length > 60) {
          pushError(`${dayPath}.name`, "required string, 1-60 characters");
        }
      }

      if (!Array.isArray(day.exercises)) {
        pushError(`${dayPath}.exercises`, "required array of 1-40 exercises");
        continue;
      }
      if (day.exercises.length < 1 || day.exercises.length > 40) {
        pushError(`${dayPath}.exercises`, "required array of 1-40 exercises");
      }

      const outExercises = [];
      for (let ei = 0; ei < day.exercises.length; ei += 1) {
        const exPath = `${dayPath}.exercises[${ei}]`;
        const ex = day.exercises[ei];
        if (ex == null || typeof ex !== "object" || Array.isArray(ex)) {
          pushError(exPath, "must be an object");
          continue;
        }
        for (const key of Object.keys(ex)) {
          if (!KNOWN_EXERCISE.has(key)) {
            pushError(`${exPath}.${key}`, `unknown field - put it in notes`);
          }
        }

        let exName = null;
        if (typeof ex.name !== "string") {
          pushError(`${exPath}.name`, "required string, 1-120 characters");
        } else {
          exName = ex.name.trim();
          if (exName.length < 1 || exName.length > 120) {
            pushError(`${exPath}.name`, "required string, 1-120 characters");
          }
        }

        let notes;
        if (ex.notes !== undefined) {
          if (typeof ex.notes !== "string" || ex.notes.length > 1000) {
            pushError(`${exPath}.notes`, "optional string, max 1000 characters");
          } else {
            notes = ex.notes;
          }
        }

        let restSec;
        if (ex.restSec !== undefined) {
          if (
            !Number.isInteger(ex.restSec) ||
            ex.restSec < 0 ||
            ex.restSec > 3600
          ) {
            pushError(`${exPath}.restSec`, "optional integer 0-3600");
          } else {
            restSec = ex.restSec;
          }
        }

        let effortCap = false;
        if (ex.effortCap !== undefined) {
          if (typeof ex.effortCap !== "boolean") {
            pushError(`${exPath}.effortCap`, "optional boolean");
          } else {
            effortCap = ex.effortCap;
          }
        }

        let perSide;
        if (ex.perSide !== undefined) {
          if (typeof ex.perSide !== "boolean") {
            pushError(`${exPath}.perSide`, "optional boolean");
          } else {
            perSide = ex.perSide;
          }
        }

        const setsVal = ex.sets;
        let setObjects = null;
        const isShorthand = typeof setsVal === "number";
        const isArrayForm = Array.isArray(setsVal);

        if (isShorthand) {
          if (
            !Number.isInteger(setsVal) ||
            setsVal < 1 ||
            setsVal > 20
          ) {
            pushError(
              `${exPath}.sets`,
              "must be an integer 1-20 or an array of 1-20 set objects"
            );
          } else {
            // Validate shorthand fields as one template set, then expand
            const template = {};
            for (const f of SHORTHAND_SET_FIELDS) {
              if (ex[f] !== undefined) template[f] = ex[f];
            }
            const validated = validateSetObject(
              template,
              `${exPath}`,
              pushError,
              { allowUnknown: false, knownKeys: KNOWN_SET }
            );
            // Also reject unknown keys already handled; check exclusivity via validateSetObject
            if (validated) {
              setObjects = [];
              for (let s = 0; s < setsVal; s += 1) {
                setObjects.push({ ...validated });
              }
            }
          }
        } else if (isArrayForm) {
          if (setsVal.length < 1 || setsVal.length > 20) {
            pushError(
              `${exPath}.sets`,
              "must be an integer 1-20 or an array of 1-20 set objects"
            );
          }
          // Set fields on the exercise are an error in list form
          for (const f of SHORTHAND_SET_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(ex, f)) {
              pushError(
                `${exPath}.${f}`,
                "set fields belong inside each set in the list form"
              );
            }
          }
          setObjects = [];
          for (let si = 0; si < setsVal.length; si += 1) {
            const rawSet = setsVal[si];
            const setPath = `${exPath}.sets[${si}]`;
            if (
              rawSet == null ||
              typeof rawSet !== "object" ||
              Array.isArray(rawSet)
            ) {
              pushError(setPath, "must be an object");
              continue;
            }
            for (const key of Object.keys(rawSet)) {
              if (!KNOWN_SET.has(key)) {
                pushError(
                  `${setPath}.${key}`,
                  `unknown field - put it in notes`
                );
              }
            }
            const validated = validateSetObject(rawSet, setPath, pushError, {
              allowUnknown: true,
            });
            if (validated) setObjects.push(validated);
          }
        } else {
          pushError(
            `${exPath}.sets`,
            "must be an integer 1-20 or an array of 1-20 set objects"
          );
        }

        if (setObjects) {
          for (const s of setObjects) {
            if (s.rpe != null) sawRpe = true;
            if (s.rir != null) sawRir = true;
            if (s.durationSec != null) timedSets += 1;
          }
          totalSets += setObjects.length;

          // Convert weights
          const fromUnit = sourceUnit;
          const toUnit = targetUnit || sourceUnit;
          const converted = setObjects.map((s) => {
            const out = { ...s };
            if (out.weight != null && fromUnit && toUnit && fromUnit !== toUnit) {
              out.weight = convertWeight(out.weight, fromUnit, toUnit);
            } else if (out.weight != null) {
              out.weight = roundToHalf(out.weight) === out.weight
                ? out.weight
                : out.weight;
            }
            return out;
          });

          const outEx = { name: exName, sets: converted };
          if (notes !== undefined) outEx.notes = notes;
          if (restSec !== undefined) outEx.restSec = restSec;
          if (effortCap) outEx.effortCap = true;
          if (perSide !== undefined) outEx.perSide = perSide;
          outExercises.push(outEx);
          exerciseCount += 1;
        }
      }

      if (dayName != null && outExercises.length > 0) {
        outDays.push({ name: dayName, exercises: outExercises });
        dayCount += 1;
      } else if (dayName != null) {
        // Still count structure if we have a name but failed sets - only push when we have exercises for ok path
        outDays.push({ name: dayName, exercises: outExercises });
        dayCount += 1;
      }
    }

    const outWeek = { days: outDays };
    if (label !== undefined) outWeek.label = label;
    outWeeks.push(outWeek);
  }

  if (totalSets > MAX_TOTAL_SETS) {
    pushError("weeks", `at most ${MAX_TOTAL_SETS} sets in the whole block`);
  }

  if (sawRpe && sawRir) {
    pushError("effort", "pick one - a block cannot mix RPE and RIR");
  }

  let resolvedEffort;
  if (declaredEffort !== undefined) {
    if (declaredEffort === "rpe" && sawRir) {
      pushError("effort", 'declared "rpe" but sets use RIR');
    } else if (declaredEffort === "rir" && sawRpe) {
      pushError("effort", 'declared "rir" but sets use RPE');
    } else if (declaredEffort === "none" && (sawRpe || sawRir)) {
      pushError("effort", 'declared "none" but sets carry effort values');
    } else if (declaredEffort === "rpe" && !sawRpe && !sawRir) {
      // allowed: declared rpe with no values yet
      resolvedEffort = "rpe";
    } else {
      resolvedEffort = declaredEffort;
    }
  } else if (sawRpe) {
    resolvedEffort = "rpe";
  } else if (sawRir) {
    resolvedEffort = "rir";
  } else {
    resolvedEffort = "none";
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const outUnit = targetUnit || sourceUnit;
  const block = {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    name,
    effort: resolvedEffort,
    weeks: outWeeks,
  };
  if (description !== undefined) block.description = description;
  if (outUnit) block.unit = outUnit;

  // Ensure effortCap defaults are explicit only when true was set; false can stay omit or include
  // Normalize: include effortCap only when true was present, otherwise omit false for cleanliness
  // Spec says default false - either is fine for deep-equal round trip if mapping is consistent.
  // Keep effortCap when it was set on the exercise (including false).
  for (const week of block.weeks) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        if (ex.effortCap === undefined) {
          // leave unset (default false)
        }
      }
    }
  }

  const stats = {
    weeks: block.weeks.length,
    days: dayCount,
    exercises: exerciseCount,
    sets: totalSets,
    timedSets,
  };

  return { ok: true, block, stats };
}

/**
 * Validate one set object; returns normalized set or null if fatal.
 * Does not push unknown-key errors when allowUnknown is true (caller did).
 */
function validateSetObject(raw, path, pushError, { allowUnknown }) {
  // When path is exercise path (shorthand), field paths are `${path}.reps` etc.
  // When path is set path, same.
  const p = (field) => `${path}.${field}`;

  let reps;
  let repsMax;
  let durationSec;
  let weight;
  let rpe;
  let rir;

  if (raw.reps !== undefined) {
    if (
      typeof raw.reps !== "number" ||
      !Number.isFinite(raw.reps) ||
      raw.reps <= 0 ||
      raw.reps > 1000
    ) {
      pushError(p("reps"), "optional number > 0, max 1000");
    } else {
      reps = raw.reps;
    }
  }

  if (raw.repsMax !== undefined) {
    if (
      typeof raw.repsMax !== "number" ||
      !Number.isFinite(raw.repsMax) ||
      raw.repsMax > 1000
    ) {
      pushError(p("repsMax"), "optional number > reps, max 1000");
    } else if (reps == null) {
      pushError(p("repsMax"), "requires reps");
    } else if (!(raw.repsMax > reps)) {
      pushError(p("repsMax"), "must be greater than reps");
    } else {
      repsMax = raw.repsMax;
    }
  }

  if (raw.durationSec !== undefined) {
    if (
      !Number.isInteger(raw.durationSec) ||
      raw.durationSec < 1 ||
      raw.durationSec > 3600
    ) {
      pushError(p("durationSec"), "optional integer 1-3600");
    } else {
      durationSec = raw.durationSec;
    }
  }

  if (reps != null && durationSec != null) {
    // Array-form set path already ends `.sets[n]`; shorthand uses the exercise path.
    pushError(path, "reps and durationSec cannot both be set");
  }

  if (raw.weight !== undefined) {
    if (raw.weight === 0) {
      pushError(p("weight"), "omit weight for bodyweight - never 0");
    } else if (
      typeof raw.weight !== "number" ||
      !Number.isFinite(raw.weight) ||
      raw.weight <= 0 ||
      raw.weight > 2000
    ) {
      pushError(p("weight"), "optional number > 0, max 2000");
    } else {
      weight = raw.weight;
    }
  }

  if (raw.rpe !== undefined) {
    if (
      typeof raw.rpe !== "number" ||
      !Number.isFinite(raw.rpe) ||
      raw.rpe < 1 ||
      raw.rpe > 10 ||
      !isHalfStep(raw.rpe)
    ) {
      pushError(p("rpe"), "optional number 1-10 in steps of 0.5");
    } else {
      rpe = raw.rpe;
    }
  }

  if (raw.rir !== undefined) {
    if (
      !Number.isInteger(raw.rir) ||
      raw.rir < 0 ||
      raw.rir > 10
    ) {
      pushError(p("rir"), "optional integer 0-10");
    } else {
      rir = raw.rir;
    }
  }

  if (rpe != null && rir != null) {
    pushError(path, "use RPE or RIR, not both");
  }

  const out = {};
  if (reps != null) out.reps = reps;
  if (repsMax != null) out.repsMax = repsMax;
  if (durationSec != null) out.durationSec = durationSec;
  if (weight != null) out.weight = weight;
  if (rpe != null) out.rpe = rpe;
  if (rir != null) out.rir = rir;
  return out;
}

module.exports = {
  validateBlockDraft,
  FORMAT_ID,
  FORMAT_VERSION,
  MAX_DAYS_PER_WEEK,
  KG_TO_LB,
  convertWeight,
  roundToHalf,
};
