import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { BlockBuilder } from "../components/blocks/builder/BlockBuilder.jsx";
import { RirRpeToggleRow } from "../components/templates/RirRpeToggleRow.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import {
  createInitialExercises,
  exercisesToTemplateApi,
} from "../components/templates/workoutBuilderState.js";
import { loadEffortSignal, saveEffortSignal } from "../lib/effortSignalPref.js";

function stepFromTypeParam(searchParams) {
  const t = searchParams.get("type");
  if (t === "workout") return "workout";
  if (t === "block") return "block";
  return "choose";
}

export function CreateTemplatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(() => stepFromTypeParam(searchParams));
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setStep(stepFromTypeParam(searchParams));
  }, [searchParams]);

  /* Workout template */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState(createInitialExercises());
  const [effortSignal, setEffortSignal] = useState(() => loadEffortSignal());
  const useRIR = effortSignal === "rir";
  const useRPE = effortSignal === "rpe";
  const [useWorkoutDescription, setUseWorkoutDescription] = useState(false);
  const [useExerciseNotes, setUseExerciseNotes] = useState(false);
  const [useSetNotes, setUseSetNotes] = useState(false);
  const [workoutViewMode, setWorkoutViewMode] = useState("builder");
  const [workoutSubmitting, setWorkoutSubmitting] = useState(false);

  function resetFlow() {
    navigate("/create-template", { replace: true });
    setError(null);
    setName("");
    setDescription("");
    setIsPublic(false);
    setWorkoutExercises(createInitialExercises());
    setEffortSignal(loadEffortSignal());
    setUseWorkoutDescription(false);
    setUseExerciseNotes(false);
    setUseSetNotes(false);
    setWorkoutViewMode("builder");
  }

  async function onSubmitWorkout(e) {
    e.preventDefault();
    setWorkoutSubmitting(true);
    setError(null);
    try {
      if (!name.trim()) {
        setError(new Error("Workout name is required."));
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
        useRIR,
        useRPE,
        exercises,
      });
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setWorkoutSubmitting(false);
    }
  }

  if (step === "choose") {
    return (
      <div className="stack">
        <div>
          <h1>Create</h1>
          <p className="muted">
            A workout is one reusable template. A block is a multi-week plan with several workouts.
            Training sessions are separate — you record completed workouts under History.
          </p>
        </div>

        <div className="template-type-pick">
          <button
            type="button"
            className="card template-type-card template-type-card--featured"
            onClick={() => navigate("/create-template?type=block", { replace: true })}
          >
            <strong>Create block</strong>
            <p className="muted small" style={{ margin: 0 }}>
              Multi-week plan: several workouts across weeks. Saved to Programs.
            </p>
          </button>
          <button
            type="button"
            className="card template-type-card template-type-card--secondary"
            onClick={() => navigate("/create-template?type=workout", { replace: true })}
          >
            <strong>Create workout</strong>
            <p className="muted small" style={{ margin: 0 }}>
              One reusable workout with exercises and sets. Saved to Programs.
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
            <h1>New workout</h1>
            <p className="muted">
              Build exercises and sets, then save a reusable workout to your library. For a one-time
              session only, use <strong>Start workout</strong> on the Workout tab.
            </p>
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

          {useWorkoutDescription ? (
            <label>
              Description (optional)
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. upper day"
              />
            </label>
          ) : null}

          <label style={{ fontWeight: 600 }}>
            <span>Public</span>
            <label className="checkbox-inline" style={{ fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="muted small">
                Visible to others for clone/start. <strong>Beta:</strong> community sharing is still in progress.
              </span>
            </label>
          </label>

          <div className="template-options-grid">
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={useWorkoutDescription}
                onChange={(e) => setUseWorkoutDescription(e.target.checked)}
              />
              <span>Workout description</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={useExerciseNotes}
                onChange={(e) => setUseExerciseNotes(e.target.checked)}
              />
              <span>Exercise notes</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={useSetNotes}
                onChange={(e) => setUseSetNotes(e.target.checked)}
              />
              <span>Set notes</span>
            </label>
          </div>

          <div className="quick-log-display-prefs stack">
            <RirRpeToggleRow
              value={effortSignal}
              onChange={(next) => {
                setEffortSignal(next);
                saveEffortSignal(next);
              }}
            />
          </div>

          <ViewModeToggle value={workoutViewMode} onChange={setWorkoutViewMode} />

          {workoutViewMode === "builder" ? (
            <WorkoutBuilder
              exercises={workoutExercises}
              onExercisesChange={setWorkoutExercises}
              useRIR={useRIR}
              useRPE={useRPE}
              useExerciseNotes={useExerciseNotes}
              useSetNotes={useSetNotes}
              showSetCountSelect
            />
          ) : (
            <WorkoutTemplateTableView
              exercises={workoutExercises}
              useRIR={useRIR}
              useRPE={useRPE}
              useExerciseNotes={useExerciseNotes}
              useSetNotes={useSetNotes}
            />
          )}

          <div className="row">
            <button className="btn" disabled={workoutSubmitting}>
              {workoutSubmitting ? "Saving…" : "Save workout"}
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

  return <BlockBuilder mode="create" onBack={resetFlow} />;
}
