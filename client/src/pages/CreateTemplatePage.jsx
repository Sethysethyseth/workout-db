import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import {
  blockWorkoutsToApiPayload,
  createInitialExercises,
  exercisesToTemplateApi,
  newBlockWorkout,
} from "../components/templates/workoutBuilderState.js";

export function CreateTemplatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("choose");
  const [error, setError] = useState(null);

  /* Workout template */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState(createInitialExercises());
  const [workoutSubmitting, setWorkoutSubmitting] = useState(false);

  /* Block template */
  const [blockName, setBlockName] = useState("");
  const [blockDescription, setBlockDescription] = useState("");
  const [blockIsPublic, setBlockIsPublic] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState("");
  const [blockWorkouts, setBlockWorkouts] = useState(() => [newBlockWorkout()]);
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  function resetFlow() {
    setStep("choose");
    setError(null);
    setName("");
    setDescription("");
    setIsPublic(false);
    setWorkoutExercises(createInitialExercises());
    setBlockName("");
    setBlockDescription("");
    setBlockIsPublic(false);
    setDurationWeeks("");
    setBlockWorkouts([newBlockWorkout()]);
  }

  async function onSubmitWorkout(e) {
    e.preventDefault();
    setWorkoutSubmitting(true);
    setError(null);
    try {
      if (!name.trim()) {
        setError(new Error("Template name is required."));
        return;
      }
      const exercises = exercisesToTemplateApi(workoutExercises);
      const invalid = exercises.some((ex) => !ex.exerciseName);
      if (invalid) {
        setError(new Error("Each exercise needs a name."));
        return;
      }
      await templateApi.createTemplate({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        isPublic,
        exercises,
      });
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setWorkoutSubmitting(false);
    }
  }

  async function onSubmitBlock(e) {
    e.preventDefault();
    setBlockSubmitting(true);
    setError(null);
    try {
      if (!blockName.trim()) {
        setError(new Error("Block name is required."));
        return;
      }
      const weeksRaw = durationWeeks.trim();
      let durationField = null;
      if (weeksRaw !== "") {
        const weeks = Number(weeksRaw);
        if (!Number.isInteger(weeks) || weeks <= 0) {
          setError(new Error("Duration in weeks must be a positive whole number."));
          return;
        }
        durationField = weeks;
      }

      const workouts = blockWorkoutsToApiPayload(blockWorkouts);
      const invalid = workouts.some((w) => w.exercises.some((ex) => !ex.exerciseName));
      if (invalid) {
        setError(new Error("Each exercise in every workout needs a name."));
        return;
      }

      await blockTemplateApi.createBlockTemplate({
        name: blockName.trim(),
        description: blockDescription.trim() ? blockDescription.trim() : null,
        isPublic: blockIsPublic,
        durationWeeks: durationField,
        workouts,
      });
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setBlockSubmitting(false);
    }
  }

  function updateBlockWorkout(idx, patch) {
    setBlockWorkouts((prev) =>
      prev.map((w, i) => (i === idx ? { ...w, ...patch } : w))
    );
  }

  function addBlockWorkout() {
    setBlockWorkouts((prev) => [...prev, newBlockWorkout()]);
  }

  function removeBlockWorkout(idx) {
    setBlockWorkouts((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [newBlockWorkout()];
    });
  }

  if (step === "choose") {
    return (
      <div className="stack">
        <div>
          <h1>Create template</h1>
          <p className="muted">
            Workout templates are single reusable workouts. Block templates group several
            workouts (e.g. a training week or mesocycle). Sessions stay separate — you log
            completed workouts under Sessions.
          </p>
        </div>

        <div className="template-type-pick">
          <button
            type="button"
            className="card template-type-card"
            onClick={() => {
              setStep("workout");
              setError(null);
            }}
          >
            <strong>Workout Template</strong>
            <p className="muted small" style={{ margin: 0 }}>
              One workout with exercises and sets. Saved to your library.
            </p>
          </button>
          <button
            type="button"
            className="card template-type-card"
            onClick={() => {
              setStep("block");
              setError(null);
            }}
          >
            <strong>Block Template</strong>
            <p className="muted small" style={{ margin: 0 }}>
              Duration in weeks and multiple workouts, each with its own builder. Saved to your
              library.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "workout") {
    return (
      <div className="stack">
        <div className="row">
          <div>
            <h1>New workout template</h1>
            <p className="muted">Build exercises and target sets; then save.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={resetFlow}>
            Back
          </button>
        </div>

        <ErrorMessage error={error} />

        <form className="card stack" onSubmit={onSubmitWorkout}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. upper day"
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            <span>Public</span>
            <div className="row">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="muted small">Visible to others for clone/start.</span>
            </div>
          </label>

          <WorkoutBuilder exercises={workoutExercises} onExercisesChange={setWorkoutExercises} />

          <div className="row">
            <button className="btn" disabled={workoutSubmitting}>
              {workoutSubmitting ? "Saving…" : "Create template"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/templates")}
              disabled={workoutSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>New block template</h1>
          <p className="muted">Plan multiple workouts and save to your library.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={resetFlow}>
          Back
        </button>
      </div>

      <ErrorMessage error={error} />

      <form className="stack" onSubmit={onSubmitBlock}>
        <div className="card stack">
          <label>
            Name
            <input
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              required
              placeholder="e.g. 4-week strength block"
            />
          </label>

          <label>
            Description (optional)
            <textarea
              value={blockDescription}
              onChange={(e) => setBlockDescription(e.target.value)}
              placeholder="Goals, progression, notes"
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            <span>Public</span>
            <div className="row">
              <input
                type="checkbox"
                checked={blockIsPublic}
                onChange={(e) => setBlockIsPublic(e.target.checked)}
              />
              <span className="muted small">Visible to others for clone.</span>
            </div>
          </label>

          <label>
            Duration (weeks)
            <input
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 4 (optional)"
            />
          </label>
        </div>

        <div className="row">
          <h2 style={{ margin: 0 }}>Workouts in this block</h2>
          <button type="button" className="btn btn-secondary" onClick={addBlockWorkout}>
            Add workout
          </button>
        </div>

        {blockWorkouts.map((w, idx) => (
          <div key={w.id} className="card stack">
            <div className="row">
              <label style={{ flex: 1, margin: 0 }}>
                Workout label
                <input
                  value={w.title}
                  onChange={(e) => updateBlockWorkout(idx, { title: e.target.value })}
                  placeholder={`Workout ${idx + 1}`}
                />
              </label>
              {blockWorkouts.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => removeBlockWorkout(idx)}
                >
                  Remove workout
                </button>
              ) : null}
            </div>
            <WorkoutBuilder
              exercises={w.exercises}
              onExercisesChange={(next) => {
                updateBlockWorkout(idx, { exercises: next });
              }}
            />
          </div>
        ))}

        <div className="row">
          <button className="btn" type="submit" disabled={blockSubmitting}>
            {blockSubmitting ? "Saving…" : "Create block template"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/templates")}
            disabled={blockSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
