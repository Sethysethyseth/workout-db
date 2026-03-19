import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

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

export function SessionDetailPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newSet, setNewSet] = useState({
    sessionExerciseId: "",
    order: "",
    reps: "",
    weight: "",
    rpe: "",
    rir: "",
    notes: "",
  });

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
      setNewSet((prev) => ({ ...prev, order: String(nextSetOrder(data.session)) }));
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
    if (!confirm("Delete this session? This cannot be undone.")) return;
    setError(null);
    try {
      await sessionApi.deleteSession(sessionId);
      navigate("/sessions");
    } catch (err) {
      setError(err);
    }
  }

  async function onCreateSet(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        sessionExerciseId: Number(newSet.sessionExerciseId),
        order: Number(newSet.order),
      };
      if (newSet.reps !== "") payload.reps = Number(newSet.reps);
      if (newSet.weight !== "") payload.weight = Number(newSet.weight);
      if (newSet.rpe !== "") payload.rpe = Number(newSet.rpe);
      if (newSet.rir !== "") payload.rir = Number(newSet.rir);
      if (newSet.notes !== "") payload.notes = newSet.notes;

      await sessionApi.createSet(sessionId, payload);
      await load();
      setNewSet((prev) => ({
        ...prev,
        reps: "",
        weight: "",
        rpe: "",
        rir: "",
        notes: "",
      }));
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

  if (loading) return <LoadingState label="Loading session…" />;

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Session #{sessionId}</h1>
          <div className="muted small">
            Performed: {formatDate(session?.performedAt)} · Started:{" "}
            {formatDate(session?.startedAt)}
          </div>
        </div>
        <div className="row">
          <Link className="btn btn-secondary" to="/sessions">
            Back
          </Link>
          <button className="btn btn-secondary" onClick={load}>
            Refresh
          </button>
          <button className="btn btn-secondary" onClick={onDeleteSession}>
            Delete session
          </button>
          <button className="btn" onClick={onComplete} disabled={isCompleted}>
            {isCompleted ? "Completed" : "Complete session"}
          </button>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="card stack">
        <div className="row">
          <div>
            <strong>Template</strong>
            <div className="muted small">
              {session?.workoutTemplate
                ? `${session.workoutTemplate.name} (#${session.workoutTemplate.id})`
                : "—"}
            </div>
          </div>
          <span className="pill">{isCompleted ? "Completed" : "Active"}</span>
        </div>

        {isCompleted ? (
          <div className="muted small">
            Completed at: {formatDate(session?.completedAt)}. Mutations are locked by
            the backend.
          </div>
        ) : null}
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Add set</h2>
          <span className="muted small">
            Set order must be unique within the session.
          </span>
        </div>

        <form className="stack" onSubmit={onCreateSet}>
          <div className="grid-2">
            <label>
              Session exercise
              <select
                value={newSet.sessionExerciseId}
                onChange={(e) =>
                  setNewSet((s) => ({ ...s, sessionExerciseId: e.target.value }))
                }
                required
                disabled={isCompleted}
              >
                <option value="" disabled>
                  Select…
                </option>
                {(session?.sessionExercises || []).map((se) => (
                  <option key={se.id} value={se.id}>
                    {se.order}. {se.exerciseName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Order
              <input
                value={newSet.order}
                onChange={(e) => setNewSet((s) => ({ ...s, order: e.target.value }))}
                inputMode="numeric"
                required
                disabled={isCompleted}
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              Reps (optional)
              <input
                value={newSet.reps}
                onChange={(e) => setNewSet((s) => ({ ...s, reps: e.target.value }))}
                inputMode="numeric"
                disabled={isCompleted}
              />
            </label>
            <label>
              Weight (optional)
              <input
                value={newSet.weight}
                onChange={(e) =>
                  setNewSet((s) => ({ ...s, weight: e.target.value }))
                }
                inputMode="decimal"
                disabled={isCompleted}
              />
            </label>
          </div>

          <div className="grid-2">
            <label>
              RPE (optional)
              <input
                value={newSet.rpe}
                onChange={(e) => setNewSet((s) => ({ ...s, rpe: e.target.value }))}
                inputMode="decimal"
                disabled={isCompleted}
              />
            </label>
            <label>
              RIR (optional)
              <input
                value={newSet.rir}
                onChange={(e) => setNewSet((s) => ({ ...s, rir: e.target.value }))}
                inputMode="numeric"
                disabled={isCompleted}
              />
            </label>
          </div>

          <label>
            Notes (optional)
            <input
              value={newSet.notes}
              onChange={(e) => setNewSet((s) => ({ ...s, notes: e.target.value }))}
              disabled={isCompleted}
            />
          </label>

          <div className="row">
            <button className="btn" disabled={isCompleted}>
              Add set
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setNewSet((s) => ({ ...s, order: String(nextSetOrder(session)) }))
              }
              disabled={isCompleted}
            >
              Suggest next order
            </button>
          </div>
        </form>
      </div>

      <div className="stack">
        {(session?.sessionExercises || []).map((se) => {
          const sets = setsByExercise.get(se.id) || [];
          return (
            <div key={se.id} className="card stack">
              <div className="row">
                <div>
                  <h2 style={{ marginBottom: 6 }}>
                    {se.order}. {se.exerciseName}
                  </h2>
                  <div className="muted small">
                    Target: {se.targetSets != null ? `${se.targetSets} sets` : "—"} ·{" "}
                    {se.targetReps ? `${se.targetReps} reps` : "—"}
                  </div>
                </div>
                <span className="pill">Sets: {sets.length}</span>
              </div>

              {sets.length === 0 ? (
                <div className="muted">No sets yet.</div>
              ) : (
                <div className="stack">
                  {sets.map((s) => (
                    <SetRow
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
          );
        })}
      </div>
    </div>
  );
}

function SetRow({ set, disabled, onUpdate, onDelete }) {
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

  return (
    <div className="card stack">
      <div className="row">
        <strong>Set #{set.id}</strong>
        <span className="muted small">
          Order {set.order} · Exercise{" "}
          {set.sessionExercise ? set.sessionExercise.exerciseName : "—"}
        </span>
      </div>

      <div className="grid-2">
        <label>
          Order
          <input
            value={draft.order}
            onChange={(e) => setDraft((d) => ({ ...d, order: e.target.value }))}
            inputMode="numeric"
            disabled={disabled}
          />
        </label>
        <label>
          Reps
          <input
            value={draft.reps}
            onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
            inputMode="numeric"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid-2">
        <label>
          Weight
          <input
            value={draft.weight}
            onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
            inputMode="decimal"
            disabled={disabled}
          />
        </label>
        <label>
          RPE
          <input
            value={draft.rpe}
            onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
            inputMode="decimal"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid-2">
        <label>
          RIR
          <input
            value={draft.rir}
            onChange={(e) => setDraft((d) => ({ ...d, rir: e.target.value }))}
            inputMode="numeric"
            disabled={disabled}
          />
        </label>
        <label>
          Notes
          <input
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="row">
        <button className="btn btn-secondary" onClick={() => onUpdate(toPayload())} disabled={disabled}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={onDelete} disabled={disabled}>
          Delete
        </button>
        <Link className="muted small" to={`/sessions/${set.workoutSessionId}`}>
          View session
        </Link>
      </div>
      <div className="muted small">
        Tip: clear optional fields by emptying the input and saving.
      </div>
    </div>
  );
}

