/**
 * Deterministic mock coach for local dev, staging without a key, and the
 * unit lane. It narrates the SAME compacted summary the real model would
 * see, so the whole UI/stream path can be exercised end to end at zero
 * cost. Every answer is prefixed so it can never be mistaken for the model.
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "n/a";
  const rounded = Math.round(Number(n) * 10) / 10;
  return String(rounded);
}

function buildMockNarrative({ primary, context, question, unit, focus }) {
  const lines = [];
  const isDebrief = Boolean(focus && focus.type === "session");
  lines.push(
    "**Mock coach** - no model key is configured on this server, so this is a canned read of the same numbers the coach would get."
  );
  const s = primary || {};
  const range = s.range || {};
  const exerciseCount = Array.isArray(s.perExercise) ? s.perExercise.length : 0;
  const muscleCount = Array.isArray(s.perMuscle) ? s.perMuscle.length : 0;
  if (isDebrief) {
    lines.push(
      `This workout on ${range.to ?? "that day"}: ${fmt(s.workoutCount)} session logged across ${exerciseCount} exercises.`
    );
  } else {
    lines.push(
      `Window ${range.from ?? "?"} to ${range.to ?? "?"} (${range.weeks ?? "?"} weeks): ${fmt(s.workoutCount)} workouts, ${muscleCount} muscles trained.`
    );
  }
  const topMuscle = (s.perMuscle || [])
    .slice()
    .sort((a, b) => (b.effectiveSetsPerWeek ?? 0) - (a.effectiveSetsPerWeek ?? 0))[0];
  if (topMuscle) {
    lines.push(
      `Most volume went to ${topMuscle.muscle} at ${fmt(topMuscle.effectiveSetsPerWeek)} effective sets per week.`
    );
  }
  const prs = Array.isArray(s.prs) ? s.prs : [];
  if (prs.length > 0) {
    const pr = prs[prs.length - 1];
    lines.push(
      `Latest PR: ${pr.exerciseName} ${pr.type} at ${fmt(pr.weight)} ${unit} x ${fmt(pr.reps)}.`
    );
  }
  const coverage = s.meta ? s.meta.effortCoverage : null;
  if (coverage == null) {
    lines.push(
      "Effort coverage is unknown for this window, so effort-weighted numbers are not available."
    );
  } else if (coverage < 0.6) {
    lines.push(
      `Effort was logged on ${Math.round(coverage * 100)}% of sets, so stimulating sets and matched-effort trends are a weak read here.`
    );
  } else {
    lines.push(
      `Effort was logged on ${Math.round(coverage * 100)}% of sets, which is enough to trust the effort-weighted numbers.`
    );
  }
  if (context && context.workoutCount != null) {
    lines.push(`For context, the trailing four weeks hold ${fmt(context.workoutCount)} workouts.`);
  }
  lines.push(`You asked: "${question}". Add COACH_API_KEY on the server to get a real answer.`);
  return lines.join("\n\n");
}

async function* streamMock(args) {
  const text = buildMockNarrative(args);
  yield { type: "start", model: "mock", usage: null };
  const words = text.split(/(\s+)/);
  let chunk = "";
  for (const w of words) {
    chunk += w;
    if (chunk.length >= 14) {
      yield { type: "text", text: chunk };
      chunk = "";
      if (!args.noDelay) await sleep(35);
    }
  }
  if (chunk) yield { type: "text", text: chunk };
  yield { type: "stop", stopReason: "end_turn", usage: null };
}

module.exports = { streamMock, buildMockNarrative };
