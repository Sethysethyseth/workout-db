import { useEffect, useState } from "react";
import * as analyticsApi from "../api/analyticsApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { HowCalculatedButton } from "../components/analytics/HowCalculatedButton.jsx";
import { loadWeightUnit } from "../lib/weightUnitPref.js";

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
  "Your logged sets compared against the template they were logged from, set by set. Load = actual ÷ planned weight. Volume = sets done ÷ sets planned. Effort drift = actual RIR − planned RIR (RPE counts too: RIR = 10 − RPE; positive means you stopped earlier than planned). Only sets logged from a template count — block plans aren't linked yet.";

function toDateOnlyString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function PerMuscleSection({ perMuscle }) {
  return (
    <section className="card analytics-table-card">
      <div className="analytics-card-head stack">
        <h2>Per muscle</h2>
        <p className="muted small analytics-card-sub">
          Weekly training volume per muscle over the selected range.
        </p>
      </div>
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
    </section>
  );
}

function PerExerciseSection({ perExercise }) {
  return (
    <section className="card analytics-table-card">
      <div className="analytics-card-head stack">
        <h2>Per exercise</h2>
        <p className="muted small analytics-card-sub">
          Best set and estimated 1-rep-max trend per exercise in range.
        </p>
      </div>
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
    </section>
  );
}

function BalanceRatio({ label, value, unavailable = false }) {
  return (
    <div className="row analytics-balance-row">
      <span>{label}</span>
      {unavailable ? (
        <span className="muted small">not available</span>
      ) : value === null ? (
        <span className="muted small">— not enough data</span>
      ) : (
        <span>{value.toFixed(2)} : 1</span>
      )}
    </div>
  );
}

function BalanceSection({ balance }) {
  return (
    <section className="card stack">
      <h2 className="analytics-section-title">Balance</h2>
      <BalanceRatio label="Push : Pull" value={balance.pushPull} />
      <BalanceRatio label="Quad : Hamstring" value={balance.quadHam} />
      {/* Always null in v1 - the row stays visible because the gap is part of
          the honesty contract (the reason ships in honestyNotes below). */}
      <BalanceRatio label="Front : Rear delt" value={balance.frontRearDelt} unavailable />
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
  if (value === 0) return <span>on target</span>;
  const sign = value > 0 ? "+" : "-";
  return (
    <span>
      {sign}
      {Math.abs(value)} RIR{" "}
      <span className="muted small">{value > 0 ? "sandbagging" : "overreaching"}</span>
    </span>
  );
}

function ExecutionSection({ execution }) {
  return (
    <section className="card analytics-table-card">
      <div className="analytics-card-head stack">
        <h2>
          Execution{" "}
          <HowCalculatedButton title="Execution" copy={HOW_EXECUTION} />
        </h2>
        <p className="muted small analytics-card-sub">
          Plan vs. actual for sets logged from a template.
        </p>
      </div>
      {execution.length === 0 ? (
        <p className="muted small analytics-card-sub" style={{ margin: 0 }}>
          Log workouts from a template with planned sets to unlock execution
          fidelity.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Load</th>
                <th scope="col">Volume</th>
                <th scope="col">Effort drift</th>
              </tr>
            </thead>
            <tbody>
              {execution.map((ex) => (
                <tr key={ex.exerciseId}>
                  <td>{ex.name}</td>
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
        <p className="analytics-card-sub">
          Effort (RIR or RPE) logged on {Math.round(meta.effortCoverage * 100)}% of sets
        </p>
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
        <h1>Analytics</h1>
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
      {loading ? <LoadingState /> : null}

      {!loading && !error && summary ? (
        isEmpty ? (
          <div className="card stack">
            <p className="muted" style={{ margin: 0 }}>
              No logged sets in this range.
            </p>
          </div>
        ) : (
          <>
            <PerMuscleSection perMuscle={summary.perMuscle} />
            <PerExerciseSection perExercise={summary.perExercise} />
            <ExecutionSection execution={summary.execution ?? []} />
            <BalanceSection balance={summary.balance} />
            <DataQualitySection meta={summary.meta} />
          </>
        )
      ) : null}
    </div>
  );
}
