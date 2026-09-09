/**
 * Deterministic suggested questions for the coach, derived from the summary
 * the analytics page already holds. Pure: same summary in, same chips out.
 * These are product copy - a chip is the first thing most people will ask.
 */

const STALE_DAYS = 14;
const LOW_COVERAGE = 0.6;
const MAX_SUGGESTIONS = 3;

const VIEW_QUESTIONS = {
  muscles: "Is my push and pull volume balanced?",
  strength: "Which lift is progressing fastest?",
  exercises: "Where should I add a set next week?",
  execution: "Am I sticking to my plan?",
};

export function buildSuggestedQuestions(summary, { view = "muscles" } = {}) {
  const out = [];
  const push = (q) => {
    if (q && !out.includes(q) && out.length < MAX_SUGGESTIONS) out.push(q);
  };

  const prs = Array.isArray(summary?.prs) ? summary.prs : [];
  if (prs.length > 0) {
    const latest = prs[prs.length - 1];
    if (latest?.exerciseName) push(`What drove my ${latest.exerciseName} PR?`);
  }

  const coverage = summary?.meta?.effortCoverage;
  if (coverage != null && coverage < LOW_COVERAGE) {
    push("How much does missing effort data hurt these numbers?");
  }

  const perMuscle = Array.isArray(summary?.perMuscle) ? summary.perMuscle : [];
  const stale = perMuscle
    .filter((m) => m.daysSinceLast >= STALE_DAYS && m.effectiveSets > 0)
    .sort((a, b) => b.effectiveSets - a.effectiveSets)[0];
  if (stale) push(`Why has ${stale.muscle} gone quiet?`);

  push(VIEW_QUESTIONS[view] || VIEW_QUESTIONS.muscles);
  push("What should I focus on next week?");
  push("Which lift is progressing fastest?");

  return out;
}
