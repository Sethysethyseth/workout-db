import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as analyticsApi from "../../api/analyticsApi.js";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { toDateOnlyString } from "../../lib/dateOnly.js";
import { pickTopGain } from "../../lib/topGain.js";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatEstimate } from "../../lib/weightDisplay.js";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weeklyReportWindows() {
  const today = new Date();
  return {
    current: {
      from: toDateOnlyString(addDays(today, -6)),
      to: toDateOnlyString(today),
    },
    prior: {
      from: toDateOnlyString(addDays(today, -13)),
      to: toDateOnlyString(addDays(today, -7)),
    },
  };
}

function windowBounds(fromStr, toStr) {
  return {
    fromMs: new Date(`${fromStr}T00:00:00`).getTime(),
    toMs: new Date(`${toStr}T23:59:59.999`).getTime(),
  };
}

function countWorkoutsInWindow(sessions, fromStr, toStr) {
  const { fromMs, toMs } = windowBounds(fromStr, toStr);
  return (Array.isArray(sessions) ? sessions : []).filter((s) => {
    if (!s?.completedAt) return false;
    const t = new Date(s.completedAt).getTime();
    return !Number.isNaN(t) && t >= fromMs && t <= toMs;
  }).length;
}

function hasSummaryData(summary) {
  if (!summary) return false;
  return (summary.perMuscle?.length ?? 0) > 0 || (summary.perExercise?.length ?? 0) > 0;
}

function sumEffectiveSets(summary) {
  return (summary?.perMuscle ?? []).reduce((sum, m) => sum + m.effectiveSets, 0);
}

function findBestLift(perExercise) {
  let best = null;
  for (const ex of perExercise ?? []) {
    const e1rm = ex.bestSet?.e1rm?.epley;
    if (e1rm != null && (!best || e1rm > best.e1rm)) {
      best = { e1rm, name: ex.name };
    }
  }
  return best;
}

function formatSetCount(n) {
  const rounded = Number(Number(n).toFixed(1));
  const s = rounded.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function formatCountDelta(current, prior, priorEmpty) {
  if (priorEmpty) return "first week tracked";
  const delta = current - prior;
  if (delta > 0) return `+${delta} vs last week`;
  if (delta < 0) return `${delta} vs last week`;
  return "same as last week";
}

function formatSetsDelta(current, prior, priorEmpty) {
  if (priorEmpty) return "first week tracked";
  const delta = current - prior;
  const rounded = Number(delta.toFixed(1));
  if (rounded > 0) return `+${formatSetCount(rounded)} vs last week`;
  if (rounded < 0) return `${formatSetCount(rounded)} vs last week`;
  return "same as last week";
}

function deltaTone(delta, priorEmpty) {
  if (priorEmpty || delta <= 0) return null;
  return "up";
}

function ReportStat({ label, value, delta, deltaTone: tone }) {
  return (
    <div className="weekly-report__stat">
      <span className="weekly-report__stat-label muted small">{label}</span>
      <span className={`weekly-report__stat-value${tone ? " weekly-report__stat-value--up" : ""}`}>
        {value}
      </span>
      {delta ? (
        <span
          className={`weekly-report__stat-delta muted small${tone ? " weekly-report__stat-delta--up" : ""}`}
        >
          {delta}
        </span>
      ) : null}
    </div>
  );
}

export function WeeklyReport() {
  const { sessions } = useActiveSession();
  const windows = useMemo(() => weeklyReportWindows(), []);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [priorSummary, setPriorSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchFailed(false);
      try {
        const [current, prior] = await Promise.all([
          analyticsApi.getSummary(windows.current),
          analyticsApi.getSummary(windows.prior),
        ]);
        if (!cancelled) {
          setCurrentSummary(current);
          setPriorSummary(prior);
        }
      } catch (err) {
        console.error("WeeklyReport: failed to load summaries", err);
        if (!cancelled) {
          setCurrentSummary(null);
          setPriorSummary(null);
          setFetchFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [windows]);

  if (loading || fetchFailed) return null;

  const currentWorkouts = countWorkoutsInWindow(
    sessions,
    windows.current.from,
    windows.current.to
  );
  const priorWorkouts = countWorkoutsInWindow(sessions, windows.prior.from, windows.prior.to);
  const currentHasData = currentWorkouts > 0 || hasSummaryData(currentSummary);
  const priorHasData = priorWorkouts > 0 || hasSummaryData(priorSummary);

  if (!currentHasData && !priorHasData) return null;

  const priorEmpty = !priorHasData;

  if (!currentHasData && priorHasData) {
    return (
      <section className="card weekly-report" aria-labelledby="weekly-report-heading">
        <div className="weekly-report__head row">
          <h2 id="weekly-report-heading" className="weekly-report__title">
            This week
          </h2>
          <Link className="weekly-report__link" to="/analytics">
            See analytics →
          </Link>
        </div>
        <p className="weekly-report__nudge muted small">
          No workouts yet this week - last week you logged {priorWorkouts}.
        </p>
      </section>
    );
  }

  const currentSets = sumEffectiveSets(currentSummary);
  const priorSets = sumEffectiveSets(priorSummary);
  const bestLift = findBestLift(currentSummary?.perExercise);
  const topGain = pickTopGain(currentSummary?.perExercise ?? []);

  const workoutDelta = formatCountDelta(currentWorkouts, priorWorkouts, priorEmpty);
  const setsDelta = formatSetsDelta(currentSets, priorSets, priorEmpty);
  const setsDeltaValue = priorEmpty ? null : Number((currentSets - priorSets).toFixed(1));

  return (
    <section className="card weekly-report" aria-labelledby="weekly-report-heading">
      <div className="weekly-report__head row">
        <h2 id="weekly-report-heading" className="weekly-report__title">
          This week
        </h2>
        <Link className="weekly-report__link" to="/analytics">
          See analytics →
        </Link>
      </div>
      <div className="weekly-report__stats">
        <ReportStat
          label="Workouts"
          value={String(currentWorkouts)}
          delta={workoutDelta}
          deltaTone={deltaTone(currentWorkouts - priorWorkouts, priorEmpty)}
        />
        <ReportStat
          label="Sets"
          value={formatSetCount(currentSets)}
          delta={setsDelta}
          deltaTone={deltaTone(setsDeltaValue ?? 0, priorEmpty)}
        />
        <ReportStat
          label="Best lift"
          value={bestLift ? formatEstimate(bestLift.e1rm) : "—"}
          delta={bestLift ? bestLift.name : "not enough data"}
          deltaTone={null}
        />
        <ReportStat
          label="Top gain"
          value={topGain ? `+${formatEstimate(topGain.delta)}` : "—"}
          delta={
            topGain
              ? topGain.matched
                ? `${topGain.name} @ ${formatEffort({ rir: topGain.matched.rir, effortUnit: topGain.matched.effortUnit })}`
                : `${topGain.name} e1RM`
              : "not enough data"
          }
          deltaTone={topGain ? "up" : null}
        />
      </div>
    </section>
  );
}
