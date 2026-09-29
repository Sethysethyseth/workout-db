/**
 * Strong / Hevy history CSV -> block draft (or null).
 * Spec: docs/specs/blocks-v2.md section 5.
 */

const { normalizeHeaderKey } = require("./parseDelimited");

const STRONG_REQUIRED = [
  "date",
  "workoutname",
  "exercisename",
  "setorder",
  "weight",
  "reps",
  "seconds",
  "rpe",
];
// Older Strong variants: Weight (kg) / Weight (lbs) normalize to weightkg / weightlbs

const HEVY_REQUIRED = [
  "title",
  "starttime",
  "exercisetitle",
  "setindex",
  "settype",
  "reps",
  "durationseconds",
  "rpe",
];

/**
 * @param {{ header: string[], rows: string[][], rowNumbers: number[] }} parsed
 * @param {{ historyWeeks?: number, sourceUnit?: "lb"|"kg" }} [options]
 * @returns {null | { block: object, warnings: object[], notices: object }}
 */
function historyToBlock(parsed, options = {}) {
  const { header, rows, rowNumbers } = parsed;
  const keys = header.map(normalizeHeaderKey);
  const app = detectApp(keys);
  if (!app) return null;

  const warnings = [];
  const col = indexMap(keys);
  const historyWeeks = clampInt(options.historyWeeks, 1, 12, 4);

  let unit;
  if (app === "hevy") {
    if (col.weightkg != null) unit = "kg";
    else if (col.weightlbs != null) unit = "lb";
    else unit = options.sourceUnit || "lb";
  } else {
    // Strong
    if (col.weightkg != null) unit = "kg";
    else if (col.weightlbs != null || col.weightlb != null) unit = "lb";
    else unit = options.sourceUnit || "lb";
  }

  // Parse sessions
  const sessions = new Map(); // key -> { date, title, exercises: Map }
  let newest = null;
  let cardioSkipped = false;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = rowNumbers[i];

    let dateStr;
    let title;
    let exerciseName;
    let setOrder;
    let setType;
    let weight;
    let reps;
    let seconds;
    let rpe;

    if (app === "strong") {
      dateStr = cell(row, col.date);
      title = cell(row, col.workoutname).trim();
      exerciseName = cell(row, col.exercisename).trim();
      setOrder = cell(row, col.setorder).trim();
      weight = parseNum(
        cell(
          row,
          col.weight ?? col.weightkg ?? col.weightlbs ?? col.weightlb
        )
      );
      reps = parseNum(cell(row, col.reps));
      seconds = parseNum(cell(row, col.seconds));
      rpe = parseNum(cell(row, col.rpe));
      if (setOrder.toUpperCase() === "W") continue; // warm-up
    } else {
      dateStr = cell(row, col.starttime);
      title = cell(row, col.title).trim();
      exerciseName = cell(row, col.exercisetitle).trim();
      setOrder = cell(row, col.setindex).trim();
      setType = cell(row, col.settype).trim().toLowerCase();
      weight = parseNum(
        cell(row, col.weightkg ?? col.weightlbs ?? col.weight_lbs ?? col.weight)
      );
      reps = parseNum(cell(row, col.reps));
      seconds = parseNum(cell(row, col.durationseconds));
      rpe = parseNum(cell(row, col.rpe));
      if (setType === "warmup") continue;
    }

    if (!title || !exerciseName) continue;

    const date = parseDate(dateStr);
    if (!date) {
      warnings.push({ row: rowNum, message: `Couldn't parse date '${dateStr}'` });
      continue;
    }
    if (!newest || date > newest) newest = date;

    // Distance-only: no reps and no positive seconds — skip as cardio
    const hasReps = reps != null && reps > 0;
    const hasSeconds = seconds != null && seconds > 0;
    if (!hasReps && !hasSeconds) {
      cardioSkipped = true;
      continue;
    }

    const sessionKey = `${title}||${date.toISOString()}`;
    if (!sessions.has(sessionKey)) {
      sessions.set(sessionKey, {
        date,
        title,
        exerciseOrder: [],
        exercises: new Map(),
      });
    }
    const session = sessions.get(sessionKey);
    if (!session.exercises.has(exerciseName)) {
      session.exercises.set(exerciseName, []);
      session.exerciseOrder.push(exerciseName);
    }

    const setObj = {};
    if (hasReps) setObj.reps = reps;
    else if (hasSeconds) setObj.durationSec = Math.round(seconds);
    if (weight != null && weight > 0) setObj.weight = weight;
    if (rpe != null && rpe >= 1 && rpe <= 10) setObj.rpe = rpe;
    session.exercises.get(exerciseName).push(setObj);
  }

  if (cardioSkipped) {
    warnings.push({ message: "cardio rows were skipped" });
  }

  if (!newest || sessions.size === 0) {
    return {
      block: emptyHistoryBlock(app, unit),
      warnings,
      notices: {
        app: app === "strong" ? "Strong" : "Hevy",
        windowStart: null,
        windowEnd: null,
        sessionsUsed: 0,
      },
    };
  }

  const windowEnd = newest;
  const windowStart = new Date(newest.getTime() - 56 * 24 * 60 * 60 * 1000);

  // Filter to window; pick most recent session per title
  const byTitle = new Map(); // title -> session
  for (const session of sessions.values()) {
    if (session.date < windowStart || session.date > windowEnd) continue;
    const prev = byTitle.get(session.title);
    if (!prev || session.date > prev.date) {
      byTitle.set(session.title, session);
    }
  }

  // Days ordered by that session's date (oldest first)
  const daySessions = [...byTitle.values()].sort(
    (a, b) => a.date - b.date || a.title.localeCompare(b.title)
  );

  const days = daySessions.map((session) => ({
    name: session.title,
    exercises: session.exerciseOrder.map((name) => {
      const sets = session.exercises.get(name) || [];
      const ex = { name, sets };
      return ex;
    }),
  }));

  // Drop days with no exercises
  const usableDays = days.filter((d) => d.exercises.length > 0);

  const weekTemplate = { days: usableDays };
  const weeks = [];
  for (let i = 0; i < historyWeeks; i += 1) {
    weeks.push(JSON.parse(JSON.stringify(weekTemplate)));
  }

  const fmt = (d) => d.toISOString().slice(0, 10);
  const appLabel = app === "strong" ? "Strong" : "Hevy";
  const name = `From ${appLabel} ${fmt(windowStart)}–${fmt(windowEnd)}`;

  let effort = "none";
  for (const day of usableDays) {
    for (const ex of day.exercises) {
      for (const s of ex.sets) {
        if (s.rpe != null) effort = "rpe";
      }
    }
  }

  const block = {
    format: "logchamp.block",
    version: 1,
    name,
    unit,
    effort,
    weeks,
  };

  return {
    block,
    warnings,
    notices: {
      app: appLabel,
      windowStart: fmt(windowStart),
      windowEnd: fmt(windowEnd),
      sessionsUsed: daySessions.length,
    },
  };
}

function emptyHistoryBlock(app, unit) {
  return {
    format: "logchamp.block",
    version: 1,
    name: `From ${app === "strong" ? "Strong" : "Hevy"}`,
    unit,
    effort: "none",
    weeks: [{ days: [] }],
  };
}

function detectApp(keys) {
  const set = new Set(keys);
  // Strong: Date, Workout Name, Exercise Name, Set Order, Weight (or Weight kg/lbs), Reps, Seconds, RPE
  const strongWeight =
    set.has("weight") ||
    set.has("weightkg") ||
    set.has("weightlbs") ||
    set.has("weightlb");
  const isStrong =
    set.has("date") &&
    set.has("workoutname") &&
    set.has("exercisename") &&
    set.has("setorder") &&
    strongWeight &&
    set.has("reps") &&
    set.has("seconds") &&
    set.has("rpe");
  if (isStrong) return "strong";

  const hevyWeight = set.has("weightkg") || set.has("weightlbs");
  const isHevy =
    set.has("title") &&
    set.has("starttime") &&
    set.has("exercisetitle") &&
    set.has("setindex") &&
    set.has("settype") &&
    hevyWeight &&
    set.has("reps") &&
    set.has("durationseconds") &&
    set.has("rpe");
  if (isHevy) return "hevy";

  return null;
}

function indexMap(keys) {
  const map = {};
  keys.forEach((k, i) => {
    if (k && map[k] == null) map[k] = i;
  });
  return map;
}

function cell(row, index) {
  if (index == null) return "";
  return row[index] != null ? String(row[index]) : "";
}

function parseNum(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  // Strong often: YYYY-MM-DD HH:MM:SS or similar
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function clampInt(v, min, max, fallback) {
  if (v == null) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

module.exports = {
  historyToBlock,
};
