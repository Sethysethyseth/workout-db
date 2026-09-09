/**
 * Prompt assembly for the in-app coach (ai-layer.md section 5, under the
 * section 2 boundary): the model receives the COMPUTED summary object plus a
 * question and returns narrative. It never sees a raw set and never computes
 * a stat. Pure functions only - no env, no Prisma - so the unit lane can
 * load and fixture-test them.
 */

const { fitSummaryForTool } = require("../ai/toolPayloads");

/** Hard ceiling on the serialized data block, in characters. */
const MAX_DATA_CHARS = 60000;
const COACH_MAX_EXERCISES = 30;

const COACH_PERSONA = [
  "You are the LogChamp coach. You explain a lifter's own training numbers in plain, direct language, the way a good strength coach talks between sets.",
  "",
  "What you have: JSON computed by LogChamp's deterministic analytics engine for the lifter's selected window. Every number in it is already final.",
  "",
  "Rules that never bend:",
  "- Quote the numbers; never recalculate, extrapolate, average, or invent them. If something is not in the data, say it is not tracked here.",
  "- Coverage is part of the truth. meta.effortCoverage is the share of sets logged with RIR or RPE. Below 0.6, say plainly that effort-weighted numbers (stimulating sets, matched-effort trends, execution effort drift) are a weak read, and why. Repeat any honestyNotes that change the answer.",
  "- Lead with the answer. Two to four short paragraphs, or a short list of bullets. Sentence case. No headings, no tables, no emoji. Bold at most one phrase, using **double asterisks**.",
  "- Coach, do not lecture. Be specific to what the data shows, and suggest at most one concrete next step.",
  "- No medical advice. For pain or injury, say to see a professional and stop there.",
  "- If the question needs data you do not have (nutrition, another person, medical history), say so in one sentence and offer what you can answer instead.",
  "",
  "Glossary the lifter already sees in the app:",
  "- Effective sets: each set counts toward a muscle by its fractional attribution (a bench set is mostly chest, partly triceps and shoulders). Counted with or without effort data.",
  "- Stimulating sets: effective sets weighted by how close to failure they were (RIR, or RPE read as 10 minus RPE). Sets without RIR or RPE are excluded.",
  "- e1RM: estimated one-rep max (Epley). Matched-effort trend: e1RM compared only across sets taken at the same RIR, so progress shows without maxing out.",
  "- Execution: planned vs logged for template sets. Load = actual weight over planned; Volume = sets done over sets planned; effort drift = actual RIR minus planned (positive means the lifter stopped earlier than planned).",
  "- Balance ratios use effective sets over muscle groups; 0.8 to 1.25 is the rough balanced zone, not a prescription.",
  "- Per-week figures are averages over the window. Weights are in the unit stated below and are never converted.",
].join("\n");

const VIEW_DESCRIPTIONS = {
  muscles: "weekly volume by muscle, plus balance ratios",
  strength: "top-set and matched-effort trends per exercise",
  exercises: "the per-exercise detail roster",
  execution: "planned vs logged for template sets",
};

function dateOnly(iso) {
  if (typeof iso !== "string") return iso ?? null;
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function endpoints(series, pick) {
  if (!Array.isArray(series) || series.length === 0) return null;
  return {
    first: pick(series[0]),
    last: pick(series[series.length - 1]),
    points: series.length,
  };
}

function compactExercise(entry) {
  const topSetSeries = Array.isArray(entry.topSetSeries) ? entry.topSetSeries : [];
  const e1rmSeries = Array.isArray(entry.e1rmSeries) ? entry.e1rmSeries : [];
  const out = {
    name: entry.name,
    sessionsInRange: topSetSeries.length,
  };
  if (entry.exerciseId != null) out.exerciseId = entry.exerciseId;
  if (entry.userExerciseId != null) out.userExerciseId = entry.userExerciseId;
  if (entry.topSet) {
    out.topSet = {
      weight: entry.topSet.weight,
      reps: entry.topSet.reps ?? null,
      performedAt: dateOnly(entry.topSet.performedAt),
    };
  }
  out.topSetTrend = endpoints(topSetSeries, (p) => ({
    weight: p.weight,
    reps: p.reps ?? null,
    performedAt: dateOnly(p.performedAt),
  }));
  out.e1rmTrend = endpoints(e1rmSeries, (p) => ({
    epley: p.epley,
    performedAt: dateOnly(p.performedAt),
  }));
  if (entry.bestSet) {
    out.bestSet = {
      weight: entry.bestSet.weight,
      reps: entry.bestSet.reps ?? null,
      rir: entry.bestSet.rir ?? null,
      rpe: entry.bestSet.rpe ?? null,
      performedAt: dateOnly(entry.bestSet.performedAt),
      e1rmEpley: entry.bestSet.e1rm ? entry.bestSet.e1rm.epley ?? null : null,
    };
  }
  out.matchedEffortTrend = entry.matchedEffortTrend ?? null;
  return out;
}

function compactMuscle(row) {
  return {
    muscle: row.muscle,
    effectiveSetsPerWeek: row.effectiveSets,
    stimulatingSetsPerWeek: row.stimulatingSets,
    sessionsPerWeek: row.frequency,
    daysSinceLast: row.daysSinceLast,
    series: Array.isArray(row.series)
      ? row.series.map((p) => ({
          periodEnd: dateOnly(p.periodEnd),
          effectiveSets: p.effectiveSets,
          stimulatingSets: p.stimulatingSets,
        }))
      : [],
  };
}

function compactPR(pr) {
  return {
    type: pr.type,
    exerciseName: pr.exerciseName,
    value: pr.value,
    weight: pr.weight,
    reps: pr.reps,
    performedAt: dateOnly(pr.performedAt),
  };
}

/**
 * Summary -> the object the model reads. Series collapse to endpoints, sets
 * never appear, and the honesty metadata always travels with the numbers.
 */
function compactSummaryForCoach(summary) {
  if (!summary || typeof summary !== "object") return null;
  const fitted = fitSummaryForTool(summary, { maxExercises: COACH_MAX_EXERCISES });
  let compact = {
    range: fitted.range
      ? {
          from: dateOnly(fitted.range.from),
          to: dateOnly(fitted.range.to),
          weeks: fitted.range.weeks,
        }
      : null,
    workoutCount: fitted.workoutCount ?? 0,
    perMuscle: (fitted.perMuscle ?? []).map(compactMuscle),
    perExercise: (fitted.perExercise ?? []).map(compactExercise),
    prs: (fitted.prs ?? []).map(compactPR),
    balance: fitted.balance ?? null,
    execution: Array.isArray(fitted.execution) ? fitted.execution : [],
    meta: fitted.meta ?? { effortCoverage: null, honestyNotes: [] },
  };
  if (fitted.truncation) compact.truncation = fitted.truncation;

  if (JSON.stringify(compact).length > MAX_DATA_CHARS) {
    compact = {
      ...compact,
      perMuscle: compact.perMuscle.map((m) => {
        const next = { ...m };
        delete next.series;
        return next;
      }),
      truncation: {
        ...(compact.truncation ?? {}),
        seriesStripped: true,
        note: "Per-period muscle series were dropped to fit the coach's data budget.",
      },
    };
  }
  return compact;
}

function describeFocus(focus, { weeks, fromLabel, toLabel } = {}) {
  if (!focus) return null;
  if (focus.type === "view") {
    const what = VIEW_DESCRIPTIONS[focus.view] ?? focus.view;
    const span = weeks ? `${weeks} week${weeks === 1 ? "" : "s"}` : "the selected range";
    const dates = fromLabel && toLabel ? ` (${fromLabel} to ${toLabel})` : "";
    return `The lifter is on the Analytics page, ${focus.view} view, which shows ${what}, over ${span}${dates}.`;
  }
  if (focus.type === "session") {
    return [
      "Debrief mode. The first data block is ONE workout, the one the lifter just opened; the second block is the trailing four weeks ending that day, for context.",
      "Cover briefly: what stood out in this workout, any PRs (prs in the first block were set in this workout), execution vs plan if present, how complete the effort data was, and one thing to carry into the next session. Do not restate every exercise.",
    ].join(" ");
  }
  return null;
}

/**
 * System blocks in prefix-stable order: persona (static) -> data (stable per
 * range, carries the ONE cache breakpoint) -> volatile framing (date, unit,
 * focus). Anything that changes per request stays after the breakpoint.
 */
function buildCoachSystemBlocks({
  primary,
  context = null,
  unit,
  focus,
  today,
  weeks,
  fromLabel,
  toLabel,
}) {
  const dataParts = [];
  if (focus && focus.type === "session") {
    dataParts.push(
      `Workout being debriefed (JSON, computed by LogChamp's engine):\n${JSON.stringify(primary)}`
    );
    if (context) {
      dataParts.push(
        `Trailing four weeks ending that day, for context (JSON):\n${JSON.stringify(context)}`
      );
    }
  } else {
    dataParts.push(
      `Training data for the lifter's selected window (JSON, computed by LogChamp's engine):\n${JSON.stringify(primary)}`
    );
  }

  const framing = [
    `Today is ${today}.`,
    `Weights are in ${unit}.`,
    describeFocus(focus, { weeks, fromLabel, toLabel }),
  ].filter(Boolean);

  return [
    { type: "text", text: COACH_PERSONA },
    { type: "text", text: dataParts.join("\n\n"), cache_control: { type: "ephemeral" } },
    { type: "text", text: framing.join(" ") },
  ];
}

function buildCoachMessages({ history = [], question }) {
  return [...history, { role: "user", content: question }];
}

module.exports = {
  COACH_PERSONA,
  MAX_DATA_CHARS,
  COACH_MAX_EXERCISES,
  compactSummaryForCoach,
  describeFocus,
  buildCoachSystemBlocks,
  buildCoachMessages,
};
