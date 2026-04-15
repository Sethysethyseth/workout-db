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
import { RirRpeToggleRow } from "../components/templates/RirRpeToggleRow.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import { WorkoutSetRowShell } from "../components/workout/WorkoutSetRowShell.jsx";
import { getAdHocSessionTitle, setAdHocSessionTitle } from "../lib/adHocSessionTitle.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";
import {
  loadQuickWorkoutLogPrefs,
  saveQuickWorkoutLogPrefs,
} from "../lib/quickWorkoutLogPrefs.js";
import { useSessionLiveLoggingGuard } from "../context/SessionLiveLoggingGuardContext.jsx";
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

/** Weight + reps present — minimum “this set is logged” signal for UX (optional fields ignored). */
function sessionSetHasCoreLogged(set) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  return t(set.weight) !== "" && t(set.reps) !== "";
}

function sessionSetDraftDirty(draft, set) {
  const norm = (v) => (v == null ? "" : String(v)).trim();
  return (
    norm(draft.weight) !== norm(set.weight) ||
    norm(draft.reps) !== norm(set.reps) ||
    norm(draft.rir) !== norm(set.rir) ||
    norm(draft.rpe) !== norm(set.rpe) ||
    norm(draft.notes) !== norm(set.notes)
  );
}

/** Every set has weight+reps (server row); false if there are zero sets. */
function sessionExerciseAllSetsCoreLogged(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return false;
  return sets.every((s) => sessionSetHasCoreLogged(s));
}

/** Last set in order with core logged — for collapsed summaries. */
function sessionExerciseLastLoggedSummary(sets) {
  if (!Array.isArray(sets)) return null;
  for (let i = sets.length - 1; i >= 0; i -= 1) {
    const s = sets[i];
    if (sessionSetHasCoreLogged(s)) {
      const w = String(s.weight ?? "").trim();
      const r = String(s.reps ?? "").trim();
      return `${w} × ${r}`;
    }
  }
  return null;
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
  /** Live session: mark this exercise active when user focuses name/notes. */
  onInteractStart,
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
    <div
      className="stack session-exercise-fields"
      style={{ gap: 8 }}
      onFocusCapture={
        !disabled && onInteractStart
          ? () => {
              onInteractStart();
            }
          : undefined
      }
    >
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
  /** Live builder: collapsible blocks + active exercise chrome. */
  collapsible = false,
  isCollapsed = false,
  onToggleCollapsed,
  isActiveExercise = false,
  allSetsLogged = false,
  lastLoggedSummary = null,
  onActivateExercise,
  /** First incomplete set in the whole session (by exercise order, then set order). */
  nextIncompleteSetId = null,
}) {
  const exerciseCommitted = isCompleted ? undefined : onExerciseCommitted;
  const rawName = se.exerciseName ?? "";
  const namePart =
    isBlankSessionExerciseName(rawName) || !String(rawName).trim()
      ? `Exercise ${se.order}`
      : String(rawName).trim();
  const setCountLabel = `${sets.length} ${sets.length === 1 ? "set" : "sets"}`;

  const expanded = isCompleted || !collapsible || !isCollapsed;
  const summaryLine =
    collapsible && isCollapsed && !isCompleted
      ? lastLoggedSummary
        ? `Last ${lastLoggedSummary}`
        : sets.length === 0
          ? "No sets yet"
          : "No sets logged yet"
      : null;

  const blockClass = [
    "card stack exercise-editor session-exercise-block",
    !isCompleted ? "session-exercise-block--live" : "",
    collapsible && isActiveExercise && !isCompleted ? "session-exercise-block--active" : "",
    collapsible && allSetsLogged && sets.length > 0 ? "session-exercise-block--all-logged" : "",
    collapsible && isCollapsed && !isCompleted ? "session-exercise-block--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headingInner = (
    <>
      {collapsible && !isCompleted ? (
        <span className="session-exercise-heading-chevron" aria-hidden="true">
          {isCollapsed ? "▸" : "▾"}
        </span>
      ) : null}
      <span className="session-exercise-heading-text">
        <strong className="session-exercise-heading">{namePart}</strong>
        <span className="session-exercise-heading-meta muted"> · {setCountLabel}</span>
        {summaryLine ? (
          <span className="session-exercise-heading-summary muted small"> · {summaryLine}</span>
        ) : null}
      </span>
    </>
  );

  return (
    <div className={blockClass}>
      <div
        className={
          collapsible && !isCompleted
            ? "session-exercise-heading-sticky"
            : "session-exercise-heading-sticky session-exercise-heading-sticky--static"
        }
      >
        {collapsible && !isCompleted ? (
          <button
            type="button"
            className="session-exercise-heading-toggle"
            onClick={() => onToggleCollapsed?.()}
            aria-expanded={expanded}
          >
            {headingInner}
          </button>
        ) : (
          <div className="row session-exercise-heading-row session-exercise-heading-toggle-static">
            {headingInner}
          </div>
        )}
      </div>

      {expanded ? (
        <>
          <SessionExerciseFields
            sessionExercise={se}
            sessionId={sessionId}
            disabled={isCompleted}
            useExerciseNotes={useExerciseNotes}
            stackExerciseNotes={Boolean(isQuickLog && useExerciseNotes)}
            onExerciseCommitted={exerciseCommitted}
            onSaved={onSaved}
            onInteractStart={!isCompleted ? onActivateExercise : undefined}
          />

          {showPlannedTargets ? (
            <div className="muted small session-planned-targets">
              Planned: {se.targetSets != null ? `${se.targetSets} sets` : "—"} ·{" "}
              {se.targetReps ? `${se.targetReps} reps` : "—"}
            </div>
          ) : null}

          <div
            className="stack session-exercise-sets-stack"
            onFocusCapture={
              !isCompleted && onActivateExercise ? () => onActivateExercise() : undefined
            }
          >
            <div className="exercise-editor-set-toolbar row session-set-toolbar">
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
              {!isCompleted && sets.length === 0 ? (
                <button
                  type="button"
                  className="btn btn-secondary exercise-editor-add-set-btn"
                  onClick={() => {
                    onActivateExercise?.();
                    onCreateSet(se.id);
                  }}
                  disabled={setCountBusy}
                >
                  + Add set
                </button>
              ) : null}
            </div>

            {sets.length === 0 ? (
              <div className="muted small session-empty-sets">No sets yet—tap + Add set.</div>
            ) : (
              <>
                <div className="stack session-set-rows">
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
                      isNext={
                        !isCompleted &&
                        nextIncompleteSetId != null &&
                        s.id === nextIncompleteSetId
                      }
                      onInteractStart={!isCompleted ? onActivateExercise : undefined}
                      onUpdateSet={onUpdateSet}
                      onDeleteSet={onDeleteSet}
                    />
                  ))}
                </div>
                {!isCompleted ? (
                  <div className="stack session-add-set-footer">
                    <button
                      type="button"
                      className="btn btn-secondary session-add-set-footer-btn"
                      onClick={() => {
                        onActivateExercise?.();
                        onCreateSet(se.id);
                      }}
                      disabled={setCountBusy}
                    >
                      + Add set
                    </button>
                    <p className="muted small session-block-autosave-hint" style={{ margin: 0 }}>
                      Autosaves when you pause typing or leave a field.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}
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
  const [quickTitleDraft, setQuickTitleDraft] = useState("");
  const [scrollToExerciseId, setScrollToExerciseId] = useState(null);
  const [adjustingSetCountExerciseId, setAdjustingSetCountExerciseId] = useState(null);
  const [completeBusy, setCompleteBusy] = useState(false);
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

  const orderedSessionExercises = useMemo(() => {
    const ex = session?.sessionExercises;
    if (!Array.isArray(ex)) return [];
    return [...ex].sort((a, b) => a.order - b.order);
  }, [session?.sessionExercises]);

  const nextIncompleteSetId = useMemo(() => {
    if (!session || session.completedAt) return null;
    for (const se of orderedSessionExercises) {
      const list = setsByExercise.get(se.id) || [];
      for (const s of list) {
        if (!sessionSetHasCoreLogged(s)) return s.id;
      }
    }
    return null;
  }, [session, orderedSessionExercises, setsByExercise]);

  const nextIncompleteOwnerExerciseId = useMemo(() => {
    if (nextIncompleteSetId == null) return null;
    for (const se of orderedSessionExercises) {
      const list = setsByExercise.get(se.id) || [];
      if (list.some((s) => s.id === nextIncompleteSetId)) return se.id;
    }
    return null;
  }, [nextIncompleteSetId, orderedSessionExercises, setsByExercise]);

  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState(() => new Set());
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const activeExerciseInitRef = useRef(false);
  const prevFocusedNextSetRef = useRef(null);
  const { setActive: setLiveLoggingGuard } = useSessionLiveLoggingGuard();
  const lastUserScrollAtRef = useRef(0);
  const lastViewportShiftAtRef = useRef(0);

  function isElementInViewport(el, { padTop = 0, padBottom = 0 } = {}) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!vh) return false;
    return r.top >= 0 + padTop && r.bottom <= vh - padBottom;
  }

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
    activeExerciseInitRef.current = false;
    setActiveExerciseId(null);
    setCollapsedExerciseIds(new Set());
    prevFocusedNextSetRef.current = null;
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.completedAt) {
      setLiveLoggingGuard(false);
      return;
    }
    setLiveLoggingGuard(true);
    return () => {
      setLiveLoggingGuard(false);
    };
  }, [session, session?.completedAt, setLiveLoggingGuard]);

  useEffect(() => {
    if (!session || session.completedAt) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [session, session?.completedAt]);

  useEffect(() => {
    function markScroll() {
      lastUserScrollAtRef.current = Date.now();
    }
    function markViewportShift() {
      lastViewportShiftAtRef.current = Date.now();
    }
    window.addEventListener("wheel", markScroll, { passive: true });
    window.addEventListener("touchmove", markScroll, { passive: true });
    window.addEventListener("scroll", markScroll, { passive: true });
    window.addEventListener("keydown", markScroll, { passive: true });
    window.visualViewport?.addEventListener("resize", markViewportShift, { passive: true });
    window.visualViewport?.addEventListener("scroll", markViewportShift, { passive: true });
    return () => {
      window.removeEventListener("wheel", markScroll);
      window.removeEventListener("touchmove", markScroll);
      window.removeEventListener("scroll", markScroll);
      window.removeEventListener("keydown", markScroll);
      window.visualViewport?.removeEventListener("resize", markViewportShift);
      window.visualViewport?.removeEventListener("scroll", markViewportShift);
    };
  }, []);

  useEffect(() => {
    if (nextIncompleteOwnerExerciseId == null) return;
    if (!session || session.completedAt) return;
    setCollapsedExerciseIds((prev) => {
      if (!prev.has(nextIncompleteOwnerExerciseId)) return prev;
      const next = new Set(prev);
      next.delete(nextIncompleteOwnerExerciseId);
      return next;
    });
  }, [nextIncompleteOwnerExerciseId, session]);

  useLayoutEffect(() => {
    if (nextIncompleteSetId == null) return;
    if (prevFocusedNextSetRef.current === nextIncompleteSetId) return;
    prevFocusedNextSetRef.current = nextIncompleteSetId;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-session-set-id="${nextIncompleteSetId}"]`);
      if (!el) return;

      // Only assist when it clearly helps; avoid fighting active scrolling/viewport shifts (keyboard).
      const now = Date.now();
      const msSinceScroll = now - (lastUserScrollAtRef.current || 0);
      const msSinceViewportShift = now - (lastViewportShiftAtRef.current || 0);
      if (msSinceScroll < 900) return;
      if (msSinceViewportShift < 700) return;

      // If already visible, do nothing (prevents "jumping" when the user is on the right spot).
      if (isElementInViewport(el, { padTop: 72, padBottom: 120 })) return;

      /* auto: avoid competing with smooth scroll while the user is already focusing inputs */
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  }, [nextIncompleteSetId]);

  useEffect(() => {
    if (!session || session.completedAt) return;
    if (activeExerciseInitRef.current) return;
    const ex = orderedSessionExercises;
    if (ex.length === 0) return;
    const firstIncomplete = ex.find((se) => {
      const st = setsByExercise.get(se.id) || [];
      return !sessionExerciseAllSetsCoreLogged(st);
    });
    setActiveExerciseId(firstIncomplete?.id ?? ex[0].id);
    activeExerciseInitRef.current = true;
  }, [session, session?.completedAt, orderedSessionExercises, setsByExercise]);

  useEffect(() => {
    if (session) setSessionNotesDraft(session.notes ?? "");
  }, [session, session?.id, session?.notes]);

  useEffect(() => {
    if (!session || session.workoutTemplate) return;
    const fromServer = session.name != null ? String(session.name).trim() : "";
    setQuickTitleDraft(fromServer || getAdHocSessionTitle(session.id) || "");
  }, [session, session?.id, session?.name, session?.workoutTemplate]);

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
    setLiveUseSessionNotes(false);
    saveQuickWorkoutLogPrefs({ useSessionNotes: false });
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
    if (completeBusy) return;
    setError(null);
    setCompleteBusy(true);
    try {
      const payload =
        session && !session.workoutTemplate ? { name: quickTitleDraft.trim() } : {};
      await sessionApi.completeSession(sessionId, payload);
      if (session && !session.workoutTemplate) {
        setAdHocSessionTitle(sessionId, "");
      }
      navigate("/", { replace: true, state: { workoutSaved: true } });
    } catch (err) {
      setError(err);
    } finally {
      setCompleteBusy(false);
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

  const activateExercise = useCallback((exerciseId) => {
    if (exerciseId == null) return;
    setActiveExerciseId(exerciseId);
    setCollapsedExerciseIds((prev) => {
      if (!prev.has(exerciseId)) return prev;
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
  }, []);

  const toggleExerciseCollapsed = useCallback((exerciseId) => {
    let expandedTo = null;
    setCollapsedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
        expandedTo = exerciseId;
      } else {
        next.add(exerciseId);
      }
      return next;
    });
    if (expandedTo != null) setActiveExerciseId(expandedTo);
  }, []);

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
        if (newId != null) {
          activateExercise(newId);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 719px)").matches) {
            setScrollToExerciseId(newId);
          }
        }
      } else {
        await load();
      }
    } catch (err) {
      setError(err);
    } finally {
      setAddingExercise(false);
    }
  }, [sessionId, appendSessionExerciseRow, load, activateExercise]);

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

  const sessionExercises = orderedSessionExercises;
  const totalSetsLogged = Array.isArray(session?.sets) ? session.sets.length : 0;
  const canFinishWorkout = totalSetsLogged >= 1;
  const workoutTitle = session ? sessionDisplayTitle(session) : "Workout";
  const readonlyWorkoutName = isFromTemplate
    ? session.workoutTemplate.name
    : sessionDisplayTitle(session);

  async function commitQuickTitle() {
    if (!session || session.workoutTemplate || session.completedAt) return;
    const trimmed = quickTitleDraft.trim();
    const prev = (session.name ?? "").trim();
    if (trimmed === prev) return;
    setError(null);
    try {
      const data = await sessionApi.updateSession(sessionId, { name: trimmed || null });
      if (data?.session) {
        setSession(data.session);
        setAdHocSessionTitle(sessionId, "");
      } else {
        await load();
      }
    } catch (err) {
      setError(err);
      setQuickTitleDraft(prev || getAdHocSessionTitle(sessionId) || "");
    }
  }

  function goBackFromSession() {
    if (session && !session.completedAt) {
      if (
        !window.confirm(
          "Leave this workout? You can open it again from the home screen."
        )
      ) {
        return;
      }
    }
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  return (
    <div className={`stack session-detail-page${!isCompleted ? " session-detail-page--live" : ""}`}>
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
                onBlur={() => void commitQuickTitle()}
              />
            )}
          </label>
          {!isFromTemplate ? (
            <p className="muted small" style={{ margin: "-4px 0 0" }}>
              Shown in History. Leave blank for an automatic dated name. Template workouts use the
              template name.
            </p>
          ) : null}

          {isFromTemplate && liveUseSessionNotes ? (
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
              <RirRpeToggleRow
                useRIR={liveUseRIR}
                useRPE={liveUseRPE}
                onUseRIRChange={(next) => {
                  setLiveUseRIR(next);
                  saveQuickWorkoutLogPrefs({
                    useRIR: next,
                    useRPE: liveUseRPE,
                    useExerciseNotes: liveUseExerciseNotes,
                    useSessionNotes: false,
                  });
                }}
                onUseRPEChange={(next) => {
                  setLiveUseRPE(next);
                  saveQuickWorkoutLogPrefs({
                    useRIR: liveUseRIR,
                    useRPE: next,
                    useExerciseNotes: liveUseExerciseNotes,
                    useSessionNotes: false,
                  });
                }}
              />
              <div className="quick-log-display-prefs__group stack">
                <div className="quick-log-display-prefs__label muted small">Exercise</div>
                <div className="quick-log-toggle-row row">
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
                        useExerciseNotes: next,
                        useSessionNotes: false,
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
                const allSetsLogged = sessionExerciseAllSetsCoreLogged(sets);
                const lastLoggedSummary = sessionExerciseLastLoggedSummary(sets);
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
                      collapsible
                      isCollapsed={collapsedExerciseIds.has(se.id)}
                      onToggleCollapsed={() => toggleExerciseCollapsed(se.id)}
                      isActiveExercise={activeExerciseId === se.id}
                      allSetsLogged={allSetsLogged}
                      lastLoggedSummary={lastLoggedSummary}
                      onActivateExercise={() => activateExercise(se.id)}
                      nextIncompleteSetId={nextIncompleteSetId}
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
        </div>
      ) : (
        <div className="card stack session-log-workout-form">
          <label>
            Name
            <input readOnly value={workoutTitle} className="session-readonly-input" />
          </label>

          {isFromTemplate ? (
            <label>
              Description (optional)
              <textarea readOnly value={session.notes ?? ""} placeholder="—" />
            </label>
          ) : null}

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

      {!isCompleted ? (
        <div className="session-finish-dock" role="region" aria-label="Finish workout">
          <div className="session-finish-dock__inner stack">
            {canFinishWorkout ? (
              <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
                Saves to History and locks this session.
              </p>
            ) : (
              <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
                Log at least one set anywhere to enable <strong>Finish workout</strong>.
              </p>
            )}
            <button
              type="button"
              className="btn session-finish-btn session-finish-dock__btn"
              onClick={() => void onComplete()}
              disabled={!canFinishWorkout || completeBusy}
              aria-busy={completeBusy}
            >
              {completeBusy ? "Saving…" : "Finish workout"}
            </button>
          </div>
        </div>
      ) : null}
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
  /** Live logging: first set in the block that still needs weight + reps (server order). */
  isNext = false,
  /** Live logging: mark parent exercise active / expand when user focuses this row. */
  onInteractStart,
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

  const optionalColCount = (useRIR ? 1 : 0) + (useRPE ? 1 : 0);

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

  const coreLogged = useMemo(() => {
    const w = (draft.weight ?? "").toString().trim();
    const r = (draft.reps ?? "").toString().trim();
    return w !== "" && r !== "";
  }, [draft.weight, draft.reps]);

  const corePartial = useMemo(() => {
    const w = (draft.weight ?? "").toString().trim();
    const r = (draft.reps ?? "").toString().trim();
    if (w === "" && r === "") return false;
    return w === "" || r === "";
  }, [draft.weight, draft.reps]);

  const wTrim = (draft.weight ?? "").toString().trim();
  const rTrim = (draft.reps ?? "").toString().trim();
  const needsWeight = Boolean(!disabled && !coreLogged && !wTrim && (Boolean(rTrim) || isNext));
  const needsReps = Boolean(!disabled && !coreLogged && !rTrim && (Boolean(wTrim) || isNext));
  /** Avoid doubling "next" card chrome with amber fields when both are still empty. */
  const needsWeightHighlight = Boolean(needsWeight && (!isNext || rTrim !== ""));
  const needsRepsHighlight = Boolean(needsReps && (!isNext || wTrim !== ""));
  const showNextHint = Boolean(!disabled && isNext && !coreLogged && !wTrim && !rTrim);

  const synced = coreLogged && !sessionSetDraftDirty(draft, set);

  const [savePulse, setSavePulse] = useState(false);
  const mountedRef = useRef(false);
  const prevSyncedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevSyncedRef.current = synced;
      return;
    }
    if (synced && !prevSyncedRef.current) {
      setSavePulse(true);
      const t = setTimeout(() => setSavePulse(false), 720);
      prevSyncedRef.current = synced;
      return () => clearTimeout(t);
    }
    prevSyncedRef.current = synced;
  }, [synced]);

  const showNextCue = Boolean(!disabled && isNext && !coreLogged);
  const shellClass = [
    disabled ? "" : "session-set-row-card",
    !disabled && coreLogged ? "session-set-row-card--logged" : "",
    !disabled && showNextCue ? "session-set-row-card--next" : "",
    !disabled && !coreLogged && corePartial && !isNext ? "session-set-row-card--partial" : "",
    !disabled && savePulse ? "session-set-row-card--save-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const statusBadge =
    !disabled && coreLogged && synced ? (
      <span className="session-set-sync-badge" title="Saved" aria-label="Saved">
        ✓
      </span>
    ) : null;

  return (
    <div
      ref={rootRef}
      className="session-set-row-root"
      data-session-set-id={set.id}
      onFocusCapture={
        !disabled && onInteractStart
          ? () => {
              onInteractStart();
            }
          : undefined
      }
    >
      <WorkoutSetRowShell
        label={setLabel}
        headerExtra={
          <>
            {orderField}
            {statusBadge}
          </>
        }
        canRemove
        onRemove={() => onDeleteSet(set.id)}
        disabled={disabled}
        className={shellClass}
        removeButtonMode={disabled ? "default" : "icon"}
      >
        {showNextHint ? (
          <p className="session-set-next-hint muted small" style={{ margin: "0 0 6px" }}>
            {"Enter weight & reps for this set."}
          </p>
        ) : null}
        <div className="session-set-field-groups">
          <div className="session-set-core-row grid-set-row" style={{ "--set-cols": 2 }}>
            <label
              className={[
                "session-set-field session-set-field--primary",
                needsWeightHighlight ? "session-set-field--needs-value" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="session-set-field-label">Weight</span>
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
                aria-invalid={needsWeightHighlight ? true : undefined}
              />
            </label>
            <label
              className={[
                "session-set-field session-set-field--primary",
                needsRepsHighlight ? "session-set-field--needs-value" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="session-set-field-label">Reps</span>
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
                aria-invalid={needsRepsHighlight ? true : undefined}
              />
            </label>
          </div>

          {useRIR || useRPE ? (
            <div className="session-set-optional-row grid-set-row" style={{ "--set-cols": optionalColCount }}>
              {useRIR ? (
                <label className="session-set-field session-set-field--secondary">
                  <span className="session-set-field-label">RIR</span>
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
                    title="Optional"
                  />
                </label>
              ) : null}
              {useRPE ? (
                <label className="session-set-field session-set-field--secondary">
                  <span className="session-set-field-label">RPE</span>
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
                    title="Optional"
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        {useSetNotes ? (
          <label className="session-set-notes-field mt-2">
            <span className="session-set-field-label session-set-field-label--secondary">Notes</span>
            <input
              id={fieldIds.notes}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              onBlur={flushNow}
              enterKeyHint="done"
              disabled={disabled}
              placeholder="Optional"
              title="Optional"
            />
          </label>
        ) : null}
      </WorkoutSetRowShell>
    </div>
  );
});

SessionSetRow.displayName = "SessionSetRow";
