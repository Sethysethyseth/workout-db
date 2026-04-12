import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import { WorkoutSetRowShell } from "../components/workout/WorkoutSetRowShell.jsx";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function nextSetOrder(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  const max = sets.reduce((acc, s) => (s.order > acc ? s.order : acc), 0);
  return max + 1;
}

/** Same field layout as `ExerciseEditor` (Create Workout); persists via session exercise API. */
function SessionExerciseFields({
  sessionExercise,
  sessionId,
  disabled,
  onSaved,
}) {
  const [name, setName] = useState(sessionExercise.exerciseName);
  const [notes, setNotes] = useState(sessionExercise.notes ?? "");
  const [fieldError, setFieldError] = useState(null);

  useEffect(() => {
    setName(sessionExercise.exerciseName);
    setNotes(sessionExercise.notes ?? "");
  }, [sessionExercise.id, sessionExercise.exerciseName, sessionExercise.notes]);

  async function commitExercise(patch) {
    if (disabled) return;
    setFieldError(null);
    try {
      await sessionApi.updateSessionExercise(sessionId, sessionExercise.id, patch);
      await onSaved();
    } catch (err) {
      setName(sessionExercise.exerciseName);
      setNotes(sessionExercise.notes ?? "");
      setFieldError(err);
    }
  }

  async function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(sessionExercise.exerciseName);
      return;
    }
    if (trimmed === sessionExercise.exerciseName) return;
    await commitExercise({ exerciseName: trimmed });
  }

  async function commitNotes() {
    const n = notes.trim();
    const prev = (sessionExercise.notes ?? "").trim();
    if (n === prev) return;
    await commitExercise({ notes: n ? n : null });
  }

  if (disabled) {
    return (
      <div className="grid-2">
        <div>
          <div className="muted small" style={{ fontWeight: 600 }}>
            Exercise name
          </div>
          <div style={{ marginTop: 6 }}>{sessionExercise.exerciseName}</div>
        </div>
        <div>
          <div className="muted small" style={{ fontWeight: 600 }}>
            Notes <span className="muted small">(optional)</span>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            {sessionExercise.notes?.trim() ? sessionExercise.notes : "—"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="grid-2">
        <label>
          Exercise name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              void commitName();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Search / name (picker TBD)"
            required
          />
        </label>
        <label>
          Notes <span className="muted small">(optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              void commitNotes();
            }}
            placeholder="e.g. tempo, substitutions"
          />
        </label>
      </div>
      {fieldError ? <ErrorMessage error={fieldError} /> : null}
    </div>
  );
}

/**
 * One exercise + sets — mirrors `ExerciseEditor` + `WorkoutBuilder` exercise block structure.
 * Heading shows live set count (e.g. Bench · 3 sets). Session has no “remove exercise” API.
 */
function SessionExerciseBlock({
  se,
  sets,
  sessionId,
  isCompleted,
  showPlannedTargets,
  useRIR,
  useRPE,
  onSaved,
  onCreateSet,
  onUpdateSet,
  onDeleteSet,
}) {
  const namePart = se.exerciseName?.trim() ? se.exerciseName.trim() : `Exercise ${se.order}`;
  const setCountLabel = `${sets.length} ${sets.length === 1 ? "set" : "sets"}`;

  return (
    <div className="card stack exercise-editor">
      <div className="row session-exercise-heading-row">
        <strong className="session-exercise-heading">
          {namePart} · {setCountLabel}
        </strong>
      </div>

      <SessionExerciseFields
        sessionExercise={se}
        sessionId={sessionId}
        disabled={isCompleted}
        onSaved={onSaved}
      />

      {showPlannedTargets ? (
        <div className="muted small">
          Planned: {se.targetSets != null ? `${se.targetSets} sets` : "—"} ·{" "}
          {se.targetReps ? `${se.targetReps} reps` : "—"}
        </div>
      ) : null}

      <div className="stack">
        <div className="exercise-editor-set-toolbar row">
          <span className="muted small" style={{ fontWeight: 600 }}>
            Sets
          </span>
          {!isCompleted ? (
            <button
              type="button"
              className="btn btn-secondary exercise-editor-add-set-btn"
              onClick={() => onCreateSet(se.id)}
            >
              + Add set
            </button>
          ) : null}
        </div>

        {sets.length === 0 ? (
          <div className="muted small session-empty-sets">No sets yet—tap + Add set.</div>
        ) : (
          <div className="stack">
            {sets.map((s, setIdx) => (
              <SessionSetRow
                key={s.id}
                set={s}
                setOrdinal={setIdx + 1}
                lockSetOrder
                disabled={isCompleted}
                useRIR={useRIR}
                useRPE={useRPE}
                onUpdate={(patch) => onUpdateSet(s.id, patch)}
                onDelete={() => onDeleteSet(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [sessionNotesDraft, setSessionNotesDraft] = useState("");
  const [liveViewMode, setLiveViewMode] = useState("builder");
  const [liveUseRIR, setLiveUseRIR] = useState(false);
  const [liveUseRPE, setLiveUseRPE] = useState(false);

  const isCompleted = Boolean(session?.completedAt);

  const setsByExercise = useMemo(() => {
    const sets = Array.isArray(session?.sets) ? session.sets : [];
    const map = new Map();
    for (const s of sets) {
      const key = s.sessionExerciseId ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [session]);

  const tableExercises = useMemo(() => {
    const ex = session?.sessionExercises;
    if (!Array.isArray(ex)) return [];
    const sorted = [...ex].sort((a, b) => a.order - b.order);
    return sorted.map((se) => {
      const sets = setsByExercise.get(se.id) || [];
      return {
        id: se.id,
        exerciseName: se.exerciseName,
        notes: se.notes ?? "",
        sets: sets.map((s) => ({
          id: s.id,
          weight: s.weight ?? "",
          reps: s.reps ?? "",
          rir: s.rir ?? "",
          rpe: s.rpe ?? "",
        })),
      };
    });
  }, [session?.sessionExercises, setsByExercise]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionApi.getSessionById(sessionId);
      setSession(data.session);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      setError(new Error("Invalid session id"));
      setLoading(false);
      return;
    }
    load();
  }, [sessionId, load]);

  useEffect(() => {
    if (session) setSessionNotesDraft(session.notes ?? "");
  }, [session?.id, session?.notes]);

  async function onComplete() {
    setError(null);
    try {
      const data = await sessionApi.completeSession(sessionId);
      setSession(data.session);
    } catch (err) {
      setError(err);
    }
  }

  async function onCreateSetForExercise(sessionExerciseId) {
    setError(null);
    try {
      const order = nextSetOrder(session);
      const setsList = setsByExercise.get(sessionExerciseId) || [];
      const last = setsList.length ? setsList[setsList.length - 1] : null;
      const body = { sessionExerciseId, order };
      if (last) {
        if (last.reps != null) body.reps = last.reps;
        if (last.weight != null) body.weight = last.weight;
        if (last.rpe != null) body.rpe = last.rpe;
        if (last.rir != null) body.rir = last.rir;
        const note = last.notes != null ? String(last.notes).trim() : "";
        if (note) body.notes = note;
      }
      await sessionApi.createSet(sessionId, body);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function onUpdateSet(setId, patch) {
    setError(null);
    try {
      await sessionApi.updateSet(setId, patch);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function onDeleteSet(setId) {
    if (!confirm("Delete this set?")) return;
    setError(null);
    try {
      await sessionApi.deleteSet(setId);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function onAppendExercise() {
    setError(null);
    setAddingExercise(true);
    try {
      await sessionApi.addSessionExercise(sessionId, { exerciseName: "New exercise" });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setAddingExercise(false);
    }
  }

  async function commitSessionNotes() {
    if (!session || session.completedAt) return;
    const n = sessionNotesDraft.trim();
    const prev = (session.notes ?? "").trim();
    if (n === prev) return;
    setError(null);
    try {
      await sessionApi.updateSession(sessionId, { notes: n ? n : null });
      await load();
    } catch (err) {
      setError(err);
      setSessionNotesDraft(session.notes ?? "");
    }
  }

  if (loading) return <LoadingState label="Loading workout…" />;

  const isFromTemplate = Boolean(session?.workoutTemplate);
  const isQuickLog = !isFromTemplate;
  const useLiveBuilderUX = !isCompleted;
  const inLiveBuilder = useLiveBuilderUX && liveViewMode === "builder";
  const inLiveTable = useLiveBuilderUX && liveViewMode === "table";

  const sourceSummary = isFromTemplate
    ? `Saved workout: ${session.workoutTemplate.name}`
    : "Quick log (one-time)";

  const pageTitle = isCompleted ? "Workout summary" : "Log workout";

  const sessionExercises = session?.sessionExercises || [];
  const totalSetsLogged = Array.isArray(session?.sets) ? session.sets.length : 0;
  const canFinishWorkout = totalSetsLogged >= 1;
  const workoutTitle = session ? sessionDisplayTitle(session) : "Workout";
  const readonlyWorkoutName = isFromTemplate ? session.workoutTemplate.name : "Quick workout";

  function goBackFromSession() {
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  return (
    <div className="stack session-detail-page">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 6 }}>{pageTitle}</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {isCompleted ? (
              <>
                Read-only · {sourceSummary} · finished {formatDate(session?.completedAt)}
              </>
            ) : (
              <>
                Live session — updates save as you go.{" "}
                {isFromTemplate ? `Started from ${session.workoutTemplate.name}.` : "One-time session."}
              </>
            )}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={goBackFromSession}>
          Back
        </button>
      </div>

      {isCompleted && isQuickLog ? (
        <p className="muted small session-summary-footnote" style={{ margin: 0 }}>
          One-time session—saved in History only, not as a reusable workout.
        </p>
      ) : null}

      <ErrorMessage error={error} />

      {!isCompleted ? (
        <div className="card stack session-log-workout-form">
          <label>
            Name
            <input readOnly value={readonlyWorkoutName} className="session-readonly-input" />
          </label>
          {!isFromTemplate ? (
            <p className="muted small" style={{ margin: "-4px 0 0" }}>
              Ad-hoc sessions use this label in History. Saved workouts keep the template name.
            </p>
          ) : null}

          <label>
            Description (optional)
            <textarea
              value={sessionNotesDraft}
              onChange={(e) => setSessionNotesDraft(e.target.value)}
              onBlur={() => void commitSessionNotes()}
              placeholder="e.g. upper day, how you felt, equipment notes"
            />
          </label>

          <div className="template-options-grid">
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={liveUseRIR}
                onChange={(e) => setLiveUseRIR(e.target.checked)}
              />
              <span>Use RIR on sets</span>
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={liveUseRPE}
                onChange={(e) => setLiveUseRPE(e.target.checked)}
              />
              <span>Use RPE on sets</span>
            </label>
          </div>

          <ViewModeToggle
            value={liveViewMode}
            onChange={setLiveViewMode}
            ariaGroupLabel="Workout view mode"
          />

          {inLiveTable ? (
            tableExercises.length === 0 ? (
              <div className="muted small session-empty-card" style={{ margin: 0 }}>
                No exercises yet—switch to Builder view and use + Add exercise.
              </div>
            ) : (
              <WorkoutTemplateTableView
                exercises={tableExercises}
                useRIR={liveUseRIR}
                useRPE={liveUseRPE}
              />
            )
          ) : null}

          {inLiveBuilder && sessionExercises.length === 0 ? (
            <div className="muted small session-empty-card" style={{ margin: 0 }}>
              Add an exercise below, then use + Add set on each lift.
            </div>
          ) : null}

          {inLiveBuilder ? (
            <div className="stack workout-builder session-live-builder">
              {sessionExercises.map((se) => {
                const sets = setsByExercise.get(se.id) || [];
                return (
                  <div key={se.id} className="workout-builder-exercise-block stack">
                    <SessionExerciseBlock
                      se={se}
                      sets={sets}
                      sessionId={sessionId}
                      isCompleted={false}
                      showPlannedTargets={isFromTemplate}
                      useRIR={liveUseRIR}
                      useRPE={liveUseRPE}
                      onSaved={load}
                      onCreateSet={onCreateSetForExercise}
                      onUpdateSet={onUpdateSet}
                      onDeleteSet={onDeleteSet}
                    />
                  </div>
                );
              })}
              <div className="workout-builder-append session-append-exercise">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void onAppendExercise()}
                  disabled={addingExercise}
                >
                  {addingExercise ? "Adding…" : "+ Add exercise"}
                </button>
              </div>
            </div>
          ) : null}

          {!canFinishWorkout ? (
            <p className="muted small session-finish-hint" style={{ margin: 0 }}>
              Log at least one set anywhere to enable <strong>Finish workout</strong>.
            </p>
          ) : null}

          {canFinishWorkout ? (
            <div className="row session-finish-row" style={{ alignItems: "center", marginTop: 4 }}>
              <div className="session-finish-copy" style={{ flex: "1 1 200px", minWidth: 0 }}>
                <strong>Finish workout</strong>
                <p className="muted small" style={{ margin: "4px 0 0" }}>
                  Saves to History and locks this session.
                </p>
              </div>
              <button type="button" className="btn session-finish-btn" onClick={onComplete}>
                Finish workout
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card stack session-log-workout-form">
          <label>
            Name
            <input readOnly value={workoutTitle} className="session-readonly-input" />
          </label>

          <label>
            Description (optional)
            <textarea readOnly value={session.notes ?? ""} placeholder="—" />
          </label>

          <div className="stack session-completed-blocks">
            {sessionExercises.map((se) => {
              const sets = setsByExercise.get(se.id) || [];
              return (
                <SessionExerciseBlock
                  key={se.id}
                  se={se}
                  sets={sets}
                  sessionId={sessionId}
                  isCompleted
                  showPlannedTargets={isFromTemplate}
                  useRIR
                  useRPE
                  onSaved={load}
                  onCreateSet={onCreateSetForExercise}
                  onUpdateSet={onUpdateSet}
                  onDeleteSet={onDeleteSet}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Same set-row layout as template SetRow (grid-set-row + optional notes); saves via API. */
function SessionSetRow({
  set,
  setOrdinal,
  lockSetOrder = false,
  disabled,
  onUpdate,
  onDelete,
  useRIR = true,
  useRPE = true,
}) {
  const [draft, setDraft] = useState(() => ({
    order: String(set.order ?? ""),
    reps: set.reps ?? "",
    weight: set.weight ?? "",
    rpe: set.rpe ?? "",
    rir: set.rir ?? "",
    notes: set.notes ?? "",
  }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({
      order: String(set.order ?? ""),
      reps: set.reps ?? "",
      weight: set.weight ?? "",
      rpe: set.rpe ?? "",
      rir: set.rir ?? "",
      notes: set.notes ?? "",
    });
  }, [set.id, set.order, set.reps, set.weight, set.rpe, set.rir, set.notes]);

  function toPayload() {
    const payload = {};
    payload.order = lockSetOrder ? Number(set.order) : Number(draft.order);

    payload.reps = draft.reps === "" ? "" : Number(draft.reps);
    payload.weight = draft.weight === "" ? "" : Number(draft.weight);
    payload.rpe = draft.rpe === "" ? "" : Number(draft.rpe);
    payload.rir = draft.rir === "" ? "" : Number(draft.rir);
    payload.notes = draft.notes === "" ? "" : draft.notes;

    return payload;
  }

  const colCount = 2 + (useRIR ? 1 : 0) + (useRPE ? 1 : 0);

  const orderField =
    !disabled && !lockSetOrder ? (
      <label className="session-set-order" style={{ margin: 0 }}>
        <span className="muted small" style={{ fontWeight: 600 }}>
          Order
        </span>
        <input
          value={draft.order}
          onChange={(e) => setDraft((d) => ({ ...d, order: e.target.value }))}
          inputMode="numeric"
          disabled={disabled}
        />
      </label>
    ) : null;

  const setLabel = lockSetOrder ? `Set ${setOrdinal ?? "—"}` : `Set ${draft.order || "—"}`;

  return (
    <WorkoutSetRowShell
      label={setLabel}
      headerExtra={orderField}
      canRemove
      onRemove={onDelete}
      disabled={disabled}
    >
      <div className="grid-set-row" style={{ "--set-cols": colCount }}>
        <label>
          Weight
          <input
            value={draft.weight}
            onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
            inputMode="decimal"
            disabled={disabled}
            placeholder="e.g. 185"
          />
        </label>
        <label>
          Reps
          <input
            value={draft.reps}
            onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
            inputMode="numeric"
            disabled={disabled}
            placeholder="e.g. 8"
          />
        </label>
        {useRIR ? (
          <label>
            RIR <span className="muted small">(optional)</span>
            <input
              value={draft.rir}
              onChange={(e) => setDraft((d) => ({ ...d, rir: e.target.value }))}
              inputMode="numeric"
              disabled={disabled}
              placeholder="—"
            />
          </label>
        ) : null}
        {useRPE ? (
          <label>
            RPE <span className="muted small">(optional)</span>
            <input
              value={draft.rpe}
              onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
              inputMode="decimal"
              disabled={disabled}
              placeholder="—"
            />
          </label>
        ) : null}
      </div>

      <label className="mt-2" style={{ display: "grid", gap: 6, fontWeight: 600 }}>
        Notes <span className="muted small">(optional)</span>
        <input
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          disabled={disabled}
        />
      </label>

      {!disabled ? (
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => onUpdate(toPayload())}>
            Save set
          </button>
        </div>
      ) : null}
    </WorkoutSetRowShell>
  );
}
