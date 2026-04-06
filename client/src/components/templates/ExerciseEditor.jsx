import { SetRow } from "./SetRow.jsx";
import { createEmptySet } from "./workoutBuilderState.js";

/** Upper range for the set-count select: always includes current length; headroom up to a soft cap. */
function maxSetCountOption(currentLen) {
  const bumped = Math.max(20, currentLen + 10);
  return Math.max(currentLen, Math.min(150, bumped));
}

export function ExerciseEditor({
  exercise,
  exerciseIndex,
  onChange,
  onRemove,
  canRemove,
  useRIR = false,
  useRPE = false,
  /** Block builder keeps bulk set count; saved workout templates use Add set only. */
  showSetCountSelect = false,
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

  function changeSetCount(nextCount) {
    const n = Number(nextCount);
    if (!Number.isInteger(n) || n < 1) return;
    const cur = exercise.sets;
    if (n === cur.length) return;
    let next;
    if (n < cur.length) {
      next = cur.slice(0, n);
    } else {
      next = [...cur];
      while (next.length < n) next.push(createEmptySet());
    }
    onChange({ sets: next.length ? next : [createEmptySet()] });
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
        <div className="exercise-editor-set-toolbar row">
          {showSetCountSelect ? (
            <label className="exercise-editor-set-count-label">
              <span className="muted small" style={{ fontWeight: 600 }}>
                Sets
              </span>
              <select
                aria-label="Number of sets"
                value={exercise.sets.length}
                onChange={(e) => changeSetCount(Number(e.target.value))}
              >
                {Array.from(
                  { length: maxSetCountOption(exercise.sets.length) },
                  (_, i) => i + 1
                ).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="btn btn-secondary exercise-editor-add-set-btn" onClick={addSet}>
            + Add set
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
            useRIR={useRIR}
            useRPE={useRPE}
          />
        ))}
      </div>
    </div>
  );
}
