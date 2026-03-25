import { SetRow } from "./SetRow.jsx";
import { createEmptySet } from "./workoutBuilderState.js";

export function ExerciseEditor({
  exercise,
  exerciseIndex,
  onChange,
  onRemove,
  canRemove,
}) {
  function updateSet(setIdx, patch) {
    const nextSets = exercise.sets.map((s, i) =>
      i === setIdx ? { ...s, ...patch } : s
    );
    onChange({ sets: nextSets });
  }

  function addSet() {
    onChange({ sets: [...exercise.sets, createEmptySet()] });
  }

  function removeSet(setIdx) {
    const next = exercise.sets.filter((_, i) => i !== setIdx);
    onChange({ sets: next.length ? next : [createEmptySet()] });
  }

  return (
    <div className="card stack exercise-editor">
      <div className="row">
        <strong>Exercise #{exerciseIndex + 1}</strong>
        {canRemove ? (
          <button type="button" className="btn btn-ghost" onClick={onRemove}>
            Remove exercise
          </button>
        ) : null}
      </div>

      <div className="grid-2">
        <label>
          Exercise name
          <input
            value={exercise.exerciseName}
            onChange={(e) => onChange({ exerciseName: e.target.value })}
            placeholder="Search / name (picker TBD)"
            required
          />
        </label>
        <label>
          Notes <span className="muted small">(optional)</span>
          <input
            value={exercise.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g. tempo, substitutions"
          />
        </label>
      </div>

      <div className="stack">
        <div className="row">
          <span className="muted small" style={{ fontWeight: 600 }}>
            Sets
          </span>
          <button type="button" className="btn btn-secondary" onClick={addSet}>
            Add set
          </button>
        </div>
        {exercise.sets.map((s, i) => (
          <SetRow
            key={s.id}
            setIndex={i}
            set={s}
            onChange={(patch) => updateSet(i, patch)}
            onRemove={() => removeSet(i)}
            canRemove={exercise.sets.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
