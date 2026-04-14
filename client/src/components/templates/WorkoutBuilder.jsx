import { ExerciseEditor } from "./ExerciseEditor.jsx";
import { createEmptyExercise } from "./workoutBuilderState.js";

/** Controlled list of exercises with per-exercise sets (reps, weight, optional RIR/RPE). */
export function WorkoutBuilder({
  exercises,
  onExercisesChange,
  useRIR = false,
  useRPE = false,
  useExerciseNotes = false,
  useSetNotes = false,
  showSetCountSelect = false,
}) {
  function updateExercise(idx, patch) {
    onExercisesChange(
      exercises.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex))
    );
  }

  function insertExerciseAt(insertIndex) {
    const i = Math.max(0, Math.min(insertIndex, exercises.length));
    const next = [...exercises];
    next.splice(i, 0, createEmptyExercise());
    onExercisesChange(next);
  }

  function removeExercise(idx) {
    const next = exercises.filter((_, i) => i !== idx);
    onExercisesChange(next.length ? next : [createEmptyExercise()]);
  }

  return (
    <div className="stack workout-builder">
      <div className="row">
        <h2 style={{ margin: 0 }}>Workout</h2>
      </div>

      {exercises.map((ex, idx) => (
        <div key={ex.id} className="workout-builder-exercise-block stack">
          <ExerciseEditor
            exercise={ex}
            exerciseIndex={idx}
            onChange={(patch) => updateExercise(idx, patch)}
            onRemove={() => removeExercise(idx)}
            canRemove={exercises.length > 1}
            useRIR={useRIR}
            useRPE={useRPE}
            useExerciseNotes={useExerciseNotes}
            useSetNotes={useSetNotes}
            showSetCountSelect={showSetCountSelect}
          />
        </div>
      ))}

      <div className="workout-builder-append">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => insertExerciseAt(exercises.length)}
        >
          + Add exercise
        </button>
      </div>
    </div>
  );
}
