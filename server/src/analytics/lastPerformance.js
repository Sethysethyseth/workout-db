const { resolveExercise } = require("./resolve");
const { normalizeExerciseName } = require("./normalize");

/**
 * Last logged performance for the exercises in one session.
 *
 * Caller contract: `priorSessions` must already exclude the session being
 * logged. This function has no session id and will treat every session it
 * is given as history. The route handler omits the current session.
 *
 * Identity matches the analytics engine: `resolveExercise`, then the
 * `identityKeyOf` convention (catalog id, or `user:<id>` after user
 * exercises are stamped onto catalogEntry the way enrichSet does).
 * An unresolvable name falls back to `name:<normalizedName>`.
 *
 * The most recent prior session (by performedAt) that contains the key
 * wins. Sets come from the first matching exercise in that session, in
 * logged order. Only core-logged sets are kept: weight and reps both
 * present, or durationSec present. Older sessions are not used once that
 * exercise is found. A target with no core-logged history is omitted.
 *
 * @param {{ targets?: object[], priorSessions?: object[], userIndex?: Map }} input
 * @returns {{ sessionExerciseId: number, lastPerformedAt: string, sets: object[] }[]}
 */
function buildLastPerformance({ targets, priorSessions, userIndex } = {}) {
  const list = Array.isArray(targets) ? targets : [];
  const sessions = (Array.isArray(priorSessions) ? priorSessions : [])
    .filter((session) => performedMs(session) != null)
    .sort((a, b) => performedMs(b) - performedMs(a));

  const out = [];
  for (const target of list) {
    const key = identityKeyFor(target, userIndex);
    if (!key) continue;

    for (const session of sessions) {
      const match = firstExerciseWithKey(session, key, userIndex);
      if (!match) continue;
      const sets = coreLoggedSets(match);
      if (sets.length > 0) {
        out.push({
          sessionExerciseId: target.sessionExerciseId,
          lastPerformedAt: new Date(session.performedAt).toISOString(),
          sets,
        });
      }
      break;
    }
  }
  return out;
}

function identityKeyFor(input, userIndex) {
  let resolution = resolveExercise(
    {
      exerciseName: input?.exerciseName,
      exerciseId: input?.exerciseId,
      userExerciseId: input?.userExerciseId,
    },
    undefined,
    userIndex
  );

  if (
    resolution.resolved &&
    (resolution.source === "userExercise" || resolution.source === "userExerciseId") &&
    resolution.userExercise
  ) {
    resolution = {
      ...resolution,
      catalogEntry: {
        id: `user:${resolution.userExercise.id}`,
        name: resolution.userExercise.name,
      },
    };
  }

  // identityKeyOf: resolved catalog entry id, else no key.
  if (resolution.resolved && resolution.catalogEntry && resolution.catalogEntry.id) {
    return resolution.catalogEntry.id;
  }

  const normalized = normalizeExerciseName(input?.exerciseName);
  if (normalized) return `name:${normalized}`;
  return null;
}

function firstExerciseWithKey(session, key, userIndex) {
  const exercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const ordered = exercises
    .map((exercise, index) => ({ exercise, index }))
    .sort((a, b) => {
      const ao = Number.isFinite(Number(a.exercise?.order)) ? Number(a.exercise.order) : a.index;
      const bo = Number.isFinite(Number(b.exercise?.order)) ? Number(b.exercise.order) : b.index;
      return ao - bo;
    });
  for (const row of ordered) {
    if (identityKeyFor(row.exercise, userIndex) === key) return row.exercise;
  }
  return null;
}

function coreLoggedSets(exercise) {
  const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
  return sets
    .map((set, index) => ({ set, index }))
    .sort((a, b) => {
      const ao = Number.isFinite(Number(a.set?.order)) ? Number(a.set.order) : a.index;
      const bo = Number.isFinite(Number(b.set?.order)) ? Number(b.set.order) : b.index;
      return ao - bo;
    })
    .map((row) => row.set)
    .filter(isCoreLogged)
    .map((set) => ({
      side: set.side === "L" || set.side === "R" ? set.side : null,
      weight: asNumber(set.weight),
      reps: asNumber(set.reps),
      durationSec: asNumber(set.durationSec),
    }));
}

function isCoreLogged(set) {
  if (!set || typeof set !== "object") return false;
  if (asNumber(set.durationSec) != null) return true;
  return asNumber(set.weight) != null && asNumber(set.reps) != null;
}

function asNumber(value) {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function performedMs(session) {
  const t = new Date(session?.performedAt).getTime();
  return Number.isFinite(t) ? t : null;
}

module.exports = { buildLastPerformance };
