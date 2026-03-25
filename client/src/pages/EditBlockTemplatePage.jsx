import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import {
  blockTemplateToBlockWorkouts,
  blockWorkoutsToApiPayload,
  newBlockWorkout,
} from "../components/templates/workoutBuilderState.js";

export function EditBlockTemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const templateId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState("");
  const [blockWorkouts, setBlockWorkouts] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!Number.isInteger(templateId) || templateId <= 0) {
        setError(new Error("Invalid block template id."));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await blockTemplateApi.getBlockTemplate(templateId);
        if (cancelled) return;
        const t = data.blockTemplate;
        setName(t.name || "");
        setDescription(t.description || "");
        setIsPublic(Boolean(t.isPublic));
        setDurationWeeks(t.durationWeeks != null ? String(t.durationWeeks) : "");
        setBlockWorkouts(blockTemplateToBlockWorkouts(t));
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

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!name.trim()) {
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

      await blockTemplateApi.updateBlockTemplate(templateId, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        isPublic,
        durationWeeks: durationField,
        workouts,
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

  if (!blockWorkouts) {
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
          <h1>Edit block template</h1>
          <p className="muted">Update workouts, exercises, and visibility.</p>
        </div>
        <Link className="btn btn-secondary" to="/templates">
          Cancel
        </Link>
      </div>

      <ErrorMessage error={error} />

      <form className="stack" onSubmit={onSubmit}>
        <div className="card stack">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, progression, notes"
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
              <span className="muted small">Visible to others for clone.</span>
            </div>
          </label>

          <label>
            Duration (weeks)
            <input
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              inputMode="numeric"
              placeholder="Optional"
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
          <button className="btn" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
