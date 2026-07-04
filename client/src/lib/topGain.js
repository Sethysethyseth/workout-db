export function pickTopGain(perExercise) {
  let top = null;
  for (const ex of perExercise) {
    const matched = ex.matchedEffortTrend;
    const candidate =
      matched && matched.delta > 0
        ? { delta: matched.delta, name: ex.name, matched, honest: true }
        : ex.e1rmTrend && ex.e1rmTrend.delta > 0
          ? { delta: ex.e1rmTrend.delta, name: ex.name, matched: null, honest: false }
          : null;
    if (!candidate) continue;
    // Matched-effort gains outrank raw-trend gains regardless of size.
    if (
      !top ||
      (candidate.honest && !top.honest) ||
      (candidate.honest === top.honest && candidate.delta > top.delta)
    ) {
      top = candidate;
    }
  }
  return top;
}
