import { WorkoutTemplateTableView } from "./WorkoutTemplateTableView.jsx";

/** Read-only hierarchical view: weeks → workouts → exercise tables. */
export function BlockTemplateTableView({
  blockWeeks,
  useRIR,
  useRPE,
  useDuration,
  durationWeeks,
}) {
  const durationStr =
    durationWeeks != null && String(durationWeeks).trim() !== ""
      ? String(durationWeeks).trim()
      : "";
  const durationNum = Number(durationStr);
  const durationLabel =
    useDuration && durationStr !== ""
      ? `${durationStr} week${Number.isFinite(durationNum) && durationNum === 1 ? "" : "s"}`
      : null;

  return (
    <div className="template-table-view stack">
      {durationLabel ? (
        <p className="muted small" style={{ margin: 0, fontWeight: 600 }}>
          Duration: {durationLabel}
        </p>
      ) : null}
      {blockWeeks.map((week, wi) => (
        <section key={week.id} className="card stack block-table-week">
          <h3 className="block-table-week-title" style={{ margin: 0, fontSize: "1.1rem" }}>
            Week {wi + 1}
          </h3>
          <div className="stack" style={{ gap: "1rem" }}>
            {week.workouts.map((w, wj) => (
              <section key={w.id} className="card stack block-table-workout">
                <h4 className="block-table-workout-title" style={{ margin: 0, fontSize: "1.05rem" }}>
                  {w.title?.trim() || `Workout ${wj + 1}`}
                </h4>
                <WorkoutTemplateTableView exercises={w.exercises} useRIR={useRIR} useRPE={useRPE} />
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
