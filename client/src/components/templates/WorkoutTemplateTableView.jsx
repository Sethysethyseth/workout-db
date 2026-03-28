function cell(raw) {
  const s = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
  return s;
}

/** Read-only dense table from WorkoutBuilder exercise state. */
export function WorkoutTemplateTableView({ exercises, useRIR, useRPE }) {
  return (
    <div className="template-table-view stack">
      {exercises.map((ex, ei) => (
        <section key={ex.id} className="template-table-section card">
          <div className="template-table-section-head stack">
            <strong>{ex.exerciseName?.trim() || `Exercise ${ei + 1}`}</strong>
            {ex.notes?.trim() ? (
              <span className="muted small" style={{ fontWeight: 500 }}>
                {ex.notes.trim()}
              </span>
            ) : null}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Set</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Reps</th>
                  {useRIR ? <th scope="col">RIR</th> : null}
                  {useRPE ? <th scope="col">RPE</th> : null}
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
