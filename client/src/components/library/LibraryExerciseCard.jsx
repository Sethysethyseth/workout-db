import { Card } from "../blocks/ui/index.js";
import { summarizeCustomExerciseMuscles } from "./meta.js";
import "../../styles/blocks/bk-library.css";

export function LibraryExerciseCard({ exercise: x, busy, isActing, actingAction, onDelete }) {
  const muscleSummary = summarizeCustomExerciseMuscles(x.muscles);

  return (
    <Card className="bk-lib-card">
      <div>
        <h2 className="bk-lib-card__title">{x.name}</h2>
        {muscleSummary ? <p className="bk-lib-card__meta">{muscleSummary}</p> : null}
      </div>
      <div className="bk-lib-card__secondary" style={{ borderTop: "none", paddingTop: 0 }}>
        <button
          type="button"
          className="bk-lib-btn bk-lib-btn--ghost bk-lib-btn--danger"
          onClick={() => onDelete(x)}
          disabled={busy}
        >
          {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Card>
  );
}
