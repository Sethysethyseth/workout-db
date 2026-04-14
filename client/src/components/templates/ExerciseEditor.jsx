import { ExerciseNameInput } from "./ExerciseNameInput.jsx";
import { PlanningSetCountControl } from "./PlanningSetCountControl.jsx";
import { SetRow } from "./SetRow.jsx";
import { createEmptySet } from "./workoutBuilderState.js";

export function ExerciseEditor({
  exercise,
  exerciseIndex,
  onChange,
  onRemove,
  canRemove,
  useRIR = false,
  useRPE = false,
  useExerciseNotes = false,
  useSetNotes = false,
  /** Block / template builders use bulk set count; turn off for flows that should not show it. */
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

      <div className={useExerciseNotes ? "grid-2" : "stack"} style={{ gap: useExerciseNotes ? undefined : 8 }}>
        <label>
          Exercise name
          <ExerciseNameInput
            id={`exercise-name-${exercise.id}`}
            value={exercise.exerciseName}
            onChange={(e) => onChange({ exerciseName: e.target.value })}
            placeholder="Type or pick a suggestion"
          />
        </label>
        {useExerciseNotes ? (
          <label>
            Notes <span className="muted small">(optional)</span>
            <input
              value={exercise.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="—"
            />
          </label>
        ) : null}
      </div>

      <div className="stack">
        <div className="exercise-editor-set-toolbar row">
          {showSetCountSelect ? (
            <PlanningSetCountControl
              value={exercise.sets.length}
              onChange={changeSetCount}
            />
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
            useSetNotes={useSetNotes}
          />
        ))}
      </div>
    </div>
  );
}
