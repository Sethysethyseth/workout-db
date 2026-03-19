import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";

function newExercise(order) {
  return {
    order,
    exerciseName: "",
    targetSets: "",
    targetReps: "",
    notes: "",
  };
}

export function TemplateNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [exercises, setExercises] = useState([newExercise(1)]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const normalizedExercises = useMemo(() => {
    return exercises.map((e, idx) => {
      const ex = {
        order: idx + 1,
        exerciseName: e.exerciseName,
      };
      if (e.targetSets !== "") ex.targetSets = Number(e.targetSets);
      if (e.targetReps !== "") ex.targetReps = e.targetReps;
      if (e.notes !== "") ex.notes = e.notes;
      return ex;
    });
  }, [exercises]);

  function updateExercise(idx, patch) {
    setExercises((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, ...patch } : e))
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, newExercise(prev.length + 1)]);
  }

  function removeExercise(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, order: i + 1 })));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        description: description.trim() ? description : null,
        isPublic,
        exercises: normalizedExercises,
      };
      await templateApi.createTemplate(payload);
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Create Template</h1>
        <p className="muted">Keep it simple: name + exercises.</p>
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
            placeholder="e.g. 3x/week strength"
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
            <span className="muted small">
              If public, other users can view and clone it.
            </span>
          </div>
        </label>

        <div className="stack">
          <div className="row">
            <h2 style={{ margin: 0 }}>Exercises</h2>
            <button type="button" className="btn btn-secondary" onClick={addExercise}>
              Add exercise
            </button>
          </div>

          {exercises.map((ex, idx) => (
            <div key={idx} className="card stack">
              <div className="row">
                <strong>#{idx + 1}</strong>
                {exercises.length > 1 ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeExercise(idx)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid-2">
                <label>
                  Exercise name
                  <input
                    value={ex.exerciseName}
                    onChange={(e) => updateExercise(idx, { exerciseName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Target sets (optional)
                  <input
                    value={ex.targetSets}
                    onChange={(e) => updateExercise(idx, { targetSets: e.target.value })}
                    inputMode="numeric"
                    placeholder="e.g. 3"
                  />
                </label>
              </div>

              <div className="grid-2">
                <label>
                  Target reps (optional)
                  <input
                    value={ex.targetReps}
                    onChange={(e) => updateExercise(idx, { targetReps: e.target.value })}
                    placeholder="e.g. 8"
                  />
                </label>
                <label>
                  Notes (optional)
                  <input
                    value={ex.notes}
                    onChange={(e) => updateExercise(idx, { notes: e.target.value })}
                    placeholder="e.g. work up to top set"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <button className="btn" disabled={submitting}>
            {submitting ? "Creating…" : "Create template"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/templates")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

