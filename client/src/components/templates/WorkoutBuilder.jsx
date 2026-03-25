import { ExerciseEditor } from "./ExerciseEditor.jsx";
import { createEmptyExercise } from "./workoutBuilderState.js";

/** Controlled list of exercises with per-exercise sets (reps, weight, optional RIR/RPE). */
export function WorkoutBuilder({ exercises, onExercisesChange }) {
  function updateExercise(idx, patch) {
    onExercisesChange(
      exercises.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex))
    );
  }

  function addExercise() {
    onExercisesChange([...exercises, createEmptyExercise()]);
  }

  function removeExercise(idx) {
    const next = exercises.filter((_, i) => i !== idx);
    onExercisesChange(next.length ? next : [createEmptyExercise()]);
  }

  return (
    <div className="stack">
      <div className="row">
        <h2 style={{ margin: 0 }}>Workout</h2>
        <button type="button" className="btn btn-secondary" onClick={addExercise}>
          Add exercise
        </button>
      </div>

      {exercises.map((ex, idx) => (
        <ExerciseEditor
          key={ex.id}
          exercise={ex}
          exerciseIndex={idx}
          onChange={(patch) => updateExercise(idx, patch)}
          onRemove={() => removeExercise(idx)}
          canRemove={exercises.length > 1}
        />
      ))}
    </div>
  );
}
