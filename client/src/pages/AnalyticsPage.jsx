import { useEffect, useState } from "react";
import * as analyticsApi from "../api/analyticsApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { HowCalculatedButton } from "../components/analytics/HowCalculatedButton.jsx";
import { ChartTableToggle } from "../components/analytics/ChartTableToggle.jsx";
import { StatTiles } from "../components/analytics/StatTiles.jsx";
import { MuscleVolumeChart } from "../components/analytics/MuscleVolumeChart.jsx";
import { MuscleVolumeTrend } from "../components/analytics/MuscleVolumeTrend.jsx";
import { StrengthTrendChart } from "../components/analytics/StrengthTrendChart.jsx";
import { Meter } from "../components/analytics/Meter.jsx";
import { BalanceScale } from "../components/analytics/BalanceScale.jsx";
import { toDateOnlyString } from "../lib/dateOnly.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { buildExecutionVerdict, formatPlanActual, formatPlannedSummary, formatActualSummary } from "../lib/executionVerdict.js";

const RANGE_PRESETS = [
  { weeks: 4, label: "4 weeks" },
  { weeks: 8, label: "8 weeks" },
  { weeks: 12, label: "12 weeks" },
];

/* Same 1-2 sentence voice as METRIC_INTRO_COPY. */
const HOW_EFFECTIVE_SETS =
  "Each set counts toward a muscle by its fractional attribution from the exercise catalog (a bench set is mostly chest, partly triceps and shoulders). Counted for every set, with or without RIR (RPE counts too: RIR = 10 − RPE).";
const HOW_STIMULATING_SETS =
  "Attribution fraction × a stimulus multiplier from the set's RIR (RPE counts too: RIR = 10 − RPE) — sets closer to failure count for more. Sets logged without RIR or RPE are excluded from this number.";
const HOW_BEST_E1RM =
  "Estimated 1-rep max from weight × reps using the Epley formula. It's an estimate of strength, not a tested max.";
const HOW_MATCHED_EFFORT =
  "Compares your estimated 1RM only across sets you took at the same RIR (RPE counts too: RIR = 10 − RPE), so progress shows up even when you never max out. Uses the RIR you log most often for this exercise; needs 2 or more sessions at the same RIR.";
const HOW_EXECUTION =
  "Each row shows what you planned vs. what you logged (sets, reps, weight, RIR). Load % = actual weight ÷ planned; Volume % = sets done ÷ sets planned; effort drift = actual RIR − planned (positive = stopped earlier). Only sets logged from a template count — block plans aren't linked yet.";
const HOW_BALANCE =
  "Push vs. pull and quad vs. hamstring ratios use effective sets summed over the engine's muscle groups (push: chest, shoulders, triceps; pull: lats, middle back, traps, biceps; quads and hamstrings each stand alone). The shaded band is a rough 0.8–1.25 guide, not a prescription.";

/** to = today (date-only; the endpoint treats it as inclusive end-of-day), from = to minus N*7 days. */
function rangeForWeeks(weeks) {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - weeks * 7);
  return { from: toDateOnlyString(fromDate), to: toDateOnlyString(today) };
}

/* Display-only unit label (what the user logs in); read per call so an
   in-session toggle in the live-log prefs is picked up without a reload. */
function formatWeight(n) {
  return `${Number(n).toFixed(1)} ${loadWeightUnit()}`;
}

function E1rmTrendCell({ trend }) {
  if (!trend || trend.first === null) {
    return <span className="muted small">not enough data</span>;
  }
  if (trend.delta === 0) {
    return <span>no change</span>;
  }
  const sign = trend.delta > 0 ? "+" : "-";
  return (
    <span>
      {sign}
      {formatWeight(Math.abs(trend.delta))}
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
      {formatWeight(Math.abs(trend.delta))}{" "}
      <span className="muted small">
        @ {trend.rir} RIR · {trend.sessions} sessions
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

function PerMuscleSection({ perMuscle }) {
  const [view, setView] = useState("chart");
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
          <MuscleVolumeTrend perMuscle={perMuscle} />
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Muscle</th>
                <th scope="col">
                  <span>Effective sets/wk</span>{" "}
                  <HowCalculatedButton title="Effective sets/wk" copy={HOW_EFFECTIVE_SETS} />
                </th>
                <th scope="col">
                  <span>Stimulating sets/wk</span>{" "}
                  <HowCalculatedButton title="Stimulating sets/wk" copy={HOW_STIMULATING_SETS} />
                </th>
                <th scope="col">Sessions/wk</th>
                <th scope="col">Last trained</th>
              </tr>
            </thead>
            <tbody>
              {perMuscle.map((m) => (
                <tr key={m.muscle}>
                  <td className="analytics-muscle-name">{m.muscle}</td>
                  <td>{m.effectiveSets}</td>
                  <td>
                    {m.stimulatingSets === null ? (
                      <span className="analytics-unlock">log RIR or RPE to unlock</span>
                    ) : (
                      m.stimulatingSets
                    )}
                  </td>
                  <td>{m.frequency}</td>
                  <td>{m.daysSinceLast}d ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            Estimated 1RM <HowCalculatedButton title="Best e1RM" copy={HOW_BEST_E1RM} /> first
            vs. latest session per exercise, with the matched-effort{" "}
            <HowCalculatedButton title="Matched effort" copy={HOW_MATCHED_EFFORT} /> trend where
            unlocked.
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
                <th scope="col">Best set</th>
                <th scope="col">
                  <span>Best e1RM</span>{" "}
                  <HowCalculatedButton title="Best e1RM" copy={HOW_BEST_E1RM} />
                </th>
                <th scope="col">e1RM trend</th>
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
                    {ex.bestSet ? (
                      `${formatWeight(ex.bestSet.weight)} × ${Math.round(ex.bestSet.reps)}`
                    ) : (
                      <span className="muted small">not enough data</span>
                    )}
                  </td>
                  <td>
                    {ex.bestSet && ex.bestSet.e1rm?.epley != null ? (
                      formatWeight(ex.bestSet.e1rm.epley)
                    ) : (
                      <span className="muted small">not enough data</span>
                    )}
                  </td>
                  <td>
                    <E1rmTrendCell trend={ex.e1rmTrend} />
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
      {Math.abs(value)} RIR{" "}
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
        on target{exact > 0 ? ` (${value > 0 ? "+" : "-"}${exact} RIR)` : ""}
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
  const [weeks, setWeeks] = useState(4);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            onClick={() => setWeeks(preset.weeks)}
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
        isEmpty ? (
          <div className="card stack">
            <p className="muted" style={{ margin: 0 }}>
              No logged sets in this range.
            </p>
          </div>
        ) : (
          <div className={`stack analytics-content${loading ? " is-refreshing" : ""}`}>
            <StatTiles summary={summary} />
            <PerMuscleSection perMuscle={summary.perMuscle} />
            <PerExerciseSection perExercise={summary.perExercise} />
            <ExecutionSection execution={summary.execution ?? []} />
            <BalanceSection balance={summary.balance} />
            <DataQualitySection meta={summary.meta} />
          </div>
        )
      ) : null}
    </div>
  );
}
