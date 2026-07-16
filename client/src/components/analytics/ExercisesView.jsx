import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as analyticsApi from "../../api/analyticsApi.js";
import { ErrorMessage } from "../ErrorMessage.jsx";
import { LoadingState } from "../LoadingState.jsx";
import { HowCalculatedButton } from "./HowCalculatedButton.jsx";
import { niceScale } from "../../lib/chartScale.js";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { formatEstimate, formatWeight, roundToPlate } from "../../lib/weightDisplay.js";

const HOW_REP_TARGETS =
  "Working weights for common rep targets, inverted from your best estimated 1RM (Epley). Plate-rounded to what you can actually load. Targets outside your logged rep range are less reliable.";
const HOW_MATCHED_EFFORT =
  "Compares your estimated 1RM only across sets you took at the same RIR (RPE counts too: RIR = 10 − RPE), so progress shows up even when you never max out. Uses the RIR you log most often for this exercise; needs 2 or more sessions at the same RIR.";
const HOW_E1RM_HISTORY =
  "Each point is your best estimated 1RM for that session (Epley), using the heaviest comparable set you logged that day.";

/** URL param: catalog id as-is, user exercises as `user:<id>`. */
export function serializeExerciseParam(identity) {
  if (!identity) return null;
  if (identity.userExerciseId != null) return `user:${identity.userExerciseId}`;
  if (identity.exerciseId) return identity.exerciseId;
  return null;
}

export function parseExerciseParam(raw) {
  if (!raw || typeof raw !== "string") return null;
  if (raw.startsWith("user:")) {
    const id = Number(raw.slice("user:".length));
    return Number.isInteger(id) ? { userExerciseId: id } : null;
  }
  return { exerciseId: raw };
}

function identityKey(identity) {
  if (!identity) return null;
  if (identity.userExerciseId != null) return `user:${identity.userExerciseId}`;
  return identity.exerciseId ?? null;
}

function daysAgo(isoDate) {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function bareEstimate(n) {
  return formatEstimate(n).replace(/ (lbs|kg)$/, "");
}

function paddedRange(min, max) {
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    return { min: min - pad, max: max + pad };
  }
  const span = max - min;
  const pad = span * 0.12;
  return { min: min - pad, max: max + pad };
}

function E1rmSparkline({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return <span className="muted small">not enough data</span>;
  }

  const series = history.map((p) => ({ performedAt: p.date, weight: p.e1rm }));
  const first = series[0];
  const last = series[series.length - 1];
  const values = series.map((p) => p.weight);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const { min, max } = paddedRange(rawMin, rawMax);

  const tMin = new Date(series[0].performedAt).getTime();
  const tMax = new Date(series[series.length - 1].performedAt).getTime();
  const tSpan = tMax - tMin || 1;

  const W = 100;
  const H = 40;
  const padX = 4;
  const padY = 6;

  const xOf =
    series.length === 1 ? () => W / 2 : (t) => padX + ((t - tMin) / tSpan) * (W - padX * 2);
  const yOf = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);

  const points = series.map((p) => {
    const t = new Date(p.performedAt).getTime();
    return `${xOf(t)},${yOf(p.weight)}`;
  });

  const endX = xOf(new Date(last.performedAt).getTime());
  const endY = yOf(last.weight);

  return (
    <div className="st-sparkline chart-tip-host" tabIndex={0}>
      <span className="st-sparkline-val st-sparkline-val--first">
        {series.length > 1 ? bareEstimate(first.weight) : null}
      </span>
      <svg
        className="st-sparkline-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {series.length > 1 ? (
          <>
            <polygon
              className="st-sparkline-area"
              points={`${points.join(" ")} ${endX},${H - padY} ${points[0].split(",")[0]},${H - padY}`}
            />
            <polyline className="st-sparkline-line" points={points.join(" ")} />
          </>
        ) : null}
        <path className="st-sparkline-dot-ring" d={`M ${endX} ${endY} l 0.0001 0`} />
        <path className="st-sparkline-dot" d={`M ${endX} ${endY} l 0.0001 0`} />
      </svg>
      <span className="st-sparkline-val st-sparkline-val--last">{bareEstimate(last.weight)}</span>
    </div>
  );
}

function fmtSets(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatWeekLabel(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function weekTip(w) {
  const label = `Week of ${formatWeekLabel(w.weekStart)}`;
  if (w.effectiveSets <= 0) return `${label}: no sets`;
  const eff = `${fmtSets(w.effectiveSets)} effective set${w.effectiveSets === 1 ? "" : "s"}`;
  return w.stimulatingSets != null
    ? `${label}: ${eff} · ${fmtSets(w.stimulatingSets)} stimulating`
    : `${label}: ${eff}`;
}

/**
 * Mini weekly bar chart for one exercise. Bars are the honest mark for
 * discrete weekly set counts (a line would imply continuity across weeks);
 * zero-based `niceScale` keeps heights proportional, a baseline plus faint
 * empty-week stubs make rest weeks read as gaps rather than missing data,
 * and the peak label + first/last week dates carry the scale and time
 * context directly - matching the panel's other charts, which never gate a
 * value behind height alone.
 */
function WeeklyVolumeMini({ weeklyVolume, weeks }) {
  if (!Array.isArray(weeklyVolume) || weeklyVolume.length === 0) {
    return <p className="muted small">not enough data</p>;
  }

  const anyInRange = weeklyVolume.some(
    (w) => w.effectiveSets > 0 || (w.stimulatingSets ?? 0) > 0
  );
  if (!anyInRange) {
    return (
      <p className="muted small ex-detail-range-empty">
        No sets in the last {weeks} weeks — try a longer range with the chips above.
      </p>
    );
  }

  const dataMax = Math.max(...weeklyVolume.map((w) => w.effectiveSets));
  const { max } = niceScale(dataMax);
  const first = weeklyVolume[0];
  const last = weeklyVolume[weeklyVolume.length - 1];

  return (
    <div
      className="ex-weekly-volume"
      role="img"
      aria-label={`Weekly effective sets over the last ${weeks} weeks, peak ${fmtSets(dataMax)}`}
    >
      <div className="ex-weekly-volume-plot">
        <span className="ex-weekly-volume-peak" aria-hidden="true">
          {fmtSets(dataMax)} sets
        </span>
        <div className="ex-weekly-volume-bars">
          {weeklyVolume.map((w) => {
            const empty = w.effectiveSets <= 0;
            const frac = max > 0 ? Math.min(w.effectiveSets / max, 1) : 0;
            return (
              <span
                key={w.weekStart}
                className={`ex-weekly-volume-bar${empty ? " ex-weekly-volume-bar--empty" : ""}`}
                style={empty ? undefined : { height: `max(${frac * 100}%, 6%)` }}
                title={weekTip(w)}
              />
            );
          })}
        </div>
      </div>
      <div className="ex-weekly-volume-axis" aria-hidden="true">
        <span>{formatWeekLabel(first.weekStart)}</span>
        <span>{formatWeekLabel(last.weekStart)}</span>
      </div>
    </div>
  );
}

function MatchedEffortBlock({ trend }) {
  if (!trend) {
    return <p className="analytics-unlock small">log RIR or RPE across 2+ sessions</p>;
  }
  const sign = trend.delta >= 0 ? "+" : "−";
  return (
    <p className="small ex-matched-effort">
      {sign}
      {formatEstimate(Math.abs(trend.delta))}{" "}
      <span className="muted">
        @ {formatEffort({ rir: trend.rir, effortUnit: trend.effortUnit })} · {trend.sessions}{" "}
        sessions
      </span>
    </p>
  );
}

function RepTargetsCard({ repTargets }) {
  const unit = loadWeightUnit();
  const hasExtrapolated = Array.isArray(repTargets) && repTargets.some((r) => r.extrapolated);

  if (repTargets === null) {
    return (
      <section className="card stack ex-rep-targets-card">
        <div className="ex-detail-head stack">
          <h2 className="analytics-section-title">Working weight targets</h2>
          <p className="analytics-unlock">log weighted sets with reps to unlock rep targets</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card stack ex-rep-targets-card">
      <div className="ex-detail-head stack">
        <h2 className="analytics-section-title">
          Working weight targets{" "}
          <HowCalculatedButton title="Rep targets" copy={HOW_REP_TARGETS} />
        </h2>
        <p className="muted small analytics-card-sub">Estimated from your best set</p>
      </div>
      <div className="table-scroll">
        <table className="data-table ex-rep-targets-table">
          <tbody>
            {repTargets.map((row) => (
              <tr
                key={row.reps}
                className={row.extrapolated ? "ex-rep-target-row--extrapolated" : undefined}
              >
                <td>{row.reps} reps</td>
                <td className="num">
                  → {formatWeight(roundToPlate(row.weight, unit), unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasExtrapolated ? (
        <p className="muted small ex-rep-targets-footnote">
          Muted rows are outside your logged rep range.
        </p>
      ) : null}
    </section>
  );
}

function ExerciseDetailPanel({ detail, weeks, loading, error, onClose }) {
  if (loading) {
    return (
      <section className="card ex-detail-panel">
        <LoadingState slowLabel="Loading exercise detail…" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="card ex-detail-panel stack">
        <ErrorMessage error={error} />
        <button type="button" className="btn-secondary ex-detail-close" onClick={onClose}>
          Back to list
        </button>
      </section>
    );
  }

  if (!detail) return null;

  const { totals, topSets, matchedEffortTrend, e1rmHistory, weeklyVolume, repTargets } = detail;

  return (
    <section className="card stack ex-detail-panel" aria-label={`${detail.name} detail`}>
      <div className="row ex-detail-title-row">
        <h2 className="ex-detail-title">{detail.name}</h2>
        <button type="button" className="btn-secondary ex-detail-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="ex-totals-row">
        <div className="ex-total">
          <span className="muted small">Sessions</span>
          <span className="ex-total-val">{totals.sessions}</span>
        </div>
        <div className="ex-total">
          <span className="muted small">Sets</span>
          <span className="ex-total-val">{totals.sets}</span>
        </div>
        <div className="ex-total">
          <span className="muted small">Effective</span>
          <span className="ex-total-val">
            {totals.effectiveSets > 0 ? totals.effectiveSets : (
              <span className="muted small">not enough data</span>
            )}
          </span>
        </div>
        <div className="ex-total">
          <span className="muted small">Stimulating</span>
          <span className="ex-total-val">
            {totals.stimulatingSets === null ? (
              <span className="analytics-unlock small">log RIR or RPE</span>
            ) : (
              totals.stimulatingSets
            )}
          </span>
        </div>
      </div>

      <RepTargetsCard repTargets={repTargets} />

      <section className="card stack ex-detail-support">
        <h3 className="analytics-section-title">Top sets</h3>
        {topSets.length === 0 ? (
          <p className="muted small">not enough data</p>
        ) : (
          <ul className="ex-top-sets-list">
            {topSets.map((ts) => (
              <li key={`${ts.performedAt}-${ts.weight}`} className="ex-top-set-row">
                <span>
                  {ts.reps != null
                    ? `${formatWeight(ts.weight)} × ${formatRepsValue(ts.reps)}`
                    : formatWeight(ts.weight)}
                </span>
                <span className="muted small">{formatShortDate(ts.performedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack ex-detail-support">
        <h3 className="analytics-section-title">Weekly volume</h3>
        <WeeklyVolumeMini weeklyVolume={weeklyVolume} weeks={weeks} />
      </section>

      <section className="card stack ex-detail-support">
        <h3 className="analytics-section-title">
          Matched effort{" "}
          <HowCalculatedButton title="Matched effort" copy={HOW_MATCHED_EFFORT} />
        </h3>
        <MatchedEffortBlock trend={matchedEffortTrend} />
      </section>

      <section className="card stack ex-detail-support">
        <h3 className="analytics-section-title">
          e1RM history{" "}
          <HowCalculatedButton title="e1RM history" copy={HOW_E1RM_HISTORY} />
        </h3>
        <E1rmSparkline history={e1rmHistory} />
      </section>

      <div className="ex-pr-slot card stack">
        <h3 className="analytics-section-title">Personal records</h3>
        <p className="muted small">PR detection coming — milestones will show up here.</p>
      </div>
    </section>
  );
}

export function ExercisesView({ weeks, range, exerciseParam, onExerciseParamChange }) {
  const [index, setIndex] = useState(null);
  const [indexLoading, setIndexLoading] = useState(true);
  const [indexError, setIndexError] = useState(null);
  const [query, setQuery] = useState("");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const parsedExercise = useMemo(() => parseExerciseParam(exerciseParam), [exerciseParam]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIndexLoading(true);
      setIndexError(null);
      try {
        const data = await analyticsApi.getExerciseIndex();
        if (!cancelled) setIndex(data);
      } catch (err) {
        if (!cancelled) setIndexError(err);
      } finally {
        if (!cancelled) setIndexLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!parsedExercise) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await analyticsApi.getExerciseDetail({
          exerciseId: parsedExercise.exerciseId,
          userExerciseId: parsedExercise.userExerciseId,
          from: range.from,
          to: range.to,
        });
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setDetailError(err);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [parsedExercise, range.from, range.to]);

  const exercises = index?.exercises ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((row) => row.name.toLowerCase().includes(q));
  }, [exercises, query]);

  function selectRow(row) {
    const param = serializeExerciseParam(row.identity);
    if (param === exerciseParam) {
      onExerciseParamChange(null);
      return;
    }
    onExerciseParamChange(param);
  }

  function closeDetail() {
    onExerciseParamChange(null);
  }

  if (indexLoading) {
    return <LoadingState slowLabel="Loading your exercises…" />;
  }

  if (indexError) {
    return <ErrorMessage error={indexError} />;
  }

  if (exercises.length === 0) {
    return (
      <section className="card stack ex-empty-roster">
        <p className="muted" style={{ margin: 0 }}>
          No exercises logged yet. Log a workout to build your exercise history.
        </p>
        <p className="small" style={{ margin: 0 }}>
          <Link to="/log-workout">Log your first workout →</Link>
        </p>
      </section>
    );
  }

  return (
    <div className="stack exercises-view">
      <div className="exercises-search-wrap">
        <input
          type="search"
          className="exercises-search-input"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter exercises"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="muted small">No exercises match &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <ul className="exercise-roster" role="list">
          {filtered.map((row) => {
            const key = identityKey(row.identity);
            const selected = exerciseParam === serializeExerciseParam(row.identity);
            const ago = daysAgo(row.lastPerformed);
            const agoLabel = ago === 0 ? "today" : `${ago}d ago`;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`exercise-roster-row${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => selectRow(row)}
                >
                  <span className="exercise-roster-name">{row.name}</span>
                  <span className="exercise-roster-meta muted small">
                    last trained {agoLabel} · {row.sessionCount} session
                    {row.sessionCount === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {parsedExercise ? (
        <ExerciseDetailPanel
          detail={detail}
          weeks={weeks}
          loading={detailLoading}
          error={detailError}
          onClose={closeDetail}
        />
      ) : null}
    </div>
  );
}
