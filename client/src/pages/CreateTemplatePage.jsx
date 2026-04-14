import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { BlockTemplateTableView } from "../components/templates/BlockTemplateTableView.jsx";
import { BlockWeeksBuilder } from "../components/templates/BlockWeeksBuilder.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutBuilder } from "../components/templates/WorkoutBuilder.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import {
  applyCopyPreviousWeek,
  blockWeeksToApiPayload,
  createInitialExercises,
  exercisesToTemplateApi,
  isBlockWeekPristine,
  newBlockWeek,
  newBlockWorkout,
  parseBlockDurationWeekCap,
} from "../components/templates/workoutBuilderState.js";

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
  const [useRIR, setUseRIR] = useState(false);
  const [useRPE, setUseRPE] = useState(false);
  const [useWorkoutDescription, setUseWorkoutDescription] = useState(false);
  const [useExerciseNotes, setUseExerciseNotes] = useState(false);
  const [useSetNotes, setUseSetNotes] = useState(false);
  const [workoutViewMode, setWorkoutViewMode] = useState("builder");
  const [workoutSubmitting, setWorkoutSubmitting] = useState(false);

  /* Block template */
  const [blockName, setBlockName] = useState("");
  const [blockDescription, setBlockDescription] = useState("");
  const [blockIsPublic, setBlockIsPublic] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState("");
  const [blockUseRIR, setBlockUseRIR] = useState(false);
  const [blockUseRPE, setBlockUseRPE] = useState(false);
  const [blockUseDescription, setBlockUseDescription] = useState(false);
  const [blockUseExerciseNotes, setBlockUseExerciseNotes] = useState(false);
  const [blockUseSetNotes, setBlockUseSetNotes] = useState(false);
  const [blockUseDuration, setBlockUseDuration] = useState(false);
  const [blockWeeks, setBlockWeeks] = useState(() => [newBlockWeek()]);
  const [blockViewMode, setBlockViewMode] = useState("builder");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const blockWeeksRef = useRef(blockWeeks);
  blockWeeksRef.current = blockWeeks;

  function resetFlow() {
    navigate("/create-template", { replace: true });
    setError(null);
    setName("");
    setDescription("");
    setIsPublic(false);
    setWorkoutExercises(createInitialExercises());
    setUseRIR(false);
    setUseRPE(false);
    setUseWorkoutDescription(false);
    setUseExerciseNotes(false);
    setUseSetNotes(false);
    setWorkoutViewMode("builder");
    setBlockName("");
    setBlockDescription("");
    setBlockIsPublic(false);
    setDurationWeeks("");
    setBlockUseRIR(false);
    setBlockUseRPE(false);
    setBlockUseDescription(false);
    setBlockUseExerciseNotes(false);
    setBlockUseSetNotes(false);
    setBlockUseDuration(false);
    setBlockWeeks([newBlockWeek()]);
    setBlockViewMode("builder");
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

  async function onSubmitBlock(e) {
    e.preventDefault();
    setBlockSubmitting(true);
    setError(null);
    try {
      if (!blockName.trim()) {
        setError(new Error("Block name is required."));
        return;
      }
      let durationField = null;
      if (blockUseDuration) {
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

      const durationCap = parseBlockDurationWeekCap(blockUseDuration, durationWeeks);
      if (durationCap != null && blockWeeks.length > durationCap) {
        setError(
          new Error(
            `This block has ${blockWeeks.length} weeks but duration is set to ${durationCap}. Remove weeks or increase duration before saving.`
          )
        );
        return;
      }

      await blockTemplateApi.createBlockTemplate({
        name: blockName.trim(),
        description: blockDescription.trim() ? blockDescription.trim() : null,
        isPublic: blockIsPublic,
        useRIR: blockUseRIR,
        useRPE: blockUseRPE,
        useDuration: blockUseDuration,
        durationWeeks: blockUseDuration ? durationField : null,
        weeks: weeksPayload,
      });
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setBlockSubmitting(false);
    }
  }

  function addBlockWeek() {
    const cap = parseBlockDurationWeekCap(blockUseDuration, durationWeeks);
    if (cap != null && blockWeeks.length >= cap) return;
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
    const target = prev[weekIdx];
    const source = prev[weekIdx - 1];
    if (!target || !source) return;
    if (!isBlockWeekPristine(target)) {
      const ok = window.confirm(
        "Replace this week’s workouts and exercises with a copy of the previous week? This cannot be undone."
      );
      if (!ok) return;
    }
    setBlockWeeks((p) => applyCopyPreviousWeek(p, weekIdx)    );
  }

  const blockDurationCap = parseBlockDurationWeekCap(blockUseDuration, durationWeeks);
  const blockAtMaxWeeks = blockDurationCap != null && blockWeeks.length >= blockDurationCap;
  const blockDurationTooSmall =
    blockDurationCap != null && blockWeeks.length > blockDurationCap;

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
              Build exercises and sets, then save a reusable workout to your library.               For a one-time session only, use <strong>Log workout</strong> on Home.
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

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>New block</h1>
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

          {blockUseDescription ? (
            <label>
              Description (optional)
              <textarea
                value={blockDescription}
                onChange={(e) => setBlockDescription(e.target.value)}
                placeholder="Goals, progression, notes"
              />
            </label>
          ) : null}

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

          <div className="template-options-grid">
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseDescription}
                onChange={(e) => setBlockUseDescription(e.target.checked)}
              />
              <span>Block description</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseExerciseNotes}
                onChange={(e) => setBlockUseExerciseNotes(e.target.checked)}
              />
              <span>Exercise notes</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseSetNotes}
                onChange={(e) => setBlockUseSetNotes(e.target.checked)}
              />
              <span>Set notes</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseRIR}
                onChange={(e) => setBlockUseRIR(e.target.checked)}
              />
              <span>Use RIR on sets</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseRPE}
                onChange={(e) => setBlockUseRPE(e.target.checked)}
              />
              <span>Use RPE on sets</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={blockUseDuration}
                onChange={(e) => setBlockUseDuration(e.target.checked)}
              />
              <span>Use duration (weeks)</span>
            </label>
          </div>

          {blockUseDuration ? (
            <label>
              Duration (weeks)
              <input
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 4 (optional)"
                aria-invalid={blockDurationTooSmall || undefined}
              />
              {blockDurationTooSmall ? (
                <span className="field-hint-warn">
                  Duration ({blockDurationCap} weeks) is below this block’s {blockWeeks.length} weeks.
                  Remove weeks or raise duration before saving.
                </span>
              ) : null}
            </label>
          ) : null}
        </div>

        <div className="row">
          <h2 style={{ margin: 0 }}>Weeks and workouts</h2>
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            <ViewModeToggle value={blockViewMode} onChange={setBlockViewMode} />
            {blockViewMode === "builder" ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addBlockWeek}
                disabled={blockAtMaxWeeks}
                title={blockAtMaxWeeks ? `Max weeks reached (${blockDurationCap})` : undefined}
              >
                Add week
              </button>
            ) : null}
          </div>
        </div>
        {blockViewMode === "builder" && blockAtMaxWeeks ? (
          <p className="muted small" style={{ margin: "-4px 0 0" }}>
            Max weeks reached ({blockDurationCap})
          </p>
        ) : null}

        {blockViewMode === "builder" ? (
          <BlockWeeksBuilder
            blockWeeks={blockWeeks}
            useRIR={blockUseRIR}
            useRPE={blockUseRPE}
            useExerciseNotes={blockUseExerciseNotes}
            useSetNotes={blockUseSetNotes}
            onRemoveWeek={removeBlockWeek}
            onUpdateBlockWorkout={updateBlockWorkout}
            onAddBlockWorkout={addBlockWorkout}
            onRemoveBlockWorkout={removeBlockWorkout}
            onCopyPreviousWeek={copyPreviousWeekInto}
          />
        ) : (
          <BlockTemplateTableView
            blockWeeks={blockWeeks}
            useRIR={blockUseRIR}
            useRPE={blockUseRPE}
            useExerciseNotes={blockUseExerciseNotes}
            useSetNotes={blockUseSetNotes}
            useDuration={blockUseDuration}
            durationWeeks={durationWeeks}
          />
        )}

        <div className="row">
          <button
            className="btn"
            type="submit"
            disabled={blockSubmitting || blockDurationTooSmall}
          >
            {blockSubmitting ? "Saving…" : "Save block"}
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
