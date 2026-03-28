import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { BlockTemplateTableView } from "../components/templates/BlockTemplateTableView.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import {
  applyCopyPreviousWeek,
  blockTemplateToBlockWeeks,
  blockWeeksToApiPayload,
  isBlockWeekPristine,
  newBlockWeek,
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
  const [useRIR, setUseRIR] = useState(false);
  const [useRPE, setUseRPE] = useState(false);
  const [useDuration, setUseDuration] = useState(false);
  const [blockWeeks, setBlockWeeks] = useState(null);
  const [viewMode, setViewMode] = useState("builder");
  const [submitting, setSubmitting] = useState(false);
  const blockWeeksRef = useRef(null);
  blockWeeksRef.current = blockWeeks;

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
        setUseRIR(Boolean(t.useRIR));
        setUseRPE(Boolean(t.useRPE));
        setUseDuration(Boolean(t.useDuration));
        setBlockWeeks(blockTemplateToBlockWeeks(t));
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

  function addBlockWeek() {
    setBlockWeeks((prev) => [...prev, newBlockWeek()]);
  }

  function removeBlockWeek(weekIdx) {
    setBlockWeeks((prev) => {
      const next = prev.filter((_, i) => i !== weekIdx);
      return next.length ? next : [newBlockWeek()];
    });
  }

  function updateBlockWorkout(weekIdx, workoutIdx, patch) {
    setBlockWeeks((prev) =>
      prev.map((wk, i) => {
        if (i !== weekIdx) return wk;
        return {
          ...wk,
          workouts: wk.workouts.map((w, j) => (j === workoutIdx ? { ...w, ...patch } : w)),
        };
      })
    );
  }

  function addBlockWorkout(weekIdx) {
    setBlockWeeks((prev) =>
      prev.map((wk, i) =>
        i === weekIdx ? { ...wk, workouts: [...wk.workouts, newBlockWorkout()] } : wk
      )
    );
  }

  function removeBlockWorkout(weekIdx, workoutIdx) {
    setBlockWeeks((prev) =>
      prev.map((wk, i) => {
        if (i !== weekIdx) return wk;
        const next = wk.workouts.filter((_, j) => j !== workoutIdx);
        return { ...wk, workouts: next.length ? next : [newBlockWorkout()] };
      })
    );
  }

  function copyPreviousWeekInto(weekIdx) {
    if (weekIdx < 1) return;
    const prev = blockWeeksRef.current;
    if (!prev) return;
    const target = prev[weekIdx];
    const source = prev[weekIdx - 1];
    if (!target || !source) return;
    if (!isBlockWeekPristine(target)) {
      const ok = window.confirm(
        "Replace this week’s workouts and exercises with a copy of the previous week? This cannot be undone."
      );
      if (!ok) return;
    }
    setBlockWeeks((p) => applyCopyPreviousWeek(p, weekIdx));
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
      let durationField = null;
      if (useDuration) {
        const weeksRaw = durationWeeks.trim();
        if (weeksRaw !== "") {
          const weeks = Number(weeksRaw);
          if (!Number.isInteger(weeks) || weeks <= 0) {
            setError(new Error("Duration in weeks must be a positive whole number."));
            return;
          }
          durationField = weeks;
        }
      }

      const weeksPayload = blockWeeksToApiPayload(blockWeeks);
      const invalid = weeksPayload.some((week) =>
        week.workouts.some((w) => w.exercises.some((ex) => !ex.exerciseName))
      );
      if (invalid) {
        setError(new Error("Each exercise in every workout needs a name."));
        return;
      }

      await blockTemplateApi.updateBlockTemplate(templateId, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        isPublic,
        useRIR,
        useRPE,
        useDuration,
        durationWeeks: useDuration ? durationField : null,
        weeks: weeksPayload,
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

  if (!blockWeeks) {
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
          <p className="muted">Update weeks, workouts, exercises, and visibility.</p>
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
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={useDuration}
                onChange={(e) => setUseDuration(e.target.checked)}
              />
              <span>Use duration (weeks)</span>
            </label>
          </div>

          {useDuration ? (
            <label>
              Duration (weeks)
              <input
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                inputMode="numeric"
                placeholder="Optional"
              />
            </label>
          ) : null}
        </div>

        <div className="row">
          <h2 style={{ margin: 0 }}>Weeks and workouts</h2>
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            {viewMode === "builder" ? (
              <button type="button" className="btn btn-secondary" onClick={addBlockWeek}>
                Add week
              </button>
            ) : null}
          </div>
        </div>

        {viewMode === "builder" ? (
          blockWeeks.map((week, weekIdx) => (
            <div key={week.id} className="card stack">
              <div className="row" style={{ alignItems: "center" }}>
                <h3 style={{ margin: 0, flex: 1 }}>Week {weekIdx + 1}</h3>
                <div className="row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {weekIdx > 0 ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copyPreviousWeekInto(weekIdx)}
                    >
                      Copy previous week
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => addBlockWorkout(weekIdx)}
                  >
                    Add workout
                  </button>
                  {blockWeeks.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeBlockWeek(weekIdx)}
                    >
                      Remove week
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="stack">
                {week.workouts.map((w, workoutIdx) => (
                  <div key={w.id} className="card stack" style={{ margin: 0 }}>
                    <div className="row">
                      <label style={{ flex: 1, margin: 0 }}>
                        Workout label
                        <input
                          value={w.title}
                          onChange={(e) =>
                            updateBlockWorkout(weekIdx, workoutIdx, { title: e.target.value })
                          }
                          placeholder={`Workout ${workoutIdx + 1}`}
                        />
                      </label>
                      {week.workouts.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeBlockWorkout(weekIdx, workoutIdx)}
                        >
                          Remove workout
                        </button>
                      ) : null}
                    </div>
                    <WorkoutBuilder
                      exercises={w.exercises}
                      onExercisesChange={(next) => {
                        updateBlockWorkout(weekIdx, workoutIdx, { exercises: next });
                      }}
                      useRIR={useRIR}
                      useRPE={useRPE}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <BlockTemplateTableView
            blockWeeks={blockWeeks}
            useRIR={useRIR}
            useRPE={useRPE}
            useDuration={useDuration}
            durationWeeks={durationWeeks}
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
