import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ExerciseNameInput } from "../components/templates/ExerciseNameInput.jsx";
import { PlanningSetCountControl } from "../components/templates/PlanningSetCountControl.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import { WorkoutSetRowShell } from "../components/workout/WorkoutSetRowShell.jsx";
import { getAdHocSessionTitle, setAdHocSessionTitle } from "../lib/adHocSessionTitle.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";
import {
  loadQuickWorkoutLogPrefs,
  saveQuickWorkoutLogPrefs,
} from "../lib/quickWorkoutLogPrefs.js";
import {
  BLANK_SESSION_EXERCISE_NAME,
  inputToSessionExerciseName,
  isBlankSessionExerciseName,
  sessionExerciseNameForInput,
} from "../lib/sessionExerciseName.js";

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

/** True when a session set row has no logged targets or notes (safe to drop when lowering set count). */
function sessionSetRowIsBlank(set) {
  if (!set || typeof set !== "object") return true;
  const t = (v) => (v == null ? "" : String(v)).trim();
  return (
    t(set.weight) === "" &&
    t(set.reps) === "" &&
    t(set.rir) === "" &&
    t(set.rpe) === "" &&
    t(set.notes) === ""
  );
}

/** Same field layout as `ExerciseEditor` (Create Workout); persists via session exercise API. */
function SessionExerciseFields({
  sessionExercise,
  sessionId,
  disabled,
  useExerciseNotes,
  /** Full-width notes under the exercise name (quick log layout). */
  stackExerciseNotes = false,
  /** Merge API row into session state without refetch (live logging). */
  onExerciseCommitted,
  onSaved,
}) {
  const [name, setName] = useState(() =>
    sessionExerciseNameForInput(sessionExercise.exerciseName)
  );
  const [notes, setNotes] = useState(sessionExercise.notes ?? "");
  const [fieldError, setFieldError] = useState(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync local inputs when server exercise row changes */
    setName(sessionExerciseNameForInput(sessionExercise.exerciseName));
    setNotes(sessionExercise.notes ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sessionExercise.id, sessionExercise.exerciseName, sessionExercise.notes]);

  async function commitExercise(patch) {
    if (disabled) return;
    setFieldError(null);
    try {
      const data = await sessionApi.updateSessionExercise(sessionId, sessionExercise.id, patch);
      const row = data?.sessionExercise;
      if (row && onExerciseCommitted) {
        onExerciseCommitted(row);
      } else if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      setName(sessionExerciseNameForInput(sessionExercise.exerciseName));
      setNotes(sessionExercise.notes ?? "");
      setFieldError(err);
    }
  }

  async function commitName() {
    const nextStored = inputToSessionExerciseName(name);
    if (nextStored === sessionExercise.exerciseName) return;
    await commitExercise({ exerciseName: nextStored });
  }

  async function commitNotes() {
    const n = notes.trim();
    const prev = (sessionExercise.notes ?? "").trim();
    if (n === prev) return;
    await commitExercise({ notes: n ? n : null });
  }

  if (disabled) {
    if (stackExerciseNotes && useExerciseNotes) {
      return (
        <div className="stack session-exercise-fields-readonly" style={{ gap: 10 }}>
          <div>
            <div className="muted small" style={{ fontWeight: 600 }}>
              Exercise name
            </div>
            <div style={{ marginTop: 6 }}>
              {sessionExerciseNameForInput(sessionExercise.exerciseName) || "—"}
            </div>
          </div>
          <div>
            <div className="muted small" style={{ fontWeight: 600 }}>
              Exercise notes <span className="muted small">(optional)</span>
            </div>
            <div className="muted session-exercise-notes-readonly" style={{ marginTop: 6 }}>
              {sessionExercise.notes?.trim() ? sessionExercise.notes : "—"}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="grid-2">
        <div>
          <div className="muted small" style={{ fontWeight: 600 }}>
            Exercise name
          </div>
          <div style={{ marginTop: 6 }}>
            {sessionExerciseNameForInput(sessionExercise.exerciseName) || "—"}
          </div>
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

  const nameField = (
    <label>
      Exercise name
      <ExerciseNameInput
        id={`session-ex-name-${sessionExercise.id}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          void commitName();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="Type or pick a suggestion"
      />
    </label>
  );

  const notesStacked =
    useExerciseNotes && stackExerciseNotes ? (
      <label className="session-exercise-notes-field">
        Exercise notes <span className="muted small">(optional)</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            void commitNotes();
          }}
          placeholder="e.g. stance, injury caution, equipment"
        />
      </label>
    ) : null;

  const notesInline =
    useExerciseNotes && !stackExerciseNotes ? (
      <label>
        Notes <span className="muted small">(optional)</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            void commitNotes();
          }}
          placeholder="—"
        />
      </label>
    ) : null;

  return (
    <div className="stack" style={{ gap: 8 }}>
      {stackExerciseNotes && useExerciseNotes ? (
        <div className="stack session-exercise-fields-stacked-notes" style={{ gap: 8 }}>
          {nameField}
          {notesStacked}
        </div>
      ) : (
        <div className={useExerciseNotes ? "grid-2" : "stack"} style={{ gap: useExerciseNotes ? undefined : 8 }}>
          {nameField}
          {notesInline}
        </div>
      )}
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
  useExerciseNotes,
  useSetNotes,
  /** Quick (ad-hoc) log: exercise notes under name, no per-set notes. */
  isQuickLog = false,
  onExerciseCommitted,
  onSaved,
  onCreateSet,
  onUpdateSet,
  onDeleteSet,
  onAdjustSetCount,
  setCountBusy,
}) {
  const exerciseCommitted = isCompleted ? undefined : onExerciseCommitted;
  const rawName = se.exerciseName ?? "";
  const namePart =
    isBlankSessionExerciseName(rawName) || !String(rawName).trim()
      ? `Exercise ${se.order}`
      : String(rawName).trim();
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
        useExerciseNotes={useExerciseNotes}
        stackExerciseNotes={Boolean(isQuickLog && useExerciseNotes)}
        onExerciseCommitted={exerciseCommitted}
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
          {!isCompleted ? (
            <PlanningSetCountControl
              value={Math.max(1, sets.length)}
              disabled={setCountBusy}
              onChange={(n) => onAdjustSetCount(se.id, n)}
            />
          ) : (
            <span className="muted small" style={{ fontWeight: 600 }}>
              Sets
            </span>
          )}
          {!isCompleted ? (
            <button
              type="button"
              className="btn btn-secondary exercise-editor-add-set-btn"
              onClick={() => onCreateSet(se.id)}
              disabled={setCountBusy}
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
                useSetNotes={useSetNotes}
                onUpdateSet={onUpdateSet}
                onDeleteSet={onDeleteSet}
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
  const sessionRef = useRef(null);
  sessionRef.current = session;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [sessionNotesDraft, setSessionNotesDraft] = useState("");
  const [liveViewMode, setLiveViewMode] = useState("builder");
  const [liveUseRIR, setLiveUseRIR] = useState(false);
  const [liveUseRPE, setLiveUseRPE] = useState(false);
  const [liveUseSessionNotes, setLiveUseSessionNotes] = useState(false);
  const [liveUseExerciseNotes, setLiveUseExerciseNotes] = useState(false);
  const [liveUseSetNotes, setLiveUseSetNotes] = useState(false);
  const [quickTitleDraft, setQuickTitleDraft] = useState("Quick workout");
  const [scrollToExerciseId, setScrollToExerciseId] = useState(null);
  const [adjustingSetCountExerciseId, setAdjustingSetCountExerciseId] = useState(null);
  const exerciseAnchorRefs = useRef(new Map());
  const sessionNoteTogglesInitRef = useRef(null);

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
          notes: s.notes ?? "",
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

  const mergeSessionExerciseRow = useCallback((row) => {
    if (!row?.id) return;
    setSession((prev) => {
      if (!prev?.sessionExercises) return prev;
      const list = prev.sessionExercises.map((e) => (e.id === row.id ? { ...e, ...row } : e));
      return { ...prev, sessionExercises: list };
    });
  }, []);

  const appendSessionExerciseRow = useCallback((row) => {
    if (!row?.id) return;
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, sessionExercises: [...(prev.sessionExercises || []), row] };
    });
  }, []);

  const appendSetRow = useCallback((apiSet) => {
    if (!apiSet?.id) return;
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, sets: [...(prev.sets || []), apiSet] };
    });
  }, []);

  const removeSetRow = useCallback((setId) => {
    setSession((prev) => {
      if (!prev?.sets) return prev;
      return { ...prev, sets: prev.sets.filter((s) => s.id !== setId) };
    });
  }, []);

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
  }, [session, session?.id, session?.notes]);

  useEffect(() => {
    if (!session || session.workoutTemplate) return;
    setQuickTitleDraft(getAdHocSessionTitle(session.id) || "Quick workout");
  }, [session, session?.id, session?.workoutTemplate]);

  useEffect(() => {
    if (!session || session.completedAt) {
      if (!session) sessionNoteTogglesInitRef.current = null;
      return;
    }
    const id = session.id;
    if (sessionNoteTogglesInitRef.current === id) return;
    sessionNoteTogglesInitRef.current = id;

    if (session.workoutTemplate) {
      setLiveUseSessionNotes(Boolean(String(session.notes ?? "").trim()));
      const ex = session.sessionExercises || [];
      setLiveUseExerciseNotes(ex.some((se) => String(se.notes ?? "").trim() !== ""));
      const setsList = session.sets || [];
      setLiveUseSetNotes(setsList.some((s) => String(s.notes ?? "").trim() !== ""));
      return;
    }

    const p = loadQuickWorkoutLogPrefs();
    setLiveUseSessionNotes(
      typeof p.useSessionNotes === "boolean"
        ? p.useSessionNotes
        : Boolean(String(session.notes ?? "").trim())
    );
    setLiveUseExerciseNotes(
      typeof p.useExerciseNotes === "boolean" ? p.useExerciseNotes : true
    );
    setLiveUseRIR(typeof p.useRIR === "boolean" ? p.useRIR : false);
    setLiveUseRPE(typeof p.useRPE === "boolean" ? p.useRPE : false);
    setLiveUseSetNotes(false);
  }, [session]);

  function setExerciseAnchorRef(exerciseId, el) {
    if (el == null) exerciseAnchorRefs.current.delete(exerciseId);
    else exerciseAnchorRefs.current.set(exerciseId, el);
  }

  useLayoutEffect(() => {
    if (scrollToExerciseId == null) return;
    const id = scrollToExerciseId;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        exerciseAnchorRefs.current.get(id)?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        setScrollToExerciseId(null);
      });
    });
  }, [scrollToExerciseId, session?.sessionExercises]);

  async function onComplete() {
    setError(null);
    try {
      await sessionApi.completeSession(sessionId);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err);
    }
  }

  const onCreateSetForExercise = useCallback(
    async (sessionExerciseId) => {
      setError(null);
      try {
        const sess = sessionRef.current;
        if (!sess) {
          await load();
          return;
        }
        const order = nextSetOrder(sess);
        const setsList = (Array.isArray(sess.sets) ? sess.sets : [])
          .filter((s) => s.sessionExerciseId === sessionExerciseId)
          .sort((a, b) => a.order - b.order);
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
        const data = await sessionApi.createSet(sessionId, body);
        if (data?.set) {
          appendSetRow(data.set);
        } else {
          await load();
        }
      } catch (err) {
        setError(err);
        await load();
      }
    },
    [sessionId, appendSetRow, load]
  );

  async function onAdjustSetCountForExercise(sessionExerciseId, targetCount) {
    if (!Number.isInteger(targetCount) || targetCount < 1) return;
    setError(null);
    setAdjustingSetCountExerciseId(sessionExerciseId);
    try {
      const initial = await sessionApi.getSessionById(sessionId);
      const sess = initial?.session;
      if (!sess) return;

      const sorted = (Array.isArray(sess.sets) ? sess.sets : [])
        .filter((s) => s.sessionExerciseId === sessionExerciseId)
        .sort((a, b) => a.order - b.order);
      const cur = sorted.length;
      if (targetCount === cur) {
        setSession(sess);
        return;
      }

      if (targetCount > cur) {
        const toAdd = targetCount - cur;
        for (let k = 0; k < toAdd; k += 1) {
          const latestRes = await sessionApi.getSessionById(sessionId);
          const latest = latestRes?.session;
          if (!latest) return;
          setSession(latest);
          const setsList = (Array.isArray(latest.sets) ? latest.sets : [])
            .filter((s) => s.sessionExerciseId === sessionExerciseId)
            .sort((a, b) => a.order - b.order);
          const order = nextSetOrder(latest);
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
        }
        const end = await sessionApi.getSessionById(sessionId);
        if (end?.session) setSession(end.session);
        return;
      }

      const toRemove = sorted.slice(targetCount);
      const anyFilled = toRemove.some((s) => !sessionSetRowIsBlank(s));
      if (anyFilled) {
        const ok = window.confirm(
          `Lower the set count to ${targetCount}? This removes ${toRemove.length} set(s) from the end, including some with entered weight, reps, or notes.`
        );
        if (!ok) {
          setSession(sess);
          return;
        }
      }
      for (let i = toRemove.length - 1; i >= 0; i -= 1) {
        await sessionApi.deleteSet(toRemove[i].id);
      }
      const end = await sessionApi.getSessionById(sessionId);
      if (end?.session) setSession(end.session);
    } catch (err) {
      setError(err);
      await load();
    } finally {
      setAdjustingSetCountExerciseId(null);
    }
  }

  const onUpdateSet = useCallback(async (setId, patch) => {
    setError(null);
    try {
      const data = await sessionApi.updateSet(setId, patch);
      const apiSet = data?.set;
      if (apiSet && typeof apiSet === "object") {
        setSession((prev) => {
          if (!prev?.sets) return prev;
          const idx = prev.sets.findIndex((s) => s.id === setId);
          if (idx < 0) return prev;
          const nextSets = [...prev.sets];
          nextSets[idx] = {
            ...nextSets[idx],
            order: apiSet.order ?? nextSets[idx].order,
            reps: "reps" in apiSet ? apiSet.reps : nextSets[idx].reps,
            weight: "weight" in apiSet ? apiSet.weight : nextSets[idx].weight,
            rpe: "rpe" in apiSet ? apiSet.rpe : nextSets[idx].rpe,
            rir: "rir" in apiSet ? apiSet.rir : nextSets[idx].rir,
            notes: "notes" in apiSet ? apiSet.notes : nextSets[idx].notes,
          };
          return { ...prev, sets: nextSets };
        });
      } else {
        await load();
      }
    } catch (err) {
      setError(err);
      await load();
    }
  }, [load]);

  const onDeleteSet = useCallback(
    async (setId) => {
      if (!confirm("Delete this set?")) return;
      setError(null);
      try {
        await sessionApi.deleteSet(setId);
        removeSetRow(setId);
      } catch (err) {
        setError(err);
        await load();
      }
    },
    [removeSetRow, load]
  );

  const onAppendExercise = useCallback(async () => {
    setError(null);
    setAddingExercise(true);
    try {
      const data = await sessionApi.addSessionExercise(sessionId, {
        exerciseName: BLANK_SESSION_EXERCISE_NAME,
      });
      if (data?.sessionExercise) {
        appendSessionExerciseRow(data.sessionExercise);
        const newId = data.sessionExercise.id;
        if (
          newId != null &&
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 719px)").matches
        ) {
          setScrollToExerciseId(newId);
        }
      } else {
        await load();
      }
    } catch (err) {
      setError(err);
    } finally {
      setAddingExercise(false);
    }
  }, [sessionId, appendSessionExerciseRow, load]);

  async function commitSessionNotes() {
    if (!session || session.completedAt) return;
    const n = sessionNotesDraft.trim();
    const prev = (session.notes ?? "").trim();
    if (n === prev) return;
    setError(null);
    try {
      const data = await sessionApi.updateSession(sessionId, { notes: n ? n : null });
      if (data?.session && Object.prototype.hasOwnProperty.call(data.session, "notes")) {
        setSession((p) => (p ? { ...p, notes: data.session.notes ?? null } : p));
      } else {
        await load();
      }
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

  function commitQuickTitle() {
    if (!session || session.workoutTemplate || session.completedAt) return;
    setAdHocSessionTitle(sessionId, quickTitleDraft);
  }

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
            {isFromTemplate ? (
              <input readOnly value={readonlyWorkoutName} className="session-readonly-input" />
            ) : (
              <input
                value={quickTitleDraft}
                onChange={(e) => setQuickTitleDraft(e.target.value)}
                onBlur={() => commitQuickTitle()}
                placeholder="Quick workout"
              />
            )}
          </label>
          {!isFromTemplate ? (
            <p className="muted small" style={{ margin: "-4px 0 0" }}>
              Shown in History for this session. Saved workouts keep the template name (stored on
              this device only).
            </p>
          ) : null}

          {liveUseSessionNotes ? (
            <label>
              Description (optional)
              <textarea
                value={sessionNotesDraft}
                onChange={(e) => setSessionNotesDraft(e.target.value)}
                onBlur={() => void commitSessionNotes()}
                placeholder="e.g. upper day, how you felt, equipment notes"
              />
            </label>
          ) : null}

          {isFromTemplate ? (
            <div className="template-options-grid">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={liveUseSessionNotes}
                  onChange={(e) => setLiveUseSessionNotes(e.target.checked)}
                />
                <span>Workout description</span>
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={liveUseExerciseNotes}
                  onChange={(e) => setLiveUseExerciseNotes(e.target.checked)}
                />
                <span>Exercise notes</span>
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={liveUseSetNotes}
                  onChange={(e) => setLiveUseSetNotes(e.target.checked)}
                />
                <span>Set notes</span>
              </label>
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
          ) : (
            <div className="quick-log-display-prefs stack">
              <div className="quick-log-display-prefs__intro muted small">
                Choose what to show while logging. These choices are saved on this device for your next
                quick workout.
              </div>
              <div className="quick-log-display-prefs__group stack">
                <div className="quick-log-display-prefs__label muted small">Per set</div>
                <div className="quick-log-toggle-row row">
                  <button
                    type="button"
                    className={`quick-log-toggle ${liveUseRIR ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={liveUseRIR}
                    onClick={() => {
                      const next = !liveUseRIR;
                      setLiveUseRIR(next);
                      saveQuickWorkoutLogPrefs({
                        useRIR: next,
                        useRPE: liveUseRPE,
                        useSessionNotes: liveUseSessionNotes,
                        useExerciseNotes: liveUseExerciseNotes,
                      });
                    }}
                  >
                    RIR
                  </button>
                  <button
                    type="button"
                    className={`quick-log-toggle ${liveUseRPE ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={liveUseRPE}
                    onClick={() => {
                      const next = !liveUseRPE;
                      setLiveUseRPE(next);
                      saveQuickWorkoutLogPrefs({
                        useRIR: liveUseRIR,
                        useRPE: next,
                        useSessionNotes: liveUseSessionNotes,
                        useExerciseNotes: liveUseExerciseNotes,
                      });
                    }}
                  >
                    RPE
                  </button>
                </div>
              </div>
              <div className="quick-log-display-prefs__group stack">
                <div className="quick-log-display-prefs__label muted small">Workout & exercise</div>
                <div className="quick-log-toggle-row row">
                  <button
                    type="button"
                    className={`quick-log-toggle ${liveUseSessionNotes ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={liveUseSessionNotes}
                    onClick={() => {
                      const next = !liveUseSessionNotes;
                      setLiveUseSessionNotes(next);
                      saveQuickWorkoutLogPrefs({
                        useRIR: liveUseRIR,
                        useRPE: liveUseRPE,
                        useSessionNotes: next,
                        useExerciseNotes: liveUseExerciseNotes,
                      });
                    }}
                  >
                    Description
                  </button>
                  <button
                    type="button"
                    className={`quick-log-toggle ${liveUseExerciseNotes ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={liveUseExerciseNotes}
                    onClick={() => {
                      const next = !liveUseExerciseNotes;
                      setLiveUseExerciseNotes(next);
                      saveQuickWorkoutLogPrefs({
                        useRIR: liveUseRIR,
                        useRPE: liveUseRPE,
                        useSessionNotes: liveUseSessionNotes,
                        useExerciseNotes: next,
                      });
                    }}
                  >
                    Exercise notes
                  </button>
                </div>
              </div>
              <p className="muted small quick-log-display-prefs__footnote" style={{ margin: 0 }}>
                Notes apply to each exercise (under the name), not each set.
              </p>
            </div>
          )}

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
                useExerciseNotes={liveUseExerciseNotes}
                useSetNotes={isFromTemplate && liveUseSetNotes}
              />
            )
          ) : null}

          {inLiveBuilder && sessionExercises.length === 0 ? (
            <div className="muted small session-empty-card" style={{ margin: 0 }}>
              Add an exercise below, then use the Sets control or + Add set on each lift.
            </div>
          ) : null}

          {inLiveBuilder ? (
            <div className="stack workout-builder session-live-builder">
              {sessionExercises.map((se) => {
                const sets = setsByExercise.get(se.id) || [];
                return (
                  <div
                    key={se.id}
                    ref={(el) => setExerciseAnchorRef(se.id, el)}
                    className="workout-builder-exercise-block stack"
                  >
                    <SessionExerciseBlock
                      se={se}
                      sets={sets}
                      sessionId={sessionId}
                      isCompleted={false}
                      showPlannedTargets={isFromTemplate}
                      useRIR={liveUseRIR}
                      useRPE={liveUseRPE}
                      useExerciseNotes={liveUseExerciseNotes}
                      useSetNotes={isFromTemplate && liveUseSetNotes}
                      isQuickLog={isQuickLog}
                      onExerciseCommitted={mergeSessionExerciseRow}
                      onSaved={load}
                      onCreateSet={onCreateSetForExercise}
                      onUpdateSet={onUpdateSet}
                      onDeleteSet={onDeleteSet}
                      onAdjustSetCount={onAdjustSetCountForExercise}
                      setCountBusy={adjustingSetCountExerciseId === se.id}
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
                  useRIR={liveUseRIR}
                  useRPE={liveUseRPE}
                  useExerciseNotes={liveUseExerciseNotes}
                  useSetNotes={isFromTemplate && liveUseSetNotes}
                  isQuickLog={isQuickLog}
                  onSaved={load}
                  onCreateSet={onCreateSetForExercise}
                  onUpdateSet={onUpdateSet}
                  onDeleteSet={onDeleteSet}
                  onAdjustSetCount={onAdjustSetCountForExercise}
                  setCountBusy={false}
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
const SessionSetRow = memo(function SessionSetRow({
  set,
  setOrdinal,
  lockSetOrder = false,
  disabled,
  onUpdateSet,
  onDeleteSet,
  useRIR = true,
  useRPE = true,
  useSetNotes = true,
}) {
  const rootRef = useRef(null);
  const [draft, setDraft] = useState(() => ({
    order: String(set.order ?? ""),
    reps: set.reps ?? "",
    weight: set.weight ?? "",
    rpe: set.rpe ?? "",
    rir: set.rir ?? "",
    notes: set.notes ?? "",
  }));
  const draftRef = useRef(draft);
  const lastSentKeyRef = useRef(null);

  const fieldIds = useMemo(
    () => ({
      weight: `log-set-${set.id}-weight`,
      reps: `log-set-${set.id}-reps`,
      rir: `log-set-${set.id}-rir`,
      rpe: `log-set-${set.id}-rpe`,
      notes: `log-set-${set.id}-notes`,
    }),
    [set.id]
  );

  useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  function payloadFromDraft(d) {
    const payload = {};
    payload.order = lockSetOrder ? Number(set.order) : Number(d.order);
    payload.reps = d.reps === "" ? "" : Number(d.reps);
    payload.weight = d.weight === "" ? "" : Number(d.weight);
    payload.rpe = d.rpe === "" ? "" : Number(d.rpe);
    payload.rir = d.rir === "" ? "" : Number(d.rir);
    payload.notes = d.notes === "" ? "" : d.notes;
    return payload;
  }

  function payloadKey(p) {
    return JSON.stringify(p);
  }

  useEffect(() => {
    const next = {
      order: String(set.order ?? ""),
      reps: set.reps ?? "",
      weight: set.weight ?? "",
      rpe: set.rpe ?? "",
      rir: set.rir ?? "",
      notes: set.notes ?? "",
    };
    if (rootRef.current?.contains(document.activeElement)) {
      lastSentKeyRef.current = payloadKey(payloadFromDraft(draftRef.current));
      return;
    }
    setDraft(next);
    lastSentKeyRef.current = payloadKey(payloadFromDraft(next));
    // payloadFromDraft closes over `set` + lockSetOrder; deps list mirrors those inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when server fields change
  }, [set.id, set.order, set.reps, set.weight, set.rpe, set.rir, set.notes, lockSetOrder]);

  function flushNow() {
    if (disabled) return;
    const latest = payloadFromDraft(draftRef.current);
    const k = payloadKey(latest);
    if (k === lastSentKeyRef.current) return;
    lastSentKeyRef.current = k;
    onUpdateSet(set.id, latest);
  }

  useEffect(() => {
    if (disabled) return;
    const latest = payloadFromDraft(draft);
    if (payloadKey(latest) === lastSentKeyRef.current) return;
    const t = setTimeout(() => {
      const cur = payloadFromDraft(draftRef.current);
      const k = payloadKey(cur);
      if (k === lastSentKeyRef.current) return;
      lastSentKeyRef.current = k;
      onUpdateSet(set.id, cur);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, disabled]);

  function focusNextField(from) {
    const chain = ["weight", "reps"];
    if (useRIR) chain.push("rir");
    if (useRPE) chain.push("rpe");
    if (useSetNotes) chain.push("notes");
    const i = chain.indexOf(from);
    if (i < 0 || i + 1 >= chain.length) return;
    const id = fieldIds[chain[i + 1]];
    document.getElementById(id)?.focus();
  }

  function onEnterNext(e, from) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    focusNextField(from);
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
          onBlur={flushNow}
          inputMode="numeric"
          disabled={disabled}
        />
      </label>
    ) : null;

  const setLabel = lockSetOrder ? `Set ${setOrdinal ?? "—"}` : `Set ${draft.order || "—"}`;

  return (
    <div ref={rootRef} className="session-set-row-root">
      <WorkoutSetRowShell
        label={setLabel}
        headerExtra={orderField}
        canRemove
        onRemove={() => onDeleteSet(set.id)}
        disabled={disabled}
      >
        <div className="grid-set-row" style={{ "--set-cols": colCount }}>
          <label>
            Weight
            <input
              id={fieldIds.weight}
              value={draft.weight}
              onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
              onBlur={flushNow}
              onKeyDown={(e) => onEnterNext(e, "weight")}
              enterKeyHint="next"
              inputMode="decimal"
              disabled={disabled}
              placeholder="e.g. 185"
            />
          </label>
          <label>
            Reps
            <input
              id={fieldIds.reps}
              value={draft.reps}
              onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
              onBlur={flushNow}
              onKeyDown={(e) => onEnterNext(e, "reps")}
              enterKeyHint={useRIR || useRPE || useSetNotes ? "next" : "done"}
              inputMode="numeric"
              disabled={disabled}
              placeholder="e.g. 8"
            />
          </label>
          {useRIR ? (
            <label>
              RIR <span className="muted small">(optional)</span>
              <input
                id={fieldIds.rir}
                value={draft.rir}
                onChange={(e) => setDraft((d) => ({ ...d, rir: e.target.value }))}
                onBlur={flushNow}
                onKeyDown={(e) => onEnterNext(e, "rir")}
                enterKeyHint={useRPE || useSetNotes ? "next" : "done"}
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
                id={fieldIds.rpe}
                value={draft.rpe}
                onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
                onBlur={flushNow}
                onKeyDown={(e) => onEnterNext(e, "rpe")}
                enterKeyHint={useSetNotes ? "next" : "done"}
                inputMode="decimal"
                disabled={disabled}
                placeholder="—"
              />
            </label>
          ) : null}
        </div>

        {useSetNotes ? (
          <label className="mt-2" style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Notes <span className="muted small">(optional)</span>
            <input
              id={fieldIds.notes}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              onBlur={flushNow}
              enterKeyHint="done"
              disabled={disabled}
              placeholder="—"
            />
          </label>
        ) : null}

        {!disabled ? (
          <p className="muted small session-set-autosave-hint" style={{ margin: "8px 0 0" }}>
            Saves automatically after you pause typing or leave a field.
          </p>
        ) : null}
      </WorkoutSetRowShell>
    </div>
  );
});

SessionSetRow.displayName = "SessionSetRow";
