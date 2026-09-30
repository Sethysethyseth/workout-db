/**
 * Split preview exercise-match rows into library matches vs unmatched,
 * preserving input order in each bucket.
 *
 * @param {Array<{ name?: string, resolved?: boolean, matchedName?: string|null }>|null|undefined} exercises
 * @returns {{ matched: typeof exercises, unmatched: typeof exercises }}
 */
export function splitMatchedExercises(exercises) {
  const matched = [];
  const unmatched = [];
  const list = Array.isArray(exercises) ? exercises : [];
  for (const ex of list) {
    if (ex?.resolved) matched.push(ex);
    else unmatched.push(ex);
  }
  return { matched, unmatched };
}
