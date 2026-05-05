import { useMemo } from "react";
import { MetricInfoButton } from "../workout/MetricInfoButton.jsx";

function cell(raw) {
  const s = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
  return s;
}

/** Read-only dense table from WorkoutBuilder exercise state. */
export function WorkoutTemplateTableView({
  exercises,
  useRIR,
  useRPE,
  useExerciseNotes = false,
  useSetNotes = false,
}) {
  const showSetNotes = useMemo(
    () =>
      useSetNotes &&
      (exercises || []).some((ex) =>
        (ex.sets || []).some((s) => String(s.notes ?? "").trim() !== "")
      ),
    [exercises, useSetNotes]
  );

  return (
    <div className="template-table-view stack">
      {exercises.map((ex, ei) => (
        <section key={ex.id} className="template-table-section card">
          <div className="template-table-section-head stack">
            <strong>{ex.exerciseName?.trim() || `Exercise ${ei + 1}`}</strong>
            {useExerciseNotes && ex.notes?.trim() ? (
              <div className="muted small template-table-exercise-notes">
                {ex.notes.trim()}
              </div>
            ) : null}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Set</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Reps</th>
                  {useRIR ? (
                    <th scope="col">
                      <div className="template-table-metric-th">
                        <div className="template-table-metric-th__label-line template-table-metric-th__label-line--primary">
                          <span>RIR</span> <MetricInfoButton metric="rir" />
                        </div>
                        <div className="template-table-metric-th__label-line muted small">
                          Reps in Reserve
                        </div>
                      </div>
                    </th>
                  ) : null}
                  {useRPE ? (
                    <th scope="col">
                      <div className="template-table-metric-th">
                        <div className="template-table-metric-th__label-line template-table-metric-th__label-line--primary">
                          <span>RPE</span> <MetricInfoButton metric="rpe" />
                        </div>
                        <div className="template-table-metric-th__label-line muted small">
                          Rating of Perceived Exertion
                        </div>
                      </div>
                    </th>
                  ) : null}
                  {showSetNotes ? (
                    <th scope="col" className="template-table-notes-col">
                      Notes
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(ex.sets || []).map((s, si) => (
                  <tr key={s.id}>
                    <td>{si + 1}</td>
                    <td>{cell(s.weight)}</td>
                    <td>{cell(s.reps)}</td>
                    {useRIR ? <td>{cell(s.rir)}</td> : null}
                    {useRPE ? <td>{cell(s.rpe)}</td> : null}
                    {showSetNotes ? (
                      <td className="template-table-notes-col muted small">
                        {String(s.notes ?? "").trim() ? (
                          <div className="template-table-set-note">{String(s.notes).trim()}</div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
