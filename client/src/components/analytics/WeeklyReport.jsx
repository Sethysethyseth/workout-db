import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as analyticsApi from "../../api/analyticsApi.js";
import { localDayRange } from "../../lib/dateRange.js";
import { pickTopGain } from "../../lib/topGain.js";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { formatEstimate, formatWeight } from "../../lib/weightDisplay.js";
import { buildExecutionVerdict } from "../../lib/executionVerdict.js";

/** Current + prior 7 local-day windows as ISO datetimes (end-of-local-day). */
export function weeklyReportWindows(now = new Date()) {
  const priorEnd = new Date(now);
  priorEnd.setDate(priorEnd.getDate() - 7);
  return {
    current: localDayRange(7, now),
    prior: localDayRange(7, priorEnd),
  };
}

function hasSummaryData(summary) {
  if (!summary) return false;
  return (summary.perMuscle?.length ?? 0) > 0 || (summary.perExercise?.length ?? 0) > 0;
}

const WEEKLY_MODE_KEY = "workoutdb-weekly-mode";

function readWeeklyMode() {
  try {
    return sessionStorage.getItem(WEEKLY_MODE_KEY) === "full" ? "full" : "compact";
  } catch {
    return "compact";
  }
}

function writeWeeklyMode(mode) {
  try {
    sessionStorage.setItem(WEEKLY_MODE_KEY, mode);
  } catch {
    /* private mode */
  }
}

function sumEffectiveSets(summary) {
  return (summary?.perMuscle ?? []).reduce((sum, m) => sum + m.effectiveSets, 0);
}

function pickTopSet(perExercise) {
  let top = null;
  for (const ex of perExercise ?? []) {
    const ts = ex.topSet;
    if (!ts || ts.weight == null) continue;
    if (
      !top ||
      ts.weight > top.weight ||
      (ts.weight === top.weight && (ts.reps ?? 0) > (top.reps ?? 0))
    ) {
      top = { weight: ts.weight, reps: ts.reps, name: ex.name };
    }
  }
  return top;
}

function formatSetCount(n) {
  const rounded = Number(Number(n).toFixed(1));
  const s = rounded.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function formatCountDelta(current, prior, priorEmpty) {
  if (priorEmpty) return "first 7 days tracked";
  const delta = current - prior;
  if (delta > 0) return `+${delta} vs the 7 days before`;
  if (delta < 0) return `${delta} vs the 7 days before`;
  return "same as the 7 days before";
}

function formatSetsDelta(current, prior, priorEmpty) {
  if (priorEmpty) return "first 7 days tracked";
  const delta = current - prior;
  const rounded = Number(delta.toFixed(1));
  if (rounded > 0) return `+${formatSetCount(rounded)} vs the 7 days before`;
  if (rounded < 0) return `${formatSetCount(rounded)} vs the 7 days before`;
  return "same as the 7 days before";
}

function deltaTone(delta, priorEmpty) {
  if (priorEmpty || delta <= 0) return null;
  return "up";
}

function computeMuscleMovers(currentPerMuscle, priorPerMuscle) {
  if (!currentPerMuscle || !priorPerMuscle) return [];
  const priorMap = new Map(priorPerMuscle.map((m) => [m.muscle, m.effectiveSets]));
  const deltas = currentPerMuscle
    .map((m) => ({
      muscle: m.muscle,
      delta: m.effectiveSets - (priorMap.get(m.muscle) ?? 0),
    }))
    .filter((m) => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  return deltas;
}

function formatMoverDelta(delta) {
  const sign = delta > 0 ? "+" : "";
  const rounded = Number(Number(delta).toFixed(1));
  const s = rounded.toFixed(1);
  const num = s.endsWith(".0") ? s.slice(0, -2) : s;
  return `${sign}${num}`;
}

function formatMoversLine(movers) {
  if (movers.length === 0) return null;
  return movers.map((m) => `${m.muscle} ${formatMoverDelta(m.delta)} sets`).join(" - ");
}

function groupPRsByExercise(prs) {
  if (!prs || prs.length === 0) return { groups: [], overflow: 0 };
  const shown = prs.slice(0, 3);
  const overflow = prs.length > 3 ? prs.length - 3 : 0;
  const grouped = new Map();
  for (const pr of shown) {
    const name = pr.exerciseName;
    if (!grouped.has(name)) {
      grouped.set(name, []);
    }
    grouped.get(name).push(pr);
  }
  const groups = Array.from(grouped.entries()).map(([name, items]) => ({
    exerciseName: name,
    achievements: items.map((pr) => {
      if (pr.type === "e1rmPR") {
        return { text: `e1RM ${formatEstimate(pr.value)}`, isE1rm: true };
      }
      return { text: `${formatWeight(pr.weight)} × ${formatRepsValue(pr.reps)}`, isE1rm: false };
    }),
  }));
  return { groups, overflow };
}

function computeOverallExecutionVerdict(execution) {
  if (!execution || execution.length === 0) return null;
  const withData = execution.filter(
    (ex) => ex.loadAdherence !== null || ex.volumeAdherence !== null || ex.effortDrift !== null
  );
  if (withData.length === 0) return null;
  const avgLoad =
    withData.filter((ex) => ex.loadAdherence !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.loadAdherence ?? 0), 0) /
        withData.filter((ex) => ex.loadAdherence !== null).length
      : null;
  const avgVolume =
    withData.filter((ex) => ex.volumeAdherence !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.volumeAdherence ?? 0), 0) /
        withData.filter((ex) => ex.volumeAdherence !== null).length
      : null;
  const avgEffort =
    withData.filter((ex) => ex.effortDrift !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.effortDrift ?? 0), 0) /
        withData.filter((ex) => ex.effortDrift !== null).length
      : null;
  return buildExecutionVerdict({
    loadAdherence: avgLoad,
    volumeAdherence: avgVolume,
    effortDrift: avgEffort,
  });
}

function computeNudgeLine(currentSummary, priorSummary) {
  const effortCoverage = currentSummary?.meta?.effortCoverage;
  if (effortCoverage !== null && effortCoverage < 0.6) {
    return "Logging RIR or RPE unlocks better volume insights.";
  }
  const currentSets = sumEffectiveSets(currentSummary);
  const priorSets = sumEffectiveSets(priorSummary);
  if (priorSets > 0 && currentSets < priorSets * 0.8) {
    return "Volume is down from the 7 days before.";
  }
  const currentPerMuscle = currentSummary?.perMuscle ?? [];
  const priorPerMuscle = priorSummary?.perMuscle ?? [];
  for (const pm of priorPerMuscle) {
    if (pm.effectiveSets >= 3) {
      const currentMuscle = currentPerMuscle.find((m) => m.muscle === pm.muscle);
      if (!currentMuscle || currentMuscle.effectiveSets === 0) {
        return `${pm.muscle} went quiet in the last 7 days.`;
      }
    }
  }
  return null;
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

function PRRows({ prs }) {
  const { groups, overflow } = groupPRsByExercise(prs);
  if (groups.length === 0) return null;

  return (
    <div className="weekly-report__prs">
      {groups.map((group) => (
        <div key={group.exerciseName} className="weekly-report__pr-row">
          <span className="session-set-pr-chip" title="Personal record">PR</span>
          <span className="weekly-report__pr-achievements">
            {group.achievements.map((a, i) => (
              <span key={i} className="weekly-report__pr-achievement">{a.text}</span>
            ))}
          </span>
          <span className="weekly-report__pr-exercise">{group.exerciseName}</span>
        </div>
      ))}
      {overflow > 0 ? (
        <p className="weekly-report__pr-overflow muted small">+{overflow} more</p>
      ) : null}
    </div>
  );
}

function DigestSection({ currentSummary, priorSummary, priorEmpty }) {
  const movers = priorEmpty
    ? []
    : computeMuscleMovers(currentSummary?.perMuscle, priorSummary?.perMuscle);
  const moversLine = formatMoversLine(movers);
  const prs = currentSummary?.prs ?? [];
  const hasPRs = prs.length > 0;
  const executionVerdict = computeOverallExecutionVerdict(currentSummary?.execution);
  const nudgeLine = computeNudgeLine(currentSummary, priorSummary);

  if (!moversLine && !hasPRs && !executionVerdict && !nudgeLine) {
    return null;
  }

  return (
    <div className="weekly-report__digest">
      <PRRows prs={prs} />
      {moversLine ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Movers</span>
          {moversLine}
        </p>
      ) : null}
      {executionVerdict ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Execution</span>
          {executionVerdict}.
        </p>
      ) : null}
      {nudgeLine ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Note</span>
          {nudgeLine}
        </p>
      ) : null}
    </div>
  );
}

export function WeeklyReport({ weekStrip = null }) {
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

  if (loading) {
    const withStrip = Boolean(weekStrip);
    const compact = readWeeklyMode() === "compact";
    return (
      <section
        className={
          "card weekly-report weekly-report--skel" +
          (withStrip ? " weekly-report--skel-with-strip" : " weekly-report--skel-no-strip") +
          (compact ? " weekly-report--skel-compact" : "")
        }
        aria-busy="true"
        aria-label="Loading last 7 days"
      >
        <div className="skeleton weekly-report__skel">
          <div className="skeleton__title" />
          {withStrip ? <div className="weekly-report__skel-strip" aria-hidden="true" /> : null}
          {compact ? (
            <div className="skeleton__block skeleton__block--short" />
          ) : (
            <>
              <div className="skeleton__tiles">
                <div className="skeleton__tile" />
                <div className="skeleton__tile" />
                <div className="skeleton__tile" />
                <div className="skeleton__tile" />
              </div>
              <div className="skeleton__block skeleton__block--short" />
            </>
          )}
        </div>
      </section>
    );
  }

  if (fetchFailed) return null;

  const currentWorkouts = currentSummary?.workoutCount ?? 0;
  const priorWorkouts = priorSummary?.workoutCount ?? 0;
  const currentHasData = currentWorkouts > 0 || hasSummaryData(currentSummary);
  const priorHasData = priorWorkouts > 0 || hasSummaryData(priorSummary);

  if (!currentHasData && !priorHasData) return null;

  const priorEmpty = !priorHasData;

  if (!currentHasData && priorHasData) {
    writeWeeklyMode("compact");
    return (
      <section className="card weekly-report" aria-labelledby="weekly-report-heading">
        <div className="weekly-report__head row">
          <h2 id="weekly-report-heading" className="weekly-report__title">
            Last 7 days
          </h2>
          <Link className="weekly-report__link" to="/analytics">
            See analytics →
          </Link>
        </div>
        {weekStrip ? <div className="weekly-report__strip">{weekStrip}</div> : null}
        <p className="weekly-report__nudge muted small">
          No workouts yet in the last 7 days - the 7 days before you logged {priorWorkouts}.
        </p>
      </section>
    );
  }

  const currentSets = sumEffectiveSets(currentSummary);
  const priorSets = sumEffectiveSets(priorSummary);
  const topSet = pickTopSet(currentSummary?.perExercise);
  const topGain = pickTopGain(currentSummary?.perExercise ?? []);

  writeWeeklyMode("full");

  const workoutDelta = formatCountDelta(currentWorkouts, priorWorkouts, priorEmpty);
  const setsDelta = formatSetsDelta(currentSets, priorSets, priorEmpty);
  const setsDeltaValue = priorEmpty ? null : Number((currentSets - priorSets).toFixed(1));

  return (
    <section className="card weekly-report" aria-labelledby="weekly-report-heading">
      <div className="weekly-report__head row">
        <h2 id="weekly-report-heading" className="weekly-report__title">
          Last 7 days
        </h2>
        <Link className="weekly-report__link" to="/analytics">
          See analytics →
        </Link>
      </div>
      {weekStrip ? <div className="weekly-report__strip">{weekStrip}</div> : null}
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
          label="Top set"
          value={
            topSet
              ? topSet.reps != null
                ? `${formatWeight(topSet.weight)} × ${formatRepsValue(topSet.reps)}`
                : formatWeight(topSet.weight)
              : "-"
          }
          delta={topSet ? topSet.name : "not enough data"}
          deltaTone={null}
        />
        <ReportStat
          label="Top gain"
          value={topGain ? `+${formatEstimate(topGain.delta)}` : "-"}
          delta={
            topGain
              ? topGain.matched
                ? `${topGain.name} @ ${formatEffort({ rir: topGain.matched.rir, effortUnit: topGain.matched.effortUnit })}`
                : `${topGain.name} · estimated 1RM`
              : "not enough data"
          }
          deltaTone={topGain ? "up" : null}
        />
      </div>
      <DigestSection
        currentSummary={currentSummary}
        priorSummary={priorSummary}
        priorEmpty={priorEmpty}
      />
    </section>
  );
}
