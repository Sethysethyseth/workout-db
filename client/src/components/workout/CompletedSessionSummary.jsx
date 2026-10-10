import { useMemo } from "react";
import { formatEffort } from "../../lib/effortDisplay.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { formatWeight } from "../../lib/weightDisplay.js";

/**
 * Read-only rendering of a finished workout. A finished session is a
 * record, not a form: no inputs, no toggles - a headline of what happened,
 * then one card per exercise with its sets as a compact ledger.
 */

function durationLabel(session) {
  const start = new Date(session?.startedAt || session?.performedAt || 0).getTime();
  const end = new Date(session?.completedAt || 0).getTime();
  if (!start || !end || end <= start) return null;
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Timed (durationSec) and strength sets both count as logged (BK critic P1-3). */
function setIsLogged(s) {
  return s && (s.weight != null || s.reps != null || s.durationSec != null);
}

/** Count of logged sets in an array (pure; covered by DELIVERY snippet). */
function countLoggedSets(sets) {
  if (!Array.isArray(sets)) return 0;
  return sets.filter(setIsLogged).length;
}

/**
 * Format a timed set's duration for the finished summary.
 * Under 60 s -> "45 s"; 90 -> "1:30".
 * @param {number | null | undefined} sec
 * @returns {string | null}
 */
function formatTimedSetDuration(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return null;
  const n = Number(sec);
  if (n < 60) return `${n} s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Compact timed-row label: "45 s" or "20 lb × 45 s" when load is present.
 * @param {{ durationSec?: number | null, weight?: number | null }} s
 * @param {string} weightUnit
 */
function formatTimedSetRow(s, weightUnit) {
  const dur = formatTimedSetDuration(s?.durationSec);
  if (!dur) return null;
  if (s.weight != null) return `${formatWeight(s.weight, weightUnit)} × ${dur}`;
  return dur;
}

function formatVolume(total, unit) {
  if (!total) return "—";
  if (total >= 10000) return `${(total / 1000).toFixed(1)}k ${unit}`;
  return formatWeight(Math.round(total), unit);
}

function bestSet(sets) {
  let best = null;
  for (const s of sets) {
    if (s.weight == null) continue;
    if (
      !best ||
      s.weight > best.weight ||
      (s.weight === best.weight && (s.reps ?? 0) > (best.reps ?? 0))
    ) {
      best = s;
    }
  }
  return best;
}

function effortCell(s) {
  if (s.rpe != null) return formatEffort({ rpe: s.rpe, effortUnit: "rpe" });
  if (s.rir != null) return formatEffort({ rir: s.rir, effortUnit: "rir" });
  return null;
}

const notesPreserveStyle = { whiteSpace: "pre-wrap" };

export function CompletedSessionSummary({
  session,
  exercises,
  setsByExercise,
  weightUnit,
  setHasPR,
  renderTracked = null,
}) {
  const stats = useMemo(() => {
    const allSets = Array.isArray(session?.sets) ? session.sets.filter(setIsLogged) : [];
    let volume = 0;
    let reps = 0;
    for (const s of allSets) {
      // Volume stays strength-only - timed sets (reps null) add nothing.
      if (s.weight != null && s.reps != null) volume += Number(s.weight) * Number(s.reps);
      if (s.reps != null) reps += Number(s.reps);
    }
    return {
      sets: countLoggedSets(session?.sets),
      reps,
      volume,
      duration: durationLabel(session),
      exercises: exercises.length,
    };
  }, [session, exercises]);

  const showEffort = useMemo(
    () => (Array.isArray(session?.sets) ? session.sets : []).some((s) => s.rir != null || s.rpe != null),
    [session]
  );
  const showSide = useMemo(
    () => (Array.isArray(session?.sets) ? session.sets : []).some((s) => s.side),
    [session]
  );
  /* The headline PR count is the number of exercises that carry a chip
     below, so the number and the marks in the tables always agree. */
  const prExerciseCount = useMemo(() => {
    if (!setHasPR) return 0;
    let n = 0;
    for (const se of exercises) {
      const sets = (setsByExercise.get(se.id) || []).filter(setIsLogged);
      if (sets.some((s) => setHasPR(se, s.weight, s.reps))) n += 1;
    }
    return n;
  }, [exercises, setsByExercise, setHasPR]);

  const showNotes = useMemo(
    () => (Array.isArray(session?.sets) ? session.sets : []).some((s) => s.notes && String(s.notes).trim()),
    [session]
  );

  return (
    <div className="session-summary stack">
      <section className="session-summary__ledger card" aria-label="Workout totals">
        <div className="session-summary__stat">
          <span className="session-summary__stat-label">Duration</span>
          <span className="session-summary__stat-value">{stats.duration || "—"}</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-label">Exercises</span>
          <span className="session-summary__stat-value">{stats.exercises}</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-label">Sets</span>
          <span className="session-summary__stat-value">{stats.sets}</span>
        </div>
        <div className="session-summary__stat">
          <span className="session-summary__stat-label">Volume</span>
          <span className="session-summary__stat-value">{formatVolume(stats.volume, weightUnit)}</span>
        </div>
        <div className={`session-summary__stat${prExerciseCount > 0 ? " session-summary__stat--pr" : ""}`}>
          <span className="session-summary__stat-label">PRs</span>
          <span className="session-summary__stat-value">{prExerciseCount}</span>
        </div>
      </section>

      {session?.notes && String(session.notes).trim() ? (
        <p className="session-summary__notes card" style={notesPreserveStyle}>
          {session.notes}
        </p>
      ) : null}

      <div className="session-summary__exercises stack">
        {exercises.map((se, index) => {
          const sets = (setsByExercise.get(se.id) || []).filter(setIsLogged);
          const best = bestSet(sets);
          const seenPR = new Set();
          const exerciseVolume = sets.reduce(
            (sum, s) =>
              s.weight != null && s.reps != null ? sum + Number(s.weight) * Number(s.reps) : sum,
            0
          );
          return (
            <section key={se.id} className="session-summary__exercise card" aria-label={se.exerciseName}>
              <header className="session-summary__exercise-head">
                <span className="session-summary__exercise-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="session-summary__exercise-title">
                  <h2>{se.exerciseName}</h2>
                  {renderTracked ? renderTracked(se) : null}
                  <p className="session-summary__exercise-meta">
                    {sets.length} {sets.length === 1 ? "set" : "sets"}
                    {best ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        best {formatWeight(best.weight, weightUnit)}
                        {best.reps != null ? ` × ${formatRepsValue(best.reps)}` : ""}
                      </>
                    ) : null}
                    {exerciseVolume > 0 ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        {formatVolume(exerciseVolume, weightUnit)}
                      </>
                    ) : null}
                  </p>
                </div>
              </header>
              {se.notes && String(se.notes).trim() ? (
                <p className="session-summary__exercise-notes" style={notesPreserveStyle}>
                  {se.notes}
                </p>
              ) : null}
              {sets.length > 0 ? (
                <table className="session-summary__sets">
                  <thead>
                    <tr>
                      <th scope="col" className="session-summary__col-set">
                        Set
                      </th>
                      <th scope="col">Weight</th>
                      <th scope="col">Reps</th>
                      {showEffort ? <th scope="col">Effort</th> : null}
                      {showSide ? <th scope="col">Side</th> : null}
                      {showNotes ? <th scope="col">Notes</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {sets.map((s, i) => {
                      const prKey = `${s.weight}:${s.reps}`;
                      const pr =
                        setHasPR && !seenPR.has(prKey) && setHasPR(se, s.weight, s.reps);
                      if (pr) seenPR.add(prKey);
                      const effort = effortCell(s);
                      const timed = s.durationSec != null;
                      const timedLabel = timed ? formatTimedSetRow(s, weightUnit) : null;
                      return (
                        <tr key={s.id} className={pr ? "session-summary__set--pr" : undefined}>
                          <td className="session-summary__col-set">
                            <span className="session-summary__set-no">{i + 1}</span>
                            {pr ? (
                              <span className="session-set-pr-chip" title="Personal record">
                                PR
                              </span>
                            ) : null}
                          </td>
                          {timed ? (
                            <>
                              <td className="session-summary__num" colSpan={2}>
                                {timedLabel}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="session-summary__num">
                                {s.weight != null ? formatWeight(s.weight, weightUnit) : "—"}
                              </td>
                              <td className="session-summary__num">
                                {s.reps != null ? formatRepsValue(s.reps) : "—"}
                              </td>
                            </>
                          )}
                          {showEffort ? (
                            <td className="session-summary__num session-summary__effort">
                              {effort || <span className="muted">—</span>}
                            </td>
                          ) : null}
                          {showSide ? <td>{s.side || "—"}</td> : null}
                          {showNotes ? (
                            <td className="session-summary__set-notes" style={notesPreserveStyle}>
                              {s.notes || ""}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="muted small session-summary__empty">No sets logged.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
