import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as analyticsApi from "../api/analyticsApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { HowCalculatedButton } from "../components/analytics/HowCalculatedButton.jsx";
import { ChartTableToggle } from "../components/analytics/ChartTableToggle.jsx";
import { AnalyticsViewTabs } from "../components/analytics/AnalyticsViewTabs.jsx";
import { StatTiles } from "../components/analytics/StatTiles.jsx";
import { MuscleVolumeChart } from "../components/analytics/MuscleVolumeChart.jsx";
import { MuscleVolumeHeatmap } from "../components/analytics/MuscleVolumeHeatmap.jsx";
import { StrengthTrendChart } from "../components/analytics/StrengthTrendChart.jsx";
import { ExercisesView } from "../components/analytics/ExercisesView.jsx";
import { Meter } from "../components/analytics/Meter.jsx";
import { BalanceScale } from "../components/analytics/BalanceScale.jsx";
import { toDateOnlyString } from "../lib/dateOnly.js";
import { formatEffort } from "../lib/effortDisplay.js";
import { formatRepsValue } from "../lib/repsDisplay.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { loadAnalyticsWeeks, saveAnalyticsWeeks } from "../lib/analyticsRangePref.js";
import { formatEstimate, formatWeight } from "../lib/weightDisplay.js";
import { buildExecutionVerdict, formatPlanActual, formatPlannedSummary, formatActualSummary } from "../lib/executionVerdict.js";

const RANGE_PRESETS = [
  { weeks: 2, label: "2 weeks" },
  { weeks: 4, label: "4 weeks" },
  { weeks: 8, label: "8 weeks" },
  { weeks: 12, label: "12 weeks" },
];

/** A muscle untrained this many days gets the warn tint in the volume
    table - two missed weekly slots, deliberately lenient enough not to
    punish a 10-day rotation. */
const STALE_MUSCLE_DAYS = 14;

const ANALYTICS_VIEWS = ["muscles", "strength", "exercises", "execution"];

function parseAnalyticsView(searchParams) {
  const raw = searchParams.get("view");
  if (raw === "strength" || raw === "execution" || raw === "exercises") return raw;
  return "muscles";
}

/* Same 1-2 sentence voice as METRIC_INTRO_COPY. */
const HOW_EFFECTIVE_SETS =
  "Each set counts toward a muscle by its fractional attribution from the exercise catalog (a bench set is mostly chest, partly triceps and shoulders). Counted for every set, with or without RIR (RPE counts too: RIR = 10 − RPE).";
const HOW_STIMULATING_SETS =
  "Attribution fraction × a stimulus multiplier from the set's RIR (RPE counts too: RIR = 10 − RPE) — sets closer to failure count for more. Sets logged without RIR or RPE are excluded from this number.";
const HOW_MATCHED_EFFORT =
  "Compares your estimated 1RM only across sets you took at the same RIR (RPE counts too: RIR = 10 − RPE), so progress shows up even when you never max out. Uses the RIR you log most often for this exercise; needs 2 or more sessions at the same RIR.";
const HOW_EXECUTION =
  "Each row shows what you planned vs. what you logged (sets, reps, weight, RIR). Load % = actual weight ÷ planned; Volume % = sets done ÷ sets planned; effort drift = actual RIR − planned (positive = stopped earlier). Only sets logged from a template count — block plans aren't linked yet.";
const HOW_BALANCE =
  "Push vs. pull and quad vs. hamstring ratios use effective sets summed over the engine's muscle groups (push: chest, shoulders, triceps; pull: lats, middle back, traps, biceps; quads and hamstrings each stand alone). The shaded band is a rough 0.8–1.25 guide, not a prescription.";

/** to = today (date-only; the endpoint treats it as inclusive end-of-day),
    from = to minus (N*7 - 1) days so the range covers exactly N*7 calendar
    days INCLUDING today - "2 weeks" is 14 day cells, "4 weeks" is 4 week
    buckets, with no partial extra bucket at the range start. */
function rangeForWeeks(weeks) {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (weeks * 7 - 1));
  return { from: toDateOnlyString(fromDate), to: toDateOnlyString(today) };
}

function TopSetCell({ topSet }) {
  if (!topSet) {
    return <span className="muted small">not enough data</span>;
  }
  return (
    <span>
      {topSet.reps != null
        ? `${formatWeight(topSet.weight)} × ${formatRepsValue(topSet.reps)}`
        : formatWeight(topSet.weight)}
    </span>
  );
}

/** First vs. latest session top-set weight over the range (topSetSeries endpoints). */
function TopSetTrendCell({ series }) {
  if (!Array.isArray(series) || series.length < 2) {
    return <span className="muted small">not enough data</span>;
  }
  const delta = series[series.length - 1].weight - series[0].weight;
  if (delta === 0) {
    return <span>no change</span>;
  }
  const sign = delta > 0 ? "+" : "-";
  return (
    <span>
      {sign}
      {formatWeight(Math.abs(delta))}
    </span>
  );
}

function MatchedEffortCell({ trend }) {
  if (!trend) {
    return <span className="analytics-unlock">log RIR or RPE across 2+ sessions</span>;
  }
  const sign = trend.delta >= 0 ? "+" : "-";
  return (
    <span>
      {sign}
      {formatEstimate(Math.abs(trend.delta))}{" "}
      <span className="muted small">
        @ {formatEffort({ rir: trend.rir, effortUnit: trend.effortUnit })} ·{" "}
        {trend.sessions} sessions
      </span>
    </span>
  );
}

const VOLUME_VIEW_OPTIONS = [
  { value: "chart", label: "Bars" },
  { value: "trend", label: "Trend" },
  { value: "table", label: "Table" },
];

/** Shared head for a chart card: title + sub on the left, Chart|Table chips
    on the right. `cardName` is the plain-string title for aria labels (the
    title itself may carry JSX like a how-calculated button). */
function ChartCardHead({ title, cardName, sub, view, onViewChange, toggleOptions }) {
  return (
    <div className="analytics-card-head stack">
      <div className="row">
        <h2>{title}</h2>
        <ChartTableToggle
          value={view}
          onChange={onViewChange}
          cardName={cardName}
          options={toggleOptions}
        />
      </div>
      <p className="muted small analytics-card-sub">{sub}</p>
    </div>
  );
}

function PerMuscleSection({ perMuscle, granularity, effortCoverage }) {
  const [view, setView] = useState("chart");
  const anyLocked = perMuscle.some((m) => m.stimulatingSets === null);
  return (
    <section className="card analytics-table-card">
      <ChartCardHead
        title="Weekly volume by muscle"
        cardName="Weekly volume by muscle"
        sub={
          <>
            Effective <HowCalculatedButton title="Effective sets/wk" copy={HOW_EFFECTIVE_SETS} />{" "}
            vs. stimulating{" "}
            <HowCalculatedButton title="Stimulating sets/wk" copy={HOW_STIMULATING_SETS} /> sets
            per week over the selected range.
          </>
        }
        view={view}
        onViewChange={setView}
        toggleOptions={VOLUME_VIEW_OPTIONS}
      />
      {view === "chart" ? (
        <div className="analytics-chart-body">
          <MuscleVolumeChart perMuscle={perMuscle} />
        </div>
      ) : view === "trend" ? (
        <div className="analytics-chart-body">
          <MuscleVolumeHeatmap
            perMuscle={perMuscle}
            granularity={granularity}
            effortCoverage={effortCoverage}
          />
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table analytics-volume-table">
              <thead>
                <tr>
                  <th scope="col">Muscle</th>
                  <th scope="col" className="num">Effective/wk</th>
                  <th scope="col" className="num">Stimulating/wk</th>
                  <th scope="col" className="num">Sessions/wk</th>
                  <th scope="col" className="num">Last trained</th>
                </tr>
              </thead>
              <tbody>
                {perMuscle.map((m) => (
                  <tr key={m.muscle}>
                    <td className="analytics-muscle-name">{m.muscle}</td>
                    <td className="num">{m.effectiveSets}</td>
                    <td className="num">
                      {m.stimulatingSets === null ? (
                        <span className="muted">—</span>
                      ) : (
                        m.stimulatingSets
                      )}
                    </td>
                    <td className="num">{m.frequency}</td>
                    <td
                      className={`num${m.daysSinceLast >= STALE_MUSCLE_DAYS ? " analytics-stale" : ""}`}
                    >
                      {m.daysSinceLast}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {anyLocked ? (
            <p className="muted small analytics-table-footnote">
              — stimulating needs RIR or RPE logged for that muscle.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function PerExerciseSection({ perExercise }) {
  const [view, setView] = useState("chart");
  return (
    <section className="card analytics-table-card">
      <ChartCardHead
        title="Strength trends"
        cardName="Strength trends"
        sub={
          <>
            Matched-effort <HowCalculatedButton title="Matched effort" copy={HOW_MATCHED_EFFORT} />{" "}
            trend per exercise where unlocked, with each session's top set — the weight you
            actually lifted — as the evidence.
          </>
        }
        view={view}
        onViewChange={setView}
      />
      {view === "chart" ? (
        <div className="analytics-chart-body">
          <StrengthTrendChart perExercise={perExercise} />
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Top set</th>
                <th scope="col">Top-set trend</th>
                <th scope="col">
                  <span>Matched effort</span>{" "}
                  <HowCalculatedButton title="Matched effort" copy={HOW_MATCHED_EFFORT} />
                </th>
              </tr>
            </thead>
            <tbody>
              {perExercise.map((ex) => (
                <tr key={ex.exerciseId}>
                  <td>{ex.name}</td>
                  <td>
                    <TopSetCell topSet={ex.topSet} />
                  </td>
                  <td>
                    <TopSetTrendCell series={ex.topSetSeries} />
                  </td>
                  <td>
                    <MatchedEffortCell trend={ex.matchedEffortTrend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Until N3 lands, ?view=exercises falls back to muscles via
          parseAnalyticsView - acceptable, this ships before N3 by design. */}
      <p className="small analytics-card-footlink">
        <Link to="?view=exercises">Estimated 1RM has its own view →</Link>
      </p>
    </section>
  );
}

function BalanceSection({ balance }) {
  return (
    <section className="card stack">
      <div className="analytics-card-head stack">
        <h2 className="analytics-section-title">
          Balance <HowCalculatedButton title="Balance" copy={HOW_BALANCE} />
        </h2>
        <p className="muted small analytics-card-sub">
          Push vs. pull and quad vs. hamstring volume ratios from effective sets.
        </p>
      </div>
      <BalanceScale
        label="Push : Pull"
        value={balance.pushPull}
        leftCaption="pull-heavy"
        rightCaption="push-heavy"
      />
      <BalanceScale
        label="Quad : Hamstring"
        value={balance.quadHam}
        leftCaption="ham-heavy"
        rightCaption="quad-heavy"
      />
      {/* Always null in v1 - the row stays visible because the gap is part of
          the honesty contract (the reason ships in honestyNotes below). */}
      <BalanceScale label="Front : Rear delt" value={balance.frontRearDelt} unavailable />
    </section>
  );
}

function formatAdherence(value) {
  if (value === null) return <span className="muted small">not enough data</span>;
  return `${Math.round(value * 100)}%`;
}

function EffortDriftCell({ value }) {
  if (value === null) {
    return <span className="analytics-unlock">plan + log RIR or RPE to unlock</span>;
  }
  if (value === 0) return <span className="exec-drift--on-target">on target</span>;
  const sign = value > 0 ? "+" : "-";
  return (
    <span className="exec-drift--off">
      {sign}
      {formatEffort({ rir: Math.abs(value), effortUnit: "rir" })}{" "}
      <span className="muted small">{value > 0 ? "sandbagging" : "overreaching"}</span>
    </span>
  );
}

function EffortDriftCompact({ value }) {
  if (value === null) {
    return <span className="analytics-unlock muted small">plan + log RIR or RPE to unlock</span>;
  }
  const n = Math.abs(Math.round(value));
  /* Sub-rep drifts round to 0 - "stopped ~0 reps early" is nonsense, so they
     read as on target with the exact drift kept as the annotation. */
  if (n === 0) {
    const exact = Math.round(Math.abs(value) * 10) / 10;
    return (
      <span className="exec-drift--on-target muted small">
        on target
        {exact > 0
          ? ` (${value > 0 ? "+" : "-"}${formatEffort({ rir: exact, effortUnit: "rir" })})`
          : ""}
      </span>
    );
  }
  const repWord = n === 1 ? "rep" : "reps";
  const plain =
    value > 0 ? `stopped ~${n} ${repWord} early` : `pushed ~${n} ${repWord} past plan`;
  return (
    <span className="exec-drift--off muted small">
      {plain}{" "}
      <span className="exec-drift-flavor">{value > 0 ? "sandbagging" : "overreaching"}</span>
    </span>
  );
}

/* Meters cap the fill at 120%; the printed % is always the true value. */
const ADHERENCE_METER_MAX = 1.2;

function AdherenceMetric({ label, value, compact = false }) {
  return (
    <div className={`exec-metric${compact ? " exec-metric--compact" : ""}`}>
      <span className="muted small">{label}</span>
      {value === null ? (
        <>
          <span />
          <span className="exec-val muted small">not enough data</span>
        </>
      ) : (
        <>
          <Meter value={value} max={ADHERENCE_METER_MAX} target={1} />
          <span className="exec-val">{Math.round(value * 100)}%</span>
        </>
      )}
    </div>
  );
}

function ExecutionSection({ execution }) {
  const [view, setView] = useState("chart");
  return (
    <section className="card analytics-table-card">
      <ChartCardHead
        title={
          <>
            Execution <HowCalculatedButton title="Execution" copy={HOW_EXECUTION} />
          </>
        }
        cardName="Execution"
        sub="Planned vs. logged for template sets. The headline line shows the concrete comparison; percentages and drift are the supporting detail."
        view={view}
        onViewChange={setView}
      />
      {execution.length === 0 ? (
        <div className="analytics-chart-body">
          <p className="muted small analytics-chart-note">
            Log workouts from a template with planned sets to unlock execution fidelity.
          </p>
        </div>
      ) : view === "chart" ? (
        <div className="analytics-chart-body">
          <div className="exec-rows">
            {execution.map((ex) => (
              <div key={ex.exerciseId} className="exec-row">
                <div className="exec-row-head stack">
                  <span className="exec-name">{ex.name}</span>
                  <span className="exec-verdict muted small">
                    {buildExecutionVerdict({
                      loadAdherence: ex.loadAdherence,
                      volumeAdherence: ex.volumeAdherence,
                      effortDrift: ex.effortDrift,
                    })}
                  </span>
                </div>
                <p className="exec-plan-actual">
                  {formatPlanActual(ex.planned, ex.actual, loadWeightUnit())}
                </p>
                <div className="exec-metrics-secondary">
                  <AdherenceMetric label="Load" value={ex.loadAdherence} compact />
                  <AdherenceMetric label="Volume" value={ex.volumeAdherence} compact />
                  <div className="exec-metric exec-metric--compact">
                    <span className="muted small">Effort</span>
                    <span />
                    <span className="exec-val">
                      <EffortDriftCompact value={ex.effortDrift} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Planned</th>
                <th scope="col">Did</th>
                <th scope="col">Load</th>
                <th scope="col">Volume</th>
                <th scope="col">Effort drift</th>
              </tr>
            </thead>
            <tbody>
              {execution.map((ex) => (
                <tr key={ex.exerciseId}>
                  <td>{ex.name}</td>
                  <td className="exec-table-side">
                    {formatPlannedSummary(ex.planned, loadWeightUnit())}
                  </td>
                  <td className="exec-table-side">
                    {formatActualSummary(ex.actual, loadWeightUnit())}
                  </td>
                  <td>{formatAdherence(ex.loadAdherence)}</td>
                  <td>{formatAdherence(ex.volumeAdherence)}</td>
                  <td>
                    <EffortDriftCell value={ex.effortDrift} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DataQualitySection({ meta }) {
  return (
    <section className="card stack">
      <h2 className="analytics-section-title">Data quality</h2>
      {meta.effortCoverage === null ? (
        <p className="muted analytics-card-sub">no attributed sets in range</p>
      ) : (
        <div className="coverage-row">
          <p className="analytics-card-sub">
            Effort (RIR or RPE) logged on {Math.round(meta.effortCoverage * 100)}% of sets
          </p>
          <Meter value={meta.effortCoverage} />
        </div>
      )}
      {Array.isArray(meta.honestyNotes) && meta.honestyNotes.length > 0 ? (
        <ul className="muted small analytics-honesty-notes">
          {meta.honestyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [weeks, setWeeks] = useState(() => loadAnalyticsWeeks());
  const [summary, setSummary] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(null);
  const [indexReady, setIndexReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const view = parseAnalyticsView(searchParams);

  function selectWeeks(nextWeeks) {
    setWeeks(nextWeeks);
    saveAnalyticsWeeks(nextWeeks);
  }

  function setView(nextView) {
    if (!ANALYTICS_VIEWS.includes(nextView)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", nextView);
        return next;
      },
      { replace: true }
    );
  }

  function setExerciseParam(nextExercise) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", "exercises");
        if (nextExercise) next.set("exercise", nextExercise);
        else next.delete("exercise");
        return next;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadIndex() {
      try {
        const data = await analyticsApi.getExerciseIndex();
        if (!cancelled) setExerciseIndex(data);
      } catch {
        if (!cancelled) setExerciseIndex(null);
      } finally {
        if (!cancelled) setIndexReady(true);
      }
    }

    loadIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { from, to } = rangeForWeeks(weeks);
        const data = await analyticsApi.getSummary({ from, to });
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  const isEmpty =
    summary &&
    (summary.perMuscle?.length ?? 0) === 0 &&
    (summary.perExercise?.length ?? 0) === 0;

  const indexExerciseCount = exerciseIndex?.exercises?.length ?? 0;
  const isNewUser = indexReady && exerciseIndex != null && indexExerciseCount === 0;

  return (
    <div className="stack analytics-page">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="muted analytics-intro">
          Volume, strength trends, and balance from your logged sets.
        </p>
      </div>

      <div className="analytics-range-chips" role="group" aria-label="Date range">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.weeks}
            type="button"
            className={`range-chip${preset.weeks === weeks ? " is-active" : ""}`}
            aria-pressed={preset.weeks === weeks}
            onClick={() => selectWeeks(preset.weeks)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <ErrorMessage error={error} />
      {/* Skeleton only on first load; a range refetch dims the previous
          render in place instead of flashing it away. */}
      {loading && !summary ? <LoadingState slowLabel="Waking up the server…" /> : null}

      {!error && summary ? (
        isEmpty && view !== "exercises" ? (
          <div className="card stack analytics-page-empty">
            {!indexReady ? (
              <p className="muted small" style={{ margin: 0 }}>
                Checking your history…
              </p>
            ) : isNewUser ? (
              <>
                <p className="muted" style={{ margin: 0 }}>
                  You haven&apos;t logged any sets yet. Once you record a workout, volume and
                  strength trends will show up here.
                </p>
                <p className="small" style={{ margin: 0 }}>
                  <Link to="/log-workout">Log your first workout →</Link>
                </p>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No sets in the last {weeks} weeks — try a longer range with the chips above.
              </p>
            )}
          </div>
        ) : (
          <div className={`stack analytics-content${loading ? " is-refreshing" : ""}`}>
            <StatTiles summary={summary} />
            <AnalyticsViewTabs value={view} onChange={setView} />
            {view === "muscles" ? (
              <>
                <PerMuscleSection
                  perMuscle={summary.perMuscle}
                  granularity={summary.meta?.seriesGranularity}
                  effortCoverage={summary.meta?.effortCoverage}
                />
                <BalanceSection balance={summary.balance} />
              </>
            ) : null}
            {view === "strength" ? (
              <PerExerciseSection perExercise={summary.perExercise} />
            ) : null}
            {view === "exercises" ? (
              <ExercisesView
                weeks={weeks}
                range={rangeForWeeks(weeks)}
                exerciseParam={searchParams.get("exercise")}
                onExerciseParamChange={setExerciseParam}
              />
            ) : null}
            {view === "execution" ? (
              <ExecutionSection execution={summary.execution ?? []} />
            ) : null}
            {view !== "exercises" ? <DataQualitySection meta={summary.meta} /> : null}
          </div>
        )
      ) : null}
    </div>
  );
}
