import { readCurrentProgram } from "../../lib/currentProgramStorage.js";

export function QuickPickTemplates({ templates, loading, disabled, startingTemplateId, onStartTemplate }) {
  const currentProgramRef = readCurrentProgram();
  const curWorkoutId = currentProgramRef?.kind === "workout" ? currentProgramRef.id : null;

  return (
    <section className="quick-pick-templates stack" style={{ gap: 8 }} aria-labelledby="quick-pick-heading">
      <div className="quick-pick-templates__head">
        <h2 id="quick-pick-heading" className="quick-pick-templates__title">
          Quick picks
        </h2>
        <span className="quick-pick-templates__hint muted small">Tap to start</span>
      </div>
      {loading ? (
        <p className="muted small" style={{ margin: 0 }}>
          Loading…
        </p>
      ) : templates.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>
          No saved workouts yet. Use Create workout below.
        </p>
      ) : (
        <ul className="quick-pick-templates__list" role="list">
          {templates.map((t) => {
            const n = Array.isArray(t.exercises) ? t.exercises.length : 0;
            const isStarting = startingTemplateId === t.id;
            const isCurrent = curWorkoutId != null && curWorkoutId === t.id;
            return (
              <li key={t.id} className="quick-pick-templates__item">
                <button
                  type="button"
                  className="quick-pick-templates__chip"
                  disabled={disabled || Boolean(startingTemplateId)}
                  onClick={() => onStartTemplate(t.id)}
                >
                  <span className="quick-pick-templates__name">{t.name || "Untitled"}</span>
                  <span className="quick-pick-templates__meta muted small">
                    {isStarting ? "Starting…" : `${n} ex`}
                    {isCurrent && !isStarting ? " · Current" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
