import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { WorkoutSetRowShell } from "../components/workout/WorkoutSetRowShell.jsx";

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

/** Matches template ExerciseEditor: name + optional notes in a two-column grid. */
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
        <label style={{ margin: 0 }}>
          <span className="muted small" style={{ fontWeight: 600 }}>
            Exercise name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              void commitName();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="e.g. Bench press"
          />
        </label>
        <label style={{ margin: 0 }}>
          <span className="muted small" style={{ fontWeight: 600 }}>
            Notes <span className="muted small">(optional)</span>
          </span>
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

export function SessionDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);

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

  async function onComplete() {
    setError(null);
    try {
      const data = await sessionApi.completeSession(sessionId);
      setSession(data.session);
    } catch (err) {
      setError(err);
    }
  }

  async function onDeleteSession() {
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    setError(null);
    try {
      await sessionApi.deleteSession(sessionId);
      navigate("/sessions");
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

  async function onAddExercise(e) {
    e.preventDefault();
    const name = newExerciseName.trim();
    if (!name) return;
    setError(null);
    setAddingExercise(true);
    try {
      await sessionApi.addSessionExercise(sessionId, { exerciseName: name });
      setNewExerciseName("");
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setAddingExercise(false);
    }
  }

  if (loading) return <LoadingState label="Loading workout…" />;

  const programLine = session?.workoutTemplate
    ? `From template: ${session.workoutTemplate.name}`
    : "Not from a saved template";

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 6 }}>{isCompleted ? "Workout summary" : "Workout"}</h1>
          <div className="muted small">
            Performed: {formatDate(session?.performedAt)} · Started:{" "}
            {formatDate(session?.startedAt)}
          </div>
        </div>
        <div className="row">
          <Link className="btn btn-secondary" to="/">
            Home
          </Link>
          <Link className="btn btn-secondary" to="/sessions">
            History
          </Link>
          <button type="button" className="btn btn-secondary" onClick={load}>
            Refresh
          </button>
          <button type="button" className="btn btn-secondary" onClick={onDeleteSession}>
            Delete workout
          </button>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="card stack">
        <div className="row">
          <div>
            <strong>Source</strong>
            <div className="muted small">{programLine}</div>
          </div>
          <span className="pill">{isCompleted ? "Completed" : "In progress"}</span>
        </div>

        {isCompleted ? (
          <div className="muted small">
            Finished {formatDate(session?.completedAt)}. This workout is saved in your history and
            is read-only.
          </div>
        ) : null}
      </div>

      {!isCompleted ? (
        <div className="card stack session-finish-cta">
          <div className="row" style={{ alignItems: "center" }}>
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <strong>Finish workout</strong>
              <p className="muted small" style={{ margin: "6px 0 0" }}>
                When you are done training, finish to mark this session complete. You can open it
                anytime from Home or History.
              </p>
            </div>
            <button type="button" className="btn" onClick={onComplete}>
              Finish workout
            </button>
          </div>
        </div>
      ) : null}

      {!isCompleted && (session?.sessionExercises || []).length === 0 ? (
        <div className="card muted">
          Add your first exercise below. You can log sets for each movement as you go.
        </div>
      ) : null}

      {(session?.sessionExercises || []).length > 0 ? (
        <div className="row">
          <h2 style={{ margin: 0 }}>Workout</h2>
        </div>
      ) : null}

      <div className="stack">
        {(session?.sessionExercises || []).map((se) => {
          const sets = setsByExercise.get(se.id) || [];
          return (
            <div key={se.id} className="card stack exercise-editor">
              <div className="row">
                <strong>Exercise #{se.order}</strong>
                <span className="pill">Sets: {sets.length}</span>
              </div>

              <SessionExerciseFields
                sessionExercise={se}
                sessionId={sessionId}
                disabled={isCompleted}
                onSaved={load}
              />

              <div className="muted small">
                Planned: {se.targetSets != null ? `${se.targetSets} sets` : "—"} ·{" "}
                {se.targetReps ? `${se.targetReps} reps` : "—"}
              </div>

              <div className="stack">
                <div className="row">
                  <span className="muted small" style={{ fontWeight: 600 }}>
                    Sets
                  </span>
                  {!isCompleted ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onCreateSetForExercise(se.id)}
                    >
                      Add set
                    </button>
                  ) : null}
                </div>

                {sets.length === 0 ? (
                  <div className="muted">No sets logged yet.</div>
                ) : (
                  <div className="stack">
                    {sets.map((s) => (
                      <SessionSetRow
                        key={s.id}
                        set={s}
                        disabled={isCompleted}
                        onUpdate={(patch) => onUpdateSet(s.id, patch)}
                        onDelete={() => onDeleteSet(s.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isCompleted ? (
        <div className="card stack">
          <form className="stack" onSubmit={onAddExercise}>
            <label style={{ margin: 0 }}>
              <span className="muted small" style={{ fontWeight: 600 }}>
                Add exercise
              </span>
              <input
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="e.g. Bench press"
                disabled={addingExercise}
              />
            </label>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-secondary" disabled={addingExercise}>
                {addingExercise ? "Adding…" : "+ Add exercise"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

/** Same set-row layout as template SetRow (grid-set-row + optional notes); saves via API. */
function SessionSetRow({ set, disabled, onUpdate, onDelete }) {
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
    payload.order = Number(draft.order);

    payload.reps = draft.reps === "" ? "" : Number(draft.reps);
    payload.weight = draft.weight === "" ? "" : Number(draft.weight);
    payload.rpe = draft.rpe === "" ? "" : Number(draft.rpe);
    payload.rir = draft.rir === "" ? "" : Number(draft.rir);
    payload.notes = draft.notes === "" ? "" : draft.notes;

    return payload;
  }

  const colCount = 4;

  const orderField =
    !disabled ? (
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

  return (
    <WorkoutSetRowShell
      label={`Set ${draft.order || "—"}`}
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
      {!disabled ? (
        <div className="muted small">
          Tip: clear optional fields by emptying the input and saving.
        </div>
      ) : null}
    </WorkoutSetRowShell>
  );
}
