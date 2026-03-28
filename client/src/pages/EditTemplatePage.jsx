/**
 * Edit persisted workout templates. Block templates use EditBlockTemplatePage.
 * Set-level fields round-trip via templateSets; per-set notes on the server are not in the builder UI (see workoutBuilderState.js).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import {
  exercisesToTemplateApi,
  templateToBuilderExercises,
} from "../components/templates/workoutBuilderState.js";

export function EditTemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const templateId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState(null);
  const [useRIR, setUseRIR] = useState(false);
  const [useRPE, setUseRPE] = useState(false);
  const [viewMode, setViewMode] = useState("builder");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!Number.isInteger(templateId) || templateId <= 0) {
        setError(new Error("Invalid template id."));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await templateApi.getTemplate(templateId);
        if (cancelled) return;
        const t = data.template;
        setName(t.name || "");
        setDescription(t.description || "");
        setIsPublic(Boolean(t.isPublic));
        setUseRIR(Boolean(t.useRIR));
        setUseRPE(Boolean(t.useRPE));
        setWorkoutExercises(templateToBuilderExercises(t));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
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
      await templateApi.updateTemplate(templateId, {
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
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!workoutExercises) {
    return (
      <div className="stack">
        <ErrorMessage error={error} />
        <Link className="btn" to="/templates">
          Back to templates
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Edit workout template</h1>
          <p className="muted">Update exercises and visibility; changes apply to this template only.</p>
        </div>
        <Link className="btn btn-secondary" to="/templates">
          Cancel
        </Link>
      </div>

      <ErrorMessage error={error} />

      <form className="card stack" onSubmit={onSubmit}>
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

        <div className="template-options-grid">
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={useRIR}
              onChange={(e) => setUseRIR(e.target.checked)}
            />
            <span>Use RIR on sets</span>
          </label>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={useRPE}
              onChange={(e) => setUseRPE(e.target.checked)}
            />
            <span>Use RPE on sets</span>
          </label>
        </div>

        <ViewModeToggle value={viewMode} onChange={setViewMode} />

        {viewMode === "builder" ? (
          <WorkoutBuilder
            exercises={workoutExercises}
            onExercisesChange={setWorkoutExercises}
            useRIR={useRIR}
            useRPE={useRPE}
          />
        ) : (
          <WorkoutTemplateTableView
            exercises={workoutExercises}
            useRIR={useRIR}
            useRPE={useRPE}
          />
        )}

        <div className="row">
          <button className="btn" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
