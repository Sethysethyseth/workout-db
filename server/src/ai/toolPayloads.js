/** Soft cap below Claude's ~150k tool-result character limit. */
const MAX_TOOL_PAYLOAD_CHARS = 120000;

const DEFAULT_MAX_EXERCISES = 40;

function estimatePayloadSize(obj) {
  return JSON.stringify(obj).length;
}

/**
 * Attach an honestyNotes entry without clobbering existing notes.
 * Works whether the payload already has meta.honestyNotes or not.
 */
function withHonestyNote(payload, note) {
  const base = payload && typeof payload === "object" ? payload : {};
  const meta =
    base.meta && typeof base.meta === "object" ? { ...base.meta } : {};
  const honestyNotes = Array.isArray(meta.honestyNotes)
    ? meta.honestyNotes.slice()
    : [];
  honestyNotes.push(note);
  return {
    ...base,
    meta: {
      ...meta,
      honestyNotes,
    },
  };
}

function exerciseRecencyMs(entry) {
  let ms = 0;
  const candidates = [];
  if (Array.isArray(entry.e1rmSeries)) {
    for (const point of entry.e1rmSeries) {
      if (point && point.performedAt != null) candidates.push(point.performedAt);
    }
  }
  if (Array.isArray(entry.topSetSeries)) {
    for (const point of entry.topSetSeries) {
      if (point && point.performedAt != null) candidates.push(point.performedAt);
    }
  }
  if (entry.bestSet && entry.bestSet.performedAt != null) {
    candidates.push(entry.bestSet.performedAt);
  }
  if (entry.topSet && entry.topSet.performedAt != null) {
    candidates.push(entry.topSet.performedAt);
  }
  for (const raw of candidates) {
    const t = new Date(raw).getTime();
    if (!Number.isNaN(t) && t > ms) ms = t;
  }
  return ms;
}

/**
 * Cap perExercise to the maxExercises most-recently-active entries.
 * Never drops meta, range, workoutCount, or balance.
 */
function trimSummaryForTool(summary, { maxExercises = DEFAULT_MAX_EXERCISES } = {}) {
  if (!summary || typeof summary !== "object") {
    return summary;
  }

  const perExercise = Array.isArray(summary.perExercise)
    ? summary.perExercise.slice()
    : [];

  if (perExercise.length <= maxExercises) {
    return { ...summary, perExercise };
  }

  const ranked = perExercise
    .map((entry, index) => ({ entry, index, recency: exerciseRecencyMs(entry) }))
    .sort((a, b) => {
      if (b.recency !== a.recency) return b.recency - a.recency;
      return a.index - b.index;
    });

  const kept = ranked.slice(0, maxExercises).map((r) => r.entry);
  const omitted = perExercise.length - kept.length;

  return {
    ...summary,
    perExercise: kept,
    truncation: {
      field: "perExercise",
      kept: kept.length,
      omitted,
      maxExercises,
      note: `perExercise capped to the ${kept.length} most recently active exercises; ${omitted} exercise(s) omitted.`,
    },
  };
}

function stripHeavySeries(summary) {
  const perExercise = Array.isArray(summary.perExercise)
    ? summary.perExercise.map((entry) => {
        const next = { ...entry };
        delete next.e1rmSeries;
        delete next.topSetSeries;
        return next;
      })
    : summary.perExercise;

  const perMuscle = Array.isArray(summary.perMuscle)
    ? summary.perMuscle.map((entry) => {
        const next = { ...entry };
        delete next.series;
        return next;
      })
    : summary.perMuscle;

  const prior = summary.truncation && typeof summary.truncation === "object"
    ? summary.truncation
    : {};

  return {
    ...summary,
    perExercise,
    perMuscle,
    truncation: {
      ...prior,
      seriesStripped: true,
      note: [
        prior.note,
        "Series arrays (e1rmSeries, topSetSeries, perMuscle.series) were stripped to fit the tool payload budget.",
      ]
        .filter(Boolean)
        .join(" "),
    },
  };
}

/**
 * Trim until under MAX_TOOL_PAYLOAD_CHARS. Never returns a known-over-limit
 * payload silently - truncation always records what happened.
 */
function fitSummaryForTool(summary, { maxExercises = DEFAULT_MAX_EXERCISES } = {}) {
  let current = trimSummaryForTool(summary, { maxExercises });
  let size = estimatePayloadSize(current);
  if (size <= MAX_TOOL_PAYLOAD_CHARS) {
    return current;
  }

  let cap = maxExercises;
  while (size > MAX_TOOL_PAYLOAD_CHARS && cap > 1) {
    cap = Math.max(1, Math.floor(cap / 2));
    current = trimSummaryForTool(summary, { maxExercises: cap });
    size = estimatePayloadSize(current);
  }

  if (size > MAX_TOOL_PAYLOAD_CHARS) {
    current = stripHeavySeries(current);
    size = estimatePayloadSize(current);
  }

  if (size > MAX_TOOL_PAYLOAD_CHARS) {
    // Last resort: drop perExercise entirely rather than return over-limit JSON.
    const prior =
      current.truncation && typeof current.truncation === "object"
        ? current.truncation
        : {};
    current = {
      ...current,
      perExercise: [],
      truncation: {
        ...prior,
        field: "perExercise",
        kept: 0,
        omitted: Array.isArray(summary.perExercise)
          ? summary.perExercise.length
          : 0,
        note: [
          prior.note,
          `Payload still exceeded ${MAX_TOOL_PAYLOAD_CHARS} characters after series stripping; perExercise cleared.`,
        ]
          .filter(Boolean)
          .join(" "),
      },
    };
  }

  return current;
}

module.exports = {
  MAX_TOOL_PAYLOAD_CHARS,
  DEFAULT_MAX_EXERCISES,
  estimatePayloadSize,
  withHonestyNote,
  trimSummaryForTool,
  fitSummaryForTool,
};
