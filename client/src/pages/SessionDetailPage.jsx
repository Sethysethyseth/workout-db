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
import * as analyticsApi from "../api/analyticsApi.js";
import * as exerciseApi from "../api/exerciseApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ExercisePickerSuggestions } from "../components/workout/ExercisePickerSuggestions.jsx";
import { PlanningSetCountControl } from "../components/templates/PlanningSetCountControl.jsx";
import { RirRpeToggleRow } from "../components/templates/RirRpeToggleRow.jsx";
import { ViewModeToggle } from "../components/templates/ViewModeToggle.jsx";
import { WorkoutTemplateTableView } from "../components/templates/WorkoutTemplateTableView.jsx";
import { WorkoutSetRowShell } from "../components/workout/WorkoutSetRowShell.jsx";
import { MetricInfoButton } from "../components/workout/MetricInfoButton.jsx";
import { AddExerciseToLibrarySheet } from "../components/workout/AddExerciseToLibrarySheet.jsx";
import { CoachPanel } from "../components/coach/CoachPanel.jsx";
import { CompletedSessionSummary } from "../components/workout/CompletedSessionSummary.jsx";
import { getAdHocSessionTitle, setAdHocSessionTitle } from "../lib/adHocSessionTitle.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";
import { smartWorkoutNameFromSessionExercises } from "../lib/smartWorkoutName.js";
import {
  loadQuickWorkoutLogPrefs,
  saveQuickWorkoutLogPrefs,
} from "../lib/quickWorkoutLogPrefs.js";
import { loadEffortSignal, saveEffortSignal } from "../lib/effortSignalPref.js";
import { loadWeightUnit, saveWeightUnit } from "../lib/weightUnitPref.js";
import { useSessionLiveLoggingGuard } from "../context/SessionLiveLoggingGuardContext.jsx";
import {
  BLANK_SESSION_EXERCISE_NAME,
  inputToSessionExerciseName,
  isBlankSessionExerciseName,
  sessionExerciseNameForInput,
} from "../lib/sessionExerciseName.js";
import { Eyebrow } from "../components/blocks/ui/Eyebrow.jsx";
import {
  AsPlannedControl,
  BlockExerciseCard,
  BlockSessionHeader,
  EffortCapWarn,
  PlanLine,
  TimedSecInput,
  blockSetIsLogged,
  durationPlaceholderFromPlan,
  effortPlaceholderFromPlan,
  isOverEffortCap,
  isTimedPlanExercise,
  isTimedPlanSet,
  parseSeconds,
  planSetAt,
  repsPlaceholderFromPlan,
  weightPlaceholderFromPlan,
} from "../components/blocks/log/index.js";
import { derivePerSideMode } from "../components/blocks/log/perSideMode.js";
import "../styles/blocks/bk-ui.css";
import "../styles/blocks/bk-log.css";

const exerciseResolutionCache = new Map();

/** Exercise-identity key for PR matching: id-based when resolved, name fallback otherwise. */
function prMatchKey(exerciseId, userExerciseId, exerciseName) {
  if (exerciseId != null) return `id:${exerciseId}`;
  if (userExerciseId != null) return `user:${userExerciseId}`;
  if (exerciseName != null) return `name:${exerciseName}`;
  return null;
}

function exerciseResolutionCacheKey(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

async function cacheExerciseResolutions(names, onUpdate) {
  const unique = [];
  const seen = new Set();
  for (const raw of names) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (!exerciseResolutionCache.has(key)) unique.push(trimmed);
  }
  if (unique.length === 0) return;
  try {
    const data = await exerciseApi.resolveExerciseNames(unique);
    const results = Array.isArray(data?.results) ? data.results : [];
    for (const row of results) {
      const key = exerciseResolutionCacheKey(row.name);
      if (key) exerciseResolutionCache.set(key, row);
    }
    onUpdate?.();
  } catch {
    // Network failure: render no indicator rather than a wrong one.
  }
}

async function refreshExerciseResolution(name, onUpdate) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return;
  try {
    const data = await exerciseApi.resolveExerciseNames([trimmed]);
    const row = data?.results?.[0];
    if (row) {
      const key = exerciseResolutionCacheKey(row.name);
      if (key) exerciseResolutionCache.set(key, row);
      onUpdate?.();
    }
  } catch {
    // Keep prior cache entry or absent state on failure.
  }
}

function invalidateExerciseResolution(name) {
  const key = exerciseResolutionCacheKey(name);
  if (key) exerciseResolutionCache.delete(key);
}

function buildSessionExerciseNamePatch(storedName, identity = {}) {
  const patch = { exerciseName: storedName };
  if (identity.exerciseId) {
    patch.exerciseId = identity.exerciseId;
  } else if (identity.userExerciseId) {
    patch.userExerciseId = identity.userExerciseId;
  }
  return patch;
}

function lookupExerciseTrackedStatus(exerciseName) {
  const key = exerciseResolutionCacheKey(exerciseName);
  if (!key) return null;
  const row = exerciseResolutionCache.get(key);
  if (!row) return null;
  return row.resolved ? "resolved" : "unresolved";
}

function ExerciseTrackedIndicator({ status, interactive = false, onOpenAddToLibrary }) {
  const unresolvedIcon = (
    <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2.5 2"
      />
    </svg>
  );

  const unresolvedPillMarkup = interactive ? (
    <button
      type="button"
      className="session-exercise-tracked-pill session-exercise-tracked-pill--unresolved session-exercise-tracked-pill--action"
      title="Not tracked - add to library?"
      aria-label="Not tracked - add to library?"
      onClick={() => onOpenAddToLibrary?.()}
    >
      {unresolvedIcon}
      Not tracked - add?
      <span className="session-exercise-tracked-pill-plus" aria-hidden="true">
        +
      </span>
    </button>
  ) : (
    <span className="session-exercise-tracked-pill session-exercise-tracked-pill--unresolved">
      {unresolvedIcon}
      Not tracked
    </span>
  );

  return (
    <span className="session-exercise-tracked-slot">
      <span className="session-exercise-tracked-slot-sizer" aria-hidden="true">
        {unresolvedPillMarkup}
      </span>
      {status === "resolved" ? (
        <span
          className="session-exercise-tracked-slot-pill session-exercise-tracked-pill session-exercise-tracked-pill--resolved"
          title="Tracked - counts toward your analytics"
          aria-label="Tracked - counts toward your analytics"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.25" />
            <path
              d="M4.25 7.25 L6.25 9.25 L9.75 4.75"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tracked
        </span>
      ) : null}
      {status === "unresolved" ? (
        interactive ? (
          <span className="session-exercise-tracked-slot-pill">{unresolvedPillMarkup}</span>
        ) : (
          <span
            className="session-exercise-tracked-slot-pill session-exercise-tracked-pill session-exercise-tracked-pill--unresolved"
            title="Not in the exercise library yet - analytics can't attribute this one"
            aria-label="Not in the exercise library yet - analytics can't attribute this one"
          >
            {unresolvedIcon}
            Not tracked
          </span>
        )
      ) : null}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextSetOrder(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  const max = sets.reduce((acc, s) => (s.order > acc ? s.order : acc), 0);
  return max + 1;
}

function buildCreateSetBodyFromLast(last, sessionExerciseId, order, side) {
  const body = { sessionExerciseId, order };
  if (side) body.side = side;
  if (last) {
    const w = last.weight != null ? String(last.weight).trim() : "";
    if (w !== "") body.weight = last.weight;
    // Intentionally do NOT copy reps: it can make a new set look completed.
    const rpe = last.rpe != null ? String(last.rpe).trim() : "";
    if (rpe !== "") body.rpe = last.rpe;
    const rir = last.rir != null ? String(last.rir).trim() : "";
    if (rir !== "") body.rir = last.rir;
    const note = last.notes != null ? String(last.notes).trim() : "";
    if (note) body.notes = note;
  }
  return body;
}

function groupSetsIntoRenderUnits(sortedSets, perSideMode) {
  if (!perSideMode) {
    return sortedSets.map((s, i) => ({
      type: "single",
      pairOrdinal: null,
      sets: [s],
      setOrdinal: i + 1,
    }));
  }
  const units = [];
  let i = 0;
  let pairNum = 1;
  while (i < sortedSets.length) {
    if (i + 1 < sortedSets.length) {
      units.push({
        type: "pair",
        pairOrdinal: pairNum,
        sets: [sortedSets[i], sortedSets[i + 1]],
      });
      pairNum += 1;
      i += 2;
    } else {
      units.push({
        type: "single",
        pairOrdinal: null,
        sets: [sortedSets[i]],
        setOrdinal: pairNum,
      });
      pairNum += 1;
      i += 1;
    }
  }
  return units;
}

function perSideSetLabel(set, pairOrdinal, setOrdinal) {
  if (set.side === "L") return `Set ${pairOrdinal} - Left`;
  if (set.side === "R") return `Set ${pairOrdinal} - Right`;
  return `Set ${setOrdinal ?? "—"}`;
}

async function createSetPairForExercise(sessionId, sessionExerciseId, getLatestSession) {
  for (const side of ["L", "R"]) {
    const latest = await getLatestSession();
    if (!latest) return;
    const setsList = (Array.isArray(latest.sets) ? latest.sets : [])
      .filter((s) => s.sessionExerciseId === sessionExerciseId)
      .sort((a, b) => a.order - b.order);
    const order = nextSetOrder(latest);
    const lastSameSide = [...setsList].reverse().find((s) => s.side === side) ?? null;
    const body = buildCreateSetBodyFromLast(lastSameSide, sessionExerciseId, order, side);
    await sessionApi.createSet(sessionId, body);
  }
}

/** True when a session set row has no logged targets or notes (safe to drop when lowering set count). */
function sessionSetRowIsBlank(set) {
  if (!set || typeof set !== "object") return true;
  const t = (v) => (v == null ? "" : String(v)).trim();
  return (
    t(set.weight) === "" &&
    t(set.reps) === "" &&
    t(set.durationSec) === "" &&
    t(set.rir) === "" &&
    t(set.rpe) === "" &&
    t(set.notes) === ""
  );
}

/**
 * Weight + reps present — minimum “this set is logged” signal for UX (optional fields ignored).
 * Timed sets (durationSec) count as logged the same way for Finish / effort (BK9).
 */
function sessionSetHasCoreLogged(set) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (t(set.durationSec) !== "") return true;
  return t(set.weight) !== "" && t(set.reps) !== "";
}

/** Non-null, non-blank rir or rpe on a set — used to lock the live effort signal. */
function sessionSetHasAnyEffortValue(set) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  return t(set.rir) !== "" || t(set.rpe) !== "";
}

/** Whether a set has a value for the active effort signal (`"rir"` | `"rpe"`). */
function sessionSetHasSignalEffort(set, signal) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (signal === "rir") return t(set.rir) !== "";
  if (signal === "rpe") return t(set.rpe) !== "";
  return true;
}

/**
 * The effort currency ALREADY logged on a session's sets, or null. RIR wins
 * when both appear, matching the stored-boolean mapping on the edit pages.
 *
 * Seeding must prefer this over the device pref / template value: the lock is
 * signal-agnostic (any rir OR rpe locks), so re-seeding a session to a signal
 * its sets have no values for would lock the control onto that signal AND
 * block Finish, with no way back - the exact mid-workout dead end F3's
 * enforcement boundary forbids.
 */
function sessionLoggedEffortSignal(sets) {
  const list = Array.isArray(sets) ? sets : [];
  if (list.some((s) => sessionSetHasSignalEffort(s, "rir"))) return "rir";
  if (list.some((s) => sessionSetHasSignalEffort(s, "rpe"))) return "rpe";
  return null;
}

function sessionSetDraftDirty(draft, set) {
  const norm = (v) => (v == null ? "" : String(v)).trim();
  const draftDur =
    draft.durationSec !== undefined && draft.durationSec !== ""
      ? String(parseSeconds(draft.durationSec) ?? draft.durationSec)
      : "";
  return (
    norm(draft.weight) !== norm(set.weight) ||
    norm(draft.reps) !== norm(set.reps) ||
    draftDur !== norm(set.durationSec) ||
    norm(draft.rir) !== norm(set.rir) ||
    norm(draft.rpe) !== norm(set.rpe) ||
    norm(draft.notes) !== norm(set.notes)
  );
}

/** POST create-set field payload from local draft (promotion path). Omits blank fields. */
function promotionPayloadFromDraft(d) {
  const payload = {};
  const t = (v) => (v == null ? "" : String(v)).trim();
  const dur = parseSeconds(d.durationSec);
  if (dur != null) {
    payload.durationSec = dur;
  } else if (t(d.reps) !== "") {
    payload.reps = Number(String(d.reps).trim());
  }
  if (t(d.weight) !== "") payload.weight = Number(String(d.weight).trim());
  if (t(d.rpe) !== "") payload.rpe = Number(String(d.rpe).trim());
  // rir = 0 is a real value - blank check via trim, never truthiness on the number.
  if (t(d.rir) !== "") payload.rir = Number(String(d.rir).trim());
  const n = t(d.notes);
  if (n) payload.notes = n;
  return payload;
}

function payloadKey(p) {
  return JSON.stringify(p);
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
      const dur = s.durationSec != null ? String(s.durationSec).trim() : "";
      if (dur !== "") {
        const label = w !== "" ? `${w} × ${dur}s` : `${dur}s`;
        if (s.side === "L" || s.side === "R") return `${s.side} ${label}`;
        return label;
      }
      const r = String(s.reps ?? "").trim();
      if (s.side === "L" || s.side === "R") {
        return `${s.side} ${w} × ${r}`;
      }
      return `${w} × ${r}`;
    }
  }
  return null;
}

/** True when a live RIR draft is non-empty and not a whole number. */
function isNonIntegerRirValue(v) {
  const t = String(v ?? "").trim();
  if (t === "") return false;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return true;
  const n = Number(t);
  return Number.isFinite(n) && !Number.isInteger(n);
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
  /** Live session: report draft tracked/untracked status while typing (write-free). */
  onDraftTrackedStatusChange,
  /** After a successful discard, skip any remaining blur/debounce writes. */
  writesFrozenRef,
}) {
  const nameInputId = `session-ex-name-${sessionExercise.id}`;
  const suggestionsListId = `${nameInputId}-suggestions`;
  const nameWrapRef = useRef(null);
  const pendingIdentityRef = useRef(null);
  const skipBlurCommitRef = useRef(false);
  const searchSeqRef = useRef(0);
  const resolveSeqRef = useRef(0);

  const [name, setName] = useState(() =>
    sessionExerciseNameForInput(sessionExercise.exerciseName)
  );
  const [notes, setNotes] = useState(sessionExercise.notes ?? "");
  const [fieldError, setFieldError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync local inputs when server exercise row changes */
    setName(sessionExerciseNameForInput(sessionExercise.exerciseName));
    setNotes(sessionExercise.notes ?? "");
    pendingIdentityRef.current = null;
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    onDraftTrackedStatusChange?.(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sessionExercise.id, sessionExercise.exerciseName, sessionExercise.notes, onDraftTrackedStatusChange]);

  useEffect(() => {
    if (disabled || !onDraftTrackedStatusChange) return undefined;

    const trimmed = String(name ?? "").trim();
    if (trimmed.length < 2) {
      onDraftTrackedStatusChange(null);
      return undefined;
    }

    const storedName = inputToSessionExerciseName(name);
    if (storedName === sessionExercise.exerciseName) {
      onDraftTrackedStatusChange(null);
      return undefined;
    }

    let cancelled = false;
    const seq = resolveSeqRef.current + 1;
    resolveSeqRef.current = seq;
    const timer = window.setTimeout(() => {
      exerciseApi
        .resolveExerciseNames([storedName])
        .then((data) => {
          if (cancelled || seq !== resolveSeqRef.current) return;
          const row = data?.results?.[0];
          onDraftTrackedStatusChange(row?.resolved ? "resolved" : "unresolved");
        })
        .catch(() => {
          if (!cancelled && seq === resolveSeqRef.current) {
            onDraftTrackedStatusChange(null);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [disabled, name, sessionExercise.exerciseName, onDraftTrackedStatusChange]);

  useEffect(() => {
    if (disabled) return undefined;

    const trimmed = String(name ?? "").trim();
    if (trimmed.length < 2) {
      /* eslint-disable react-hooks/set-state-in-effect -- clear stale suggestions when query is too short */
      setSuggestions([]);
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }

    const seq = searchSeqRef.current + 1;
    searchSeqRef.current = seq;
    const timer = window.setTimeout(async () => {
      try {
        const data = await exerciseApi.searchExercises(trimmed, { limit: 10 });
        if (seq !== searchSeqRef.current) return;
        const results = Array.isArray(data?.results) ? data.results : [];
        setSuggestions(results);
        setSuggestionsOpen(results.length > 0);
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setSuggestions([]);
        setSuggestionsOpen(false);
        setActiveIndex(-1);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [disabled, name]);

  useEffect(() => {
    if (disabled) return undefined;

    function onDocDown(e) {
      if (!nameWrapRef.current || nameWrapRef.current.contains(e.target)) return;
      setSuggestionsOpen(false);
    }

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [disabled]);

  async function commitExercise(patch) {
    if (disabled || writesFrozenRef?.current) return;
    setFieldError(null);
    try {
      const data = await sessionApi.updateSessionExercise(sessionId, sessionExercise.id, patch);
      if (writesFrozenRef?.current) return;
      const row = data?.sessionExercise;
      if (row && onExerciseCommitted) {
        onExerciseCommitted(row);
      } else if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      if (writesFrozenRef?.current) return;
      setName(sessionExerciseNameForInput(sessionExercise.exerciseName));
      setNotes(sessionExercise.notes ?? "");
      pendingIdentityRef.current = null;
      setFieldError(err);
    }
  }

  function applySuggestion(row) {
    setName(row.name);
    pendingIdentityRef.current = {
      exerciseId: row.exerciseId ?? undefined,
      userExerciseId: row.userExerciseId ?? undefined,
    };
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  }

  function buildNamePatch(storedName, identity = pendingIdentityRef.current) {
    const patch = { exerciseName: storedName };
    if (identity?.exerciseId) {
      patch.exerciseId = identity.exerciseId;
    } else if (identity?.userExerciseId) {
      patch.userExerciseId = identity.userExerciseId;
    }
    return patch;
  }

  async function commitSelectedName(storedName, identity) {
    skipBlurCommitRef.current = true;
    pendingIdentityRef.current = null;
    try {
      await commitExercise(buildNamePatch(storedName, identity));
    } finally {
      skipBlurCommitRef.current = false;
    }
  }

  async function commitName() {
    if (skipBlurCommitRef.current) return;
    setSuggestionsOpen(false);
    const nextStored = inputToSessionExerciseName(name);
    if (nextStored === sessionExercise.exerciseName) {
      pendingIdentityRef.current = null;
      return;
    }

    const patch = buildNamePatch(nextStored);
    pendingIdentityRef.current = null;
    await commitExercise(patch);
  }

  async function commitNotes() {
    const n = notes.trim();
    const prev = (sessionExercise.notes ?? "").trim();
    if (n === prev) return;
    await commitExercise({ notes: n ? n : null });
  }

  function handleNameKeyDown(e) {
    if (e.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!suggestionsOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      const row = suggestions[activeIndex];
      applySuggestion(row);
      void commitSelectedName(inputToSessionExerciseName(row.name), {
        exerciseId: row.exerciseId ?? undefined,
        userExerciseId: row.userExerciseId ?? undefined,
      });
    }
  }

  async function selectSuggestion(row) {
    applySuggestion(row);
    const storedName = inputToSessionExerciseName(row.name);
    if (storedName === sessionExercise.exerciseName) {
      pendingIdentityRef.current = null;
      return;
    }
    await commitSelectedName(storedName, {
      exerciseId: row.exerciseId ?? undefined,
      userExerciseId: row.userExerciseId ?? undefined,
    });
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
      <div className="exercise-picker-input-wrap" ref={nameWrapRef}>
        <input
          id={nameInputId}
          value={name}
          autoComplete="off"
          placeholder="Type or pick a suggestion"
          aria-expanded={suggestionsOpen && suggestions.length > 0}
          aria-controls={suggestions.length > 0 ? suggestionsListId : undefined}
          aria-autocomplete="list"
          onChange={(e) => {
            pendingIdentityRef.current = null;
            setName(e.target.value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setSuggestionsOpen(true);
            }
          }}
          onBlur={() => {
            void commitName();
          }}
          onKeyDown={handleNameKeyDown}
        />
        <ExercisePickerSuggestions
          id={suggestionsListId}
          open={suggestionsOpen}
          results={suggestions}
          activeIndex={activeIndex}
          onSelect={(row) => {
            void selectSuggestion(row);
          }}
        />
      </div>
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

/** Set row for live session logging; draft (zero sets) or persisted set (PATCH on blur). */
const SessionSetRow = memo(function SessionSetRow({
  isDraft = false,
  useRIR = true,
  useRPE = true,
  useSetNotes = true,
  onInteractStart,
  resumeVersion,
  sessionExerciseId,
  onPromoteDraft,
  set,
  setOrdinal,
  setLabelOverride,
  sideBadgeLetter,
  partnerSet,
  onAutofillPartnerWeight,
  lockSetOrder = false,
  disabled = false,
  onUpdateSet,
  onDeleteSet,
  isNext = false,
  hasPR = false,
  /** Soft cue: core-logged set missing the active effort signal value. */
  highlightMissingEffort = false,
  /** After a successful discard, skip remaining debounce/blur writes. */
  writesFrozenRef,
  /**
   * BK9: matching plan set for placeholders / as-planned / caps.
   * Prop ABSENCE on non-block paths must not change behavior.
   */
  plan = undefined,
  planSet = undefined,
  timedMode = false,
}) {
  const rootRef = useRef(null);
  const [draft, setDraft] = useState(() =>
    isDraft
      ? { reps: "", weight: "", rpe: "", rir: "", notes: "", durationSec: "" }
      : {
          order: String(set.order ?? ""),
          reps: set.reps ?? "",
          weight: set.weight ?? "",
          rpe: set.rpe ?? "",
          rir: set.rir ?? "",
          notes: set.notes ?? "",
          durationSec: set.durationSec != null ? String(set.durationSec) : "",
        }
  );
  const [rirGateHint, setRirGateHint] = useState(null);
  const draftRef = useRef(draft);
  const promotingRef = useRef(false);
  const lastSentKeyRef = useRef(null);

  const fieldIds = useMemo(
    () =>
      isDraft
        ? {
            weight: `log-draft-${sessionExerciseId}-weight`,
            reps: `log-draft-${sessionExerciseId}-reps`,
            durationSec: `log-draft-${sessionExerciseId}-duration`,
            rir: `log-draft-${sessionExerciseId}-rir`,
            rpe: `log-draft-${sessionExerciseId}-rpe`,
            notes: `log-draft-${sessionExerciseId}-notes`,
          }
        : {
            weight: `log-set-${set.id}-weight`,
            reps: `log-set-${set.id}-reps`,
            durationSec: `log-set-${set.id}-duration`,
            rir: `log-set-${set.id}-rir`,
            rpe: `log-set-${set.id}-rpe`,
            notes: `log-set-${set.id}-notes`,
          },
    [isDraft, sessionExerciseId, set?.id]
  );

  useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!isDraft) return;
    const empty = { reps: "", weight: "", rpe: "", rir: "", notes: "", durationSec: "" };
    setDraft(empty);
    draftRef.current = empty;
    lastSentKeyRef.current = null;
    setRirGateHint(null);
  }, [isDraft, resumeVersion]);

  function payloadFromDraft(d) {
    const payload = {};
    payload.order = lockSetOrder ? Number(set.order) : Number(d.order);
    if (timedMode) {
      const sec = parseSeconds(d.durationSec);
      payload.durationSec = sec == null ? "" : sec;
      payload.reps = "";
    } else {
      payload.reps = d.reps === "" ? "" : Number(d.reps);
    }
    payload.weight = d.weight === "" ? "" : Number(d.weight);
    payload.rpe = d.rpe === "" ? "" : Number(d.rpe);
    // Decimal RIR is rejected server-side; never send a non-integer.
    // rir = 0 is a real value - empty string is the only blank.
    if (d.rir === "" || isNonIntegerRirValue(d.rir)) {
      payload.rir = "";
    } else {
      payload.rir = Number(d.rir);
    }
    payload.notes = d.notes === "" ? "" : d.notes;
    return payload;
  }

  function onRirChange(e) {
    const v = e.target.value;
    // Allow empty or digits only — block decimals at the keystroke.
    if (v === "" || /^\d*$/.test(v)) {
      setRirGateHint(null);
      setDraft((d) => ({ ...d, rir: v }));
      return;
    }
    setRirGateHint("Whole numbers only — decimal RIR won't count.");
  }

  useEffect(() => {
    if (isDraft) return;
    const next = {
      order: String(set.order ?? ""),
      reps: set.reps ?? "",
      weight: set.weight ?? "",
      rpe: set.rpe ?? "",
      rir: set.rir ?? "",
      notes: set.notes ?? "",
      durationSec: set.durationSec != null ? String(set.durationSec) : "",
    };
    const echoedKey = payloadKey(payloadFromDraft(next));
    if (echoedKey === payloadKey(payloadFromDraft(draftRef.current))) {
      lastSentKeyRef.current = echoedKey;
      return;
    }
    if (rootRef.current?.contains(document.activeElement)) {
      // Record what the SERVER now holds, not the local draft: the draft may
      // already contain unsent keystrokes, and keying them as "sent" would
      // silently suppress their flush on blur/debounce (lost-reps bug).
      lastSentKeyRef.current = echoedKey;
      return;
    }
    setDraft(next);
    lastSentKeyRef.current = echoedKey;
    // payloadFromDraft closes over `set` + lockSetOrder; deps list mirrors those inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when server fields change
  }, [
    isDraft,
    set?.id,
    set?.order,
    set?.reps,
    set?.weight,
    set?.rpe,
    set?.rir,
    set?.notes,
    set?.durationSec,
    lockSetOrder,
    timedMode,
  ]);

  const tryPromote = useCallback(async () => {
    if (!isDraft) return;
    if (writesFrozenRef?.current) return;
    if (promotingRef.current) return;
    const cur = draftRef.current;
    if (sessionSetRowIsBlank(cur)) return;
    if (isNonIntegerRirValue(cur.rir)) {
      setRirGateHint("Whole numbers only — decimal RIR won't count.");
      return;
    }
    const k = payloadKey(promotionPayloadFromDraft(cur));
    if (k === lastSentKeyRef.current) return;
    promotingRef.current = true;
    try {
      const created = await onPromoteDraft(cur);
      if (writesFrozenRef?.current) return;
      lastSentKeyRef.current = k;
      // The POST above sent a snapshot (`cur`) taken before the await; keystrokes
      // typed into this same row while it was in flight already live in local
      // state but never reached the server under the just-created set's id -
      // patch them on now.
      if (created && created.id != null && onUpdateSet) {
        const latest = draftRef.current;
        if (isNonIntegerRirValue(latest.rir)) {
          setRirGateHint("Whole numbers only — decimal RIR won't count.");
          return;
        }
        const latestKey = payloadKey(promotionPayloadFromDraft(latest));
        if (latestKey !== k) {
          lastSentKeyRef.current = latestKey;
          const patch = {
            order: created.order,
            weight: latest.weight === "" ? "" : Number(latest.weight),
            rpe: latest.rpe === "" ? "" : Number(latest.rpe),
            rir: latest.rir === "" ? "" : Number(latest.rir),
            notes: latest.notes === "" ? "" : latest.notes,
          };
          if (timedMode) {
            const sec = parseSeconds(latest.durationSec);
            patch.durationSec = sec == null ? "" : sec;
            patch.reps = "";
          } else {
            patch.reps = latest.reps === "" ? "" : Number(latest.reps);
          }
          onUpdateSet(created.id, patch);
        }
      }
    } catch {
      lastSentKeyRef.current = null;
    } finally {
      promotingRef.current = false;
    }
  }, [isDraft, onPromoteDraft, onUpdateSet, timedMode, writesFrozenRef]);

  function flushNow() {
    if (isDraft || disabled || writesFrozenRef?.current) return;
    if (isNonIntegerRirValue(draftRef.current.rir)) {
      setRirGateHint("Whole numbers only — decimal RIR won't count.");
      return;
    }
    const latest = payloadFromDraft(draftRef.current);
    const k = payloadKey(latest);
    if (k === lastSentKeyRef.current) return;
    lastSentKeyRef.current = k;
    onUpdateSet(set.id, latest);
  }

  function onFieldBlur() {
    if (isDraft) void tryPromote();
    else flushNow();
  }

  function onWeightFieldBlur() {
    if (isDraft) {
      void tryPromote();
      return;
    }
    flushNow();
    if (
      !disabled &&
      set?.side === "L" &&
      partnerSet &&
      onAutofillPartnerWeight
    ) {
      const w = (draftRef.current.weight ?? "").toString().trim();
      if (w !== "") {
        onAutofillPartnerWeight(partnerSet.id, w, partnerSet);
      }
    }
  }

  function applyAsPlanned() {
    // Guard: only when a plan set is present. Never fills effort.
    if (planSet == null || disabled || writesFrozenRef?.current) return;
    const cur = { ...draftRef.current };
    if (timedMode && planSet.durationSec != null) {
      cur.durationSec = String(planSet.durationSec);
    } else if (planSet.reps != null) {
      cur.reps = String(planSet.reps);
    }
    if (planSet.weight != null) {
      cur.weight = String(planSet.weight);
    }
    setDraft(cur);
    draftRef.current = cur;
    if (isDraft) {
      void tryPromote();
    } else {
      flushNow();
    }
  }

  useEffect(() => {
    if (writesFrozenRef?.current) return;
    if (isDraft) {
      const cur = draftRef.current;
      if (sessionSetRowIsBlank(cur)) return;
      if (isNonIntegerRirValue(cur.rir)) return;
      const k = payloadKey(promotionPayloadFromDraft(cur));
      if (k === lastSentKeyRef.current) return;
      const t = setTimeout(() => {
        if (writesFrozenRef?.current) return;
        void tryPromote();
      }, 900);
      return () => clearTimeout(t);
    }
    if (disabled) return;
    if (isNonIntegerRirValue(draft.rir)) return;
    const latest = payloadFromDraft(draft);
    if (payloadKey(latest) === lastSentKeyRef.current) return;
    const t = setTimeout(() => {
      if (writesFrozenRef?.current) return;
      if (isNonIntegerRirValue(draftRef.current.rir)) return;
      const cur = payloadFromDraft(draftRef.current);
      const k = payloadKey(cur);
      if (k === lastSentKeyRef.current) return;
      lastSentKeyRef.current = k;
      onUpdateSet(set.id, cur);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, disabled, isDraft, tryPromote]);

  function focusNextField(from) {
    const chain = ["weight", timedMode ? "durationSec" : "reps"];
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
    !isDraft && !disabled && !lockSetOrder ? (
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

  const setLabel =
    setLabelOverride ??
    (isDraft ? "Set 1" : lockSetOrder ? `Set ${setOrdinal ?? "—"}` : `Set ${draft.order || "—"}`);

  const coreLogged = useMemo(() => {
    if (timedMode) {
      return parseSeconds(draft.durationSec) != null;
    }
    const w = (draft.weight ?? "").toString().trim();
    const r = (draft.reps ?? "").toString().trim();
    return w !== "" && r !== "";
  }, [draft.weight, draft.reps, draft.durationSec, timedMode]);

  const corePartial = useMemo(() => {
    if (timedMode) {
      const w = (draft.weight ?? "").toString().trim();
      const d = (draft.durationSec ?? "").toString().trim();
      if (w === "" && d === "") return false;
      return parseSeconds(draft.durationSec) == null && d !== "";
    }
    const w = (draft.weight ?? "").toString().trim();
    const r = (draft.reps ?? "").toString().trim();
    if (w === "" && r === "") return false;
    return w === "" || r === "";
  }, [draft.weight, draft.reps, draft.durationSec, timedMode]);

  const wTrim = (draft.weight ?? "").toString().trim();
  const rTrim = (draft.reps ?? "").toString().trim();
  const dTrim = (draft.durationSec ?? "").toString().trim();
  const needsWeight = timedMode
    ? false
    : Boolean(!disabled && !coreLogged && !wTrim && (Boolean(rTrim) || isNext));
  const needsReps = timedMode
    ? false
    : Boolean(!disabled && !coreLogged && !rTrim && (Boolean(wTrim) || isNext));
  const needsDuration = Boolean(
    timedMode && !disabled && !coreLogged && (Boolean(wTrim) || isNext || dTrim !== "")
  );
  const needsWeightHighlight = Boolean(needsWeight && (!isNext || rTrim !== ""));
  const needsRepsHighlight = Boolean(needsReps && (!isNext || wTrim !== ""));
  const needsDurationHighlight = Boolean(
    needsDuration && (!isNext || wTrim !== "" || dTrim !== "")
  );
  const rirTrim = (draft.rir ?? "").toString().trim();
  const rpeTrim = (draft.rpe ?? "").toString().trim();
  const needsRirHighlight = Boolean(
    highlightMissingEffort && !disabled && !isDraft && coreLogged && useRIR && rirTrim === ""
  );
  const needsRpeHighlight = Boolean(
    highlightMissingEffort && !disabled && !isDraft && coreLogged && useRPE && rpeTrim === ""
  );
  const showNextHint = Boolean(
    !disabled &&
      isNext &&
      !coreLogged &&
      !wTrim &&
      !(timedMode ? dTrim : rTrim)
  );

  const synced = !isDraft && coreLogged && !sessionSetDraftDirty(draft, set);

  const [savePulse, setSavePulse] = useState(false);
  const mountedRef = useRef(false);
  const prevSyncedRef = useRef(false);

  useEffect(() => {
    if (isDraft) return;
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
  }, [isDraft, synced]);

  const showNextCue = Boolean(!disabled && isNext && !coreLogged);
  const shellClass = isDraft
    ? ["session-set-row-card", corePartial ? "session-set-row-card--partial" : ""].filter(Boolean).join(" ")
    : [
        disabled ? "" : "session-set-row-card",
        !disabled && coreLogged ? "session-set-row-card--logged" : "",
        !disabled && showNextCue ? "session-set-row-card--next" : "",
        !disabled && !coreLogged && corePartial && !isNext ? "session-set-row-card--partial" : "",
        !disabled && savePulse ? "session-set-row-card--save-pulse" : "",
      ]
        .filter(Boolean)
        .join(" ");

  const statusBadge =
    !isDraft && !disabled && coreLogged && synced ? (
      <span className="session-set-sync-badge" title="Saved" aria-label="Saved">
        ✓
      </span>
    ) : null;

  const sideBadge =
    sideBadgeLetter && !isDraft ? (
      <span
        className="session-set-side-badge"
        title={sideBadgeLetter === "L" ? "Left side" : "Right side"}
        aria-label={sideBadgeLetter === "L" ? "Left side" : "Right side"}
      >
        {sideBadgeLetter}
      </span>
    ) : null;

  const weightPh =
    planSet != null ? weightPlaceholderFromPlan(planSet) ?? "e.g. 185" : "e.g. 185";
  const repsPh =
    planSet != null ? repsPlaceholderFromPlan(planSet) ?? "e.g. 8" : "e.g. 8";
  const durationPh =
    planSet != null ? durationPlaceholderFromPlan(planSet) ?? "e.g. 45" : "e.g. 45";
  const rirPh =
    planSet != null ? effortPlaceholderFromPlan(plan, planSet, "rir") ?? "—" : "—";
  const rpePh =
    planSet != null ? effortPlaceholderFromPlan(plan, planSet, "rpe") ?? "—" : "—";

  const overCap =
    plan != null &&
    planSet != null &&
    isOverEffortCap(plan, planSet, draft.rpe, draft.rir);

  return (
    <div
      ref={isDraft ? undefined : rootRef}
      className="session-set-row-root"
      data-session-set-id={isDraft ? undefined : set.id}
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
          isDraft ? null : (
            <>
              {orderField}
              {sideBadge}
              {statusBadge}
              {hasPR && disabled ? (
                <span className="session-set-pr-chip" title="Personal record">
                  PR
                </span>
              ) : null}
            </>
          )
        }
        canRemove={!isDraft}
        onRemove={isDraft ? undefined : () => onDeleteSet(set.id)}
        disabled={isDraft ? false : disabled}
        className={shellClass}
        removeButtonMode={isDraft || !disabled ? "icon" : "default"}
      >
        {showNextHint ? (
          <p className="session-set-next-hint muted small" style={{ margin: "0 0 6px" }}>
            {timedMode
              ? "Enter seconds for this set."
              : "Enter weight & reps for this set."}
          </p>
        ) : null}
        {planSet != null && !disabled ? (
          <div className="bk-log-set-targets">
            <AsPlannedControl onFill={applyAsPlanned} disabled={disabled} />
          </div>
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
                type="number"
                value={draft.weight}
                onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                onBlur={onWeightFieldBlur}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => onEnterNext(e, "weight")}
                enterKeyHint="next"
                inputMode="decimal"
                min="0"
                step="0.01"
                disabled={isDraft ? false : disabled}
                placeholder={weightPh}
                aria-invalid={needsWeightHighlight ? true : undefined}
              />
            </label>
            {timedMode ? (
              <TimedSecInput
                id={fieldIds.durationSec}
                value={draft.durationSec}
                onChange={(e) => setDraft((d) => ({ ...d, durationSec: e.target.value }))}
                onBlur={onFieldBlur}
                onKeyDown={(e) => onEnterNext(e, "durationSec")}
                enterKeyHint={useRIR || useRPE || useSetNotes ? "next" : "done"}
                disabled={isDraft ? false : disabled}
                placeholder={durationPh}
                invalid={needsDurationHighlight}
              />
            ) : (
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
                  type="number"
                  value={draft.reps}
                  onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
                  onBlur={onFieldBlur}
                  onWheel={(e) => e.currentTarget.blur()}
                  onKeyDown={(e) => onEnterNext(e, "reps")}
                  enterKeyHint={useRIR || useRPE || useSetNotes ? "next" : "done"}
                  inputMode="decimal"
                  min="0"
                  step="1"
                  disabled={isDraft ? false : disabled}
                  placeholder={repsPh}
                  aria-invalid={needsRepsHighlight ? true : undefined}
                />
              </label>
            )}
          </div>

          {useRIR || useRPE ? (
            <div className="session-set-optional-row grid-set-row" style={{ "--set-cols": optionalColCount }}>
              {useRIR ? (
                <label
                  className={[
                    "session-set-field session-set-field--secondary",
                    needsRirHighlight ? "session-set-field--needs-value" : "",
                    overCap && plan?.effort === "rir" ? "session-set-field--over-cap" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="session-set-field-label session-set-field-label-line">
                    <span>RIR</span> <MetricInfoButton metric="rir" />
                  </span>
                  <span className="muted small" style={{ fontWeight: 500, lineHeight: 1.2, marginTop: -1 }}>
                    Reps in Reserve
                  </span>
                  <input
                    id={fieldIds.rir}
                    value={draft.rir}
                    onChange={onRirChange}
                    onBlur={onFieldBlur}
                    onKeyDown={(e) => onEnterNext(e, "rir")}
                    enterKeyHint={useRPE || useSetNotes ? "next" : "done"}
                    inputMode="numeric"
                    disabled={isDraft ? false : disabled}
                    placeholder={rirPh}
                    title="Optional"
                    aria-invalid={needsRirHighlight ? true : undefined}
                  />
                  {rirGateHint ? (
                    <span className="muted small" style={{ display: "block", marginTop: 4 }}>
                      {rirGateHint}
                    </span>
                  ) : null}
                  {overCap && plan?.effort === "rir" ? <EffortCapWarn show /> : null}
                </label>
              ) : null}
              {useRPE ? (
                <label
                  className={[
                    "session-set-field session-set-field--secondary",
                    needsRpeHighlight ? "session-set-field--needs-value" : "",
                    overCap && plan?.effort === "rpe" ? "session-set-field--over-cap" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="session-set-field-label session-set-field-label-line">
                    <span>RPE</span> <MetricInfoButton metric="rpe" />
                  </span>
                  <span className="muted small" style={{ fontWeight: 500, lineHeight: 1.2, marginTop: -1 }}>
                    Rating of Perceived Exertion
                  </span>
                  <input
                    id={fieldIds.rpe}
                    value={draft.rpe}
                    onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
                    onBlur={onFieldBlur}
                    onKeyDown={(e) => onEnterNext(e, "rpe")}
                    enterKeyHint={useSetNotes ? "next" : "done"}
                    inputMode="decimal"
                    disabled={isDraft ? false : disabled}
                    placeholder={rpePh}
                    title="Optional"
                    aria-invalid={needsRpeHighlight ? true : undefined}
                  />
                  {overCap && plan?.effort === "rpe" ? <EffortCapWarn show /> : null}
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
              onBlur={onFieldBlur}
              enterKeyHint="done"
              disabled={isDraft ? false : disabled}
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
  onPromoteDraftSet = () => Promise.resolve(),
  onUpdateSet,
  onDeleteSet,
  onDeleteExercise,
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
  /** null = blank/unknown; resolved | unresolved from catalog lookup. */
  trackedStatus = null,
  onOpenAddToLibrary,
  /** Callback: (exerciseName, weight, reps) => boolean. Passed from parent for completed views. */
  setHasPR = () => false,
  /** Soft-cue missing effort fields on core-logged sets when finish is blocked. */
  highlightMissingEffort = false,
  /** Discard in flight / succeeded: freeze field writes without flipping completed chrome. */
  writesFrozen = false,
  writesFrozenRef,
  /** BK9: weight unit for plan rx line (lb/kg). Absent on non-block paths. */
  weightUnit = undefined,
}) {
  const [draftResumeVersion, setDraftResumeVersion] = useState(0);
  const [draftTrackedStatus, setDraftTrackedStatus] = useState(null);
  const [perSideOverride, setPerSideOverride] = useState(null);
  const prevSetsLenRef = useRef(null);
  const autoCreateBusyRef = useRef(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setPerSideOverride(null);
    setDraftTrackedStatus(null);
    autoCreateBusyRef.current = false;
  }, [se.id]);

  useEffect(() => {
    const prev = prevSetsLenRef.current;
    if (prevSetsLenRef.current === null) {
      prevSetsLenRef.current = sets.length;
      return;
    }
    prevSetsLenRef.current = sets.length;
    if (!isCompleted && sets.length === 0 && prev > 0) {
      setDraftResumeVersion((v) => v + 1);
    }
  }, [sets.length, isCompleted]);

  useEffect(() => {
    if (!confirmRemove) return;
    const t = setTimeout(() => setConfirmRemove(false), 5000);
    return () => clearTimeout(t);
  }, [confirmRemove]);

  const rawName = se.exerciseName ?? "";
  const perSideMode = derivePerSideMode(perSideOverride, rawName, sets);
  // Guard: plan chrome only when SessionExercise.plan is present (block sessions).
  const plan = se.plan != null && typeof se.plan === "object" ? se.plan : null;
  const timedExercise = plan != null && isTimedPlanExercise(plan);

  /** Live path only: one L/R pair via createSetPairForExercise when mode is on and sets are empty. */
  const maybeAutoCreateFirstPair = useCallback(() => {
    if (isCompleted || writesFrozen) return;
    if (sets.length > 0) return;
    if (autoCreateBusyRef.current || setCountBusy) return;
    autoCreateBusyRef.current = true;
    Promise.resolve(onCreateSet(se.id, { perSide: true })).finally(() => {
      autoCreateBusyRef.current = false;
    });
  }, [isCompleted, writesFrozen, sets.length, setCountBusy, onCreateSet, se.id]);

  const handleExerciseCommitted = useCallback(
    (row) => {
      onExerciseCommitted?.(row);
      // Qualifying event (a): committed name change leaves derived mode true with zero sets.
      // Draft keystrokes never reach here — only commitExercise / commitName.
      if (sets.length > 0) return;
      const nextMode = derivePerSideMode(perSideOverride, row?.exerciseName ?? "", sets);
      if (!nextMode) return;
      maybeAutoCreateFirstPair();
    },
    [onExerciseCommitted, sets, perSideOverride, maybeAutoCreateFirstPair]
  );

  const exerciseCommitted = isCompleted ? undefined : handleExerciseCommitted;
  const sortedSets = useMemo(
    () => [...sets].sort((a, b) => a.order - b.order),
    [sets]
  );
  const renderUnits = useMemo(
    () => groupSetsIntoRenderUnits(sortedSets, perSideMode),
    [sortedSets, perSideMode]
  );
  const pairCount = perSideMode ? Math.max(1, Math.ceil(sortedSets.length / 2)) : Math.max(1, sets.length);

  const onAutofillPartnerWeight = useCallback(
    (partnerSetId, weight, partnerSet) => {
      if (!partnerSet || sessionSetHasCoreLogged(partnerSet)) return;
      const wBlank =
        partnerSet.weight == null || String(partnerSet.weight).trim() === "";
      if (!wBlank) return;
      const num = Number(String(weight).trim());
      if (!Number.isFinite(num)) return;
      onUpdateSet(partnerSetId, { weight: num });
    },
    [onUpdateSet]
  );

  const handleDeleteSet = useCallback(
    (setId, unit) => {
      if (writesFrozen) return;
      if (!onDeleteSet) return;
      if (perSideMode && unit?.type === "pair" && unit.sets.length === 2) {
        const filled = unit.sets.some((s) => !sessionSetRowIsBlank(s));
        if (filled) {
          const ok = window.confirm(
            "Remove this left/right pair? Both sides will be deleted, including any entered weight, reps, or notes."
          );
          if (!ok) return;
        }
        const ids = [...unit.sets].reverse().map((s) => s.id);
        for (const id of ids) {
          void onDeleteSet(id, { skipConfirm: true });
        }
        return;
      }
      void onDeleteSet(setId);
    },
    [onDeleteSet, perSideMode, writesFrozen]
  );

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

  const displayTrackedStatus = draftTrackedStatus ?? trackedStatus;
  // The pill's visual reflects the draft (live typing feedback), but its
  // click-to-add affordance keys off the COMMITTED name - that is the name
  // onOpenAddToLibrary opens the sheet with, so a mid-edit draft must not make
  // it interactive with a stale name.
  const trackedPillInteractive =
    trackedStatus === "unresolved" && displayTrackedStatus === "unresolved";

  const headingNameAndSets = (
    <span className="session-exercise-heading-text">
      <strong className="session-exercise-heading">{namePart}</strong>
      <span className="session-exercise-heading-meta muted">
        {" "}
        · {setCountLabel}
      </span>
    </span>
  );

  const trackedIndicator = (
    <ExerciseTrackedIndicator
      status={displayTrackedStatus}
      interactive={trackedPillInteractive}
      onOpenAddToLibrary={trackedPillInteractive ? onOpenAddToLibrary : undefined}
    />
  );

  const headingSummary = summaryLine ? (
    <span className="session-exercise-heading-summary muted small"> · {summaryLine}</span>
  ) : null;

  const isLiveCollapsible = collapsible && !isCompleted;

  const removeControl =
    !isCompleted && onDeleteExercise ? (
      confirmRemove ? (
        <div className="row" style={{ gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
          <span className="muted small" style={{ fontWeight: 600 }}>
            Remove {namePart}?
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setConfirmRemove(false);
              void onDeleteExercise(se.id);
            }}
            style={{ padding: "6px 10px" }}
          >
            Yes, remove
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setConfirmRemove(false)}
            style={{ padding: "6px 10px" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setConfirmRemove(true)}
          style={{ padding: "6px 10px" }}
        >
          Remove exercise
        </button>
      )
    ) : null;

  return (
    <div className={blockClass}>
      <div
        className={
          isLiveCollapsible
            ? "session-exercise-heading-sticky"
            : "session-exercise-heading-sticky session-exercise-heading-sticky--static"
        }
      >
        <div
          className={
            isLiveCollapsible
              ? "row session-exercise-heading-row"
              : "row session-exercise-heading-row session-exercise-heading-toggle-static"
          }
          style={{ justifyContent: "space-between" }}
        >
          <div className="session-exercise-heading-lead">
            {isLiveCollapsible ? (
              <button
                type="button"
                className="session-exercise-heading-toggle"
                onClick={() => onToggleCollapsed?.()}
                aria-expanded={expanded}
              >
                <span className="session-exercise-heading-chevron" aria-hidden="true">
                  {isCollapsed ? "▸" : "▾"}
                </span>
                {headingNameAndSets}
              </button>
            ) : (
              headingNameAndSets
            )}
            {trackedIndicator}
            {headingSummary}
          </div>
          {removeControl}
        </div>
      </div>

      {expanded ? (
        <>
          <SessionExerciseFields
            sessionExercise={se}
            sessionId={sessionId}
            disabled={isCompleted || writesFrozen}
            useExerciseNotes={useExerciseNotes}
            stackExerciseNotes={Boolean(isQuickLog && useExerciseNotes)}
            onExerciseCommitted={exerciseCommitted}
            onSaved={onSaved}
            onInteractStart={!isCompleted && !writesFrozen ? onActivateExercise : undefined}
            onDraftTrackedStatusChange={!isCompleted && !writesFrozen ? setDraftTrackedStatus : undefined}
            writesFrozenRef={writesFrozenRef}
          />

          {plan != null ? (
            <div className="bk">
              <PlanLine plan={plan} notes={se.notes} unit={weightUnit} />
            </div>
          ) : null}

          {showPlannedTargets && plan == null ? (
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
                <>
                  <PlanningSetCountControl
                    {...(perSideMode ? { label: "Pairs" } : {})}
                    value={pairCount}
                    disabled={setCountBusy || writesFrozen}
                    onChange={(n) =>
                      onAdjustSetCount(se.id, n, perSideMode ? { perSide: true } : undefined)
                    }
                  />
                  <button
                    type="button"
                    className={`session-side-mode-chip ${perSideMode ? "session-side-mode-chip--on" : ""}`}
                    title="Log left/right sides separately"
                    aria-pressed={perSideMode}
                    onClick={() => {
                      if (perSideMode) {
                        setPerSideOverride(false);
                        return;
                      }
                      // Qualifying event (b): manual L/R override toggled ON.
                      setPerSideOverride(true);
                      if (!isCompleted && sets.length === 0) {
                        maybeAutoCreateFirstPair();
                      }
                    }}
                  >
                    L/R
                  </button>
                </>
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
                    onCreateSet(se.id, perSideMode ? { perSide: true } : undefined);
                  }}
                  disabled={setCountBusy || writesFrozen}
                >
                  + Add set
                </button>
              ) : null}
            </div>

            <>
              <div className="stack session-set-rows">
                {sets.length === 0 ? (
                  isCompleted ? (
                    <div className="muted small session-empty-sets">No sets logged.</div>
                  ) : perSideMode ? (
                    <div className="muted small session-empty-sets">
                      Tap "+ Add set" above to log your first left/right pair.
                    </div>
                  ) : (
                    <SessionSetRow
                      key={`session-set-slot-${se.id}`}
                      isDraft
                      resumeVersion={draftResumeVersion}
                      sessionExerciseId={se.id}
                      useRIR={useRIR}
                      useRPE={useRPE}
                      useSetNotes={useSetNotes}
                      onInteractStart={onActivateExercise}
                      onPromoteDraft={(d) => onPromoteDraftSet(se.id, d)}
                      onUpdateSet={onUpdateSet}
                      writesFrozenRef={writesFrozenRef}
                      disabled={writesFrozen}
                      {...(plan != null
                        ? {
                            plan,
                            planSet: planSetAt(plan, 0),
                            timedMode: isTimedPlanSet(plan, 0) || timedExercise,
                          }
                        : {})}
                    />
                  )
                ) : (
                  renderUnits.map((unit, idx) => {
                    const planIndex =
                      (unit.type === "pair" ? unit.pairOrdinal : unit.setOrdinal) != null
                        ? (unit.type === "pair" ? unit.pairOrdinal : unit.setOrdinal) - 1
                        : idx;
                    const rowPlanSet = plan != null ? planSetAt(plan, planIndex) : undefined;
                    const rowTimed =
                      plan != null && (isTimedPlanSet(plan, planIndex) || timedExercise);
                    if (unit.type === "pair") {
                      const leftSet = unit.sets.find((s) => s.side === "L") ?? unit.sets[0];
                      const rightSet = unit.sets.find((s) => s.side === "R") ?? unit.sets[1];
                      return (
                        <div key={`pair-${leftSet.id}-${rightSet.id}`} className="session-set-pair stack">
                          {[leftSet, rightSet].map((s) => (
                            <SessionSetRow
                              key={s.id}
                              set={s}
                              setLabelOverride={perSideSetLabel(s, unit.pairOrdinal, unit.setOrdinal)}
                              sideBadgeLetter={s.side === "L" || s.side === "R" ? s.side : null}
                              partnerSet={s.side === "L" ? rightSet : null}
                              onAutofillPartnerWeight={onAutofillPartnerWeight}
                              lockSetOrder
                              disabled={isCompleted || writesFrozen}
                              useRIR={useRIR}
                              useRPE={useRPE}
                              useSetNotes={useSetNotes}
                              isNext={
                                !isCompleted &&
                                nextIncompleteSetId != null &&
                                s.id === nextIncompleteSetId
                              }
                              onInteractStart={!isCompleted && !writesFrozen ? onActivateExercise : undefined}
                              onUpdateSet={onUpdateSet}
                              onDeleteSet={() => handleDeleteSet(s.id, unit)}
                              hasPR={isCompleted && setHasPR(se, s.weight, s.reps)}
                              highlightMissingEffort={highlightMissingEffort}
                              writesFrozenRef={writesFrozenRef}
                              {...(plan != null
                                ? { plan, planSet: rowPlanSet, timedMode: rowTimed }
                                : {})}
                            />
                          ))}
                        </div>
                      );
                    }
                    const s = unit.sets[0];
                    return (
                      <SessionSetRow
                        key={idx === 0 && !perSideMode ? `session-set-slot-${se.id}` : s.id}
                        set={s}
                        setOrdinal={unit.setOrdinal}
                        setLabelOverride={
                          perSideMode ? perSideSetLabel(s, unit.pairOrdinal, unit.setOrdinal) : undefined
                        }
                        sideBadgeLetter={perSideMode && (s.side === "L" || s.side === "R") ? s.side : null}
                        lockSetOrder
                        disabled={isCompleted || writesFrozen}
                        useRIR={useRIR}
                        useRPE={useRPE}
                        useSetNotes={useSetNotes}
                        isNext={
                          !isCompleted &&
                          nextIncompleteSetId != null &&
                          s.id === nextIncompleteSetId
                        }
                        onInteractStart={!isCompleted && !writesFrozen ? onActivateExercise : undefined}
                        onUpdateSet={onUpdateSet}
                        onDeleteSet={() => handleDeleteSet(s.id, unit)}
                        hasPR={isCompleted && setHasPR(se, s.weight, s.reps)}
                        highlightMissingEffort={highlightMissingEffort}
                        writesFrozenRef={writesFrozenRef}
                        {...(plan != null
                          ? { plan, planSet: rowPlanSet, timedMode: rowTimed }
                          : {})}
                      />
                    );
                  })
                )}
              </div>
              {!isCompleted && sets.length > 0 ? (
                <div className="stack session-add-set-footer">
                  <button
                    type="button"
                    className="btn btn-secondary session-add-set-footer-btn"
                    onClick={() => {
                      onActivateExercise?.();
                      onCreateSet(se.id, perSideMode ? { perSide: true } : undefined);
                    }}
                    disabled={setCountBusy || writesFrozen}
                  >
                    + Add set
                  </button>
                </div>
              ) : null}
            </>
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
  const [weightUnit, setWeightUnit] = useState(() => loadWeightUnit());
  const [quickTitleDraft, setQuickTitleDraft] = useState("");
  const [scrollToExerciseId, setScrollToExerciseId] = useState(null);
  const [adjustingSetCountExerciseId, setAdjustingSetCountExerciseId] = useState(null);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [discardBusy, setDiscardBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [discardMessage, setDiscardMessage] = useState(null);
  const [resolutionTick, setResolutionTick] = useState(0);
  const [addToLibrarySheet, setAddToLibrarySheet] = useState(null);
  const [sessionPRs, setSessionPRs] = useState([]);
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
  const writesFrozenRef = useRef(false);
  const discardLeavingRef = useRef(false);
  const discardBtnRef = useRef(null);
  const keepLoggingBtnRef = useRef(null);
  const finishAnywayBtnRef = useRef(null);
  const sessionNoteRef = useRef(null);
  /** bks2: per-exercise slot stats for the block session progress bar. */
  const [blockSlotStats, setBlockSlotStats] = useState(() => new Map());

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

  const bumpResolutions = useCallback(() => {
    setResolutionTick((t) => t + 1);
  }, []);

  const openAddToLibrarySheet = useCallback((exerciseName, sessionExerciseId) => {
    const trimmed = String(exerciseName ?? "").trim();
    if (!trimmed || isBlankSessionExerciseName(trimmed)) return;
    setAddToLibrarySheet({
      exerciseName: trimmed,
      sessionExerciseId: sessionExerciseId ?? null,
    });
  }, []);

  const closeAddToLibrarySheet = useCallback(() => {
    setAddToLibrarySheet(null);
  }, []);

  const mergeSessionExerciseRow = useCallback(
    (row) => {
      if (!row?.id) return;
      setSession((prev) => {
        if (!prev?.sessionExercises) return prev;
        const list = prev.sessionExercises.map((e) => (e.id === row.id ? { ...e, ...row } : e));
        return { ...prev, sessionExercises: list };
      });
      if (row.exerciseName != null && !isBlankSessionExerciseName(row.exerciseName)) {
        void refreshExerciseResolution(row.exerciseName, bumpResolutions);
      }
    },
    [bumpResolutions]
  );

  const handleAddToLibraryLink = useCallback(
    async ({ sessionExerciseId, name, exerciseId, userExerciseId }) => {
      const oldName = addToLibrarySheet?.exerciseName;
      const storedName = inputToSessionExerciseName(name);
      const patch = buildSessionExerciseNamePatch(storedName, { exerciseId, userExerciseId });
      const data = await sessionApi.updateSessionExercise(sessionId, sessionExerciseId, patch);
      const row = data?.sessionExercise;
      if (row) mergeSessionExerciseRow(row);
      if (oldName) invalidateExerciseResolution(oldName);
      invalidateExerciseResolution(storedName);
      void refreshExerciseResolution(storedName, bumpResolutions);
      if (oldName && oldName !== storedName) {
        void refreshExerciseResolution(oldName, bumpResolutions);
      }
    },
    [addToLibrarySheet?.exerciseName, sessionId, mergeSessionExerciseRow, bumpResolutions]
  );

  const handleAddToLibraryCreateCommitted = useCallback(
    async ({ name, userExerciseId }) => {
      const sessionExerciseId = addToLibrarySheet?.sessionExerciseId;
      const oldName = addToLibrarySheet?.exerciseName;
      const storedName = inputToSessionExerciseName(name);
      if (sessionExerciseId && userExerciseId) {
        // The stamp PATCH must carry exerciseName: the server only applies the
        // identity fields alongside a name change and rejects an empty patch.
        // Keep it best-effort so name-based resolution below still runs if it fails.
        try {
          const data = await sessionApi.updateSessionExercise(sessionId, sessionExerciseId, {
            exerciseName: storedName,
            userExerciseId,
          });
          const row = data?.sessionExercise;
          if (row) mergeSessionExerciseRow(row);
        } catch {
          // Library entry exists; name-based resolution below still flips the pill.
        }
      }
      invalidateExerciseResolution(name);
      if (oldName && oldName !== name) invalidateExerciseResolution(oldName);
      void refreshExerciseResolution(name, bumpResolutions);
      if (oldName && oldName !== name) {
        void refreshExerciseResolution(oldName, bumpResolutions);
      }
    },
    [addToLibrarySheet, sessionId, mergeSessionExerciseRow, bumpResolutions]
  );

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
    const names = (session?.sessionExercises || [])
      .map((se) => se.exerciseName)
      .filter((n) => !isBlankSessionExerciseName(n));
    if (names.length === 0) return;
    void cacheExerciseResolutions(names, bumpResolutions);
  }, [session?.sessionExercises, bumpResolutions]);

  useEffect(() => {
    if (!session || !session.completedAt || !session.performedAt) {
      setSessionPRs([]);
      return;
    }
    let cancelled = false;
    async function fetchPRs() {
      try {
        const sessionDate = session.performedAt.slice(0, 10);
        const from = `${sessionDate}T00:00:00.000Z`;
        const to = `${sessionDate}T23:59:59.999Z`;
        const summary = await analyticsApi.getSummary({ from, to });
        if (!cancelled && Array.isArray(summary?.prs)) {
          setSessionPRs(summary.prs);
        }
      } catch {
        if (!cancelled) setSessionPRs([]);
      }
    }
    fetchPRs();
    return () => {
      cancelled = true;
    };
  }, [session?.id, session?.completedAt, session?.performedAt]);

  const setHasPR = useMemo(() => {
    if (sessionPRs.length === 0) return () => false;
    // sessionPRs is already scoped to this session's calendar day by the
    // fetch's from/to window - no additional per-set date match needed
    // (a session-level timestamp cannot equal an individual PR set's
    // timestamp except by coincidence).
    const prSet = new Set();
    for (const pr of sessionPRs) {
      const key = prMatchKey(pr.identity?.exerciseId, pr.identity?.userExerciseId, pr.exerciseName);
      if (key != null) prSet.add(`${key}:${pr.weight}:${pr.reps}`);
    }
    return (se, weight, reps) => {
      if (weight == null || reps == null) return false;
      const key = prMatchKey(se?.exerciseId, se?.userExerciseId, se?.exerciseName);
      if (key == null) return false;
      return prSet.has(`${key}:${weight}:${reps}`);
    };
  }, [sessionPRs]);

  const trackedStatusByExerciseId = useMemo(() => {
    const map = new Map();
    for (const se of orderedSessionExercises) {
      map.set(se.id, lookupExerciseTrackedStatus(se.exerciseName));
    }
    return map;
  }, [orderedSessionExercises, resolutionTick]);

  useEffect(() => {
    activeExerciseInitRef.current = false;
    setActiveExerciseId(null);
    setCollapsedExerciseIds(new Set());
    prevFocusedNextSetRef.current = null;
    setBlockSlotStats(new Map());
  }, [sessionId]);

  useEffect(() => {
    if (discardLeavingRef.current || !session || session.completedAt) {
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
      if (discardLeavingRef.current) return;
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

  // Keyed on a stable boolean, NOT the session object: every set autosave
  // replaces `session`, and re-running these effects dropped keypad mode
  // mid-typing (critic R3 P1-1).
  const liveBlockDay = Boolean(session && !session.completedAt && session.blockContext);

  // Live block-day focus mode: hide bottom nav + persistent Resume bar so
  // Finish never sits on a nav target (and the bar is not on its own session).
  useEffect(() => {
    if (!liveBlockDay) {
      document.documentElement.classList.remove("bk-log-focus");
      return;
    }
    document.documentElement.classList.add("bk-log-focus");
    return () => {
      document.documentElement.classList.remove("bk-log-focus");
    };
  }, [liveBlockDay]);

  useEffect(() => {
    if (!liveBlockDay) {
      document.documentElement.classList.remove("bk-log-kbd");
      return;
    }
    // Ignore iOS URL-bar collapse; real soft keyboards shrink far more.
    const BK_LOG_KBD_VIEWPORT_SHRINK_PX = 150;

    function isLoggerField(el) {
      return (
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        Boolean(document.querySelector(".session-detail-page--block")?.contains(el))
      );
    }

    function syncKbdClass() {
      const focused = isLoggerField(document.activeElement);
      const vv = window.visualViewport;
      // Fallback when visualViewport is missing: keep focus-only behaviour.
      const keyboardOpen = vv
        ? window.innerHeight - vv.height > BK_LOG_KBD_VIEWPORT_SHRINK_PX
        : focused;
      document.documentElement.classList.toggle("bk-log-kbd", focused && keyboardOpen);
    }

    function onFocusIn(e) {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") return;
      syncKbdClass();
    }
    function onFocusOut() {
      // Defer so focus moving between fields does not flicker the chrome.
      requestAnimationFrame(() => {
        syncKbdClass();
      });
    }
    function onViewportChange() {
      syncKbdClass();
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", onViewportChange, { passive: true });
    window.visualViewport?.addEventListener("scroll", onViewportChange, { passive: true });
    // A field may already be focused when this (re)runs.
    syncKbdClass();
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
      document.documentElement.classList.remove("bk-log-kbd");
    };
  }, [liveBlockDay]);

  useEffect(() => {
    if (!confirmFinish || completeBusy) return;
    const t = setTimeout(() => setConfirmFinish(false), 10000);
    return () => clearTimeout(t);
  }, [confirmFinish, completeBusy]);

  useEffect(() => {
    if (!confirmFinish || completeBusy) return;
    finishAnywayBtnRef.current?.focus();
  }, [confirmFinish, completeBusy]);

  useEffect(() => {
    if (!confirmLeave) return;
    const t = setTimeout(() => setConfirmLeave(false), 10000);
    return () => clearTimeout(t);
  }, [confirmLeave]);

  const onBlockSlotStatsChange = useCallback((exerciseId, stats) => {
    setBlockSlotStats((prev) => {
      const next = new Map(prev);
      next.set(exerciseId, stats);
      return next;
    });
  }, []);

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
    if (!session || session.workoutTemplate || session.blockContext) return;
    const fromServer = session.name != null ? String(session.name).trim() : "";
    setQuickTitleDraft(fromServer || getAdHocSessionTitle(session.id) || "");
  }, [session, session?.id, session?.name, session?.workoutTemplate, session?.blockContext]);

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
      const tplRIR = Boolean(session.workoutTemplate.useRIR);
      const tplRPE = Boolean(session.workoutTemplate.useRPE);
      // RESOLUTION: RIR wins when both true; both-false stays off (no auto-select).
      // A currency already on this session's sets outranks the template's
      // current value - editing the template mid-session must not re-seed a
      // locked session onto a signal it has no values for.
      const tplSignal = tplRIR ? "rir" : tplRPE ? "rpe" : null;
      const seeded = sessionLoggedEffortSignal(setsList) ?? tplSignal;
      setLiveUseRIR(seeded === "rir");
      setLiveUseRPE(seeded === "rpe");
      return;
    }

    // BK9: block sessions seed from blockContext with the SAME resolution rules.
    if (session.blockContext) {
      setLiveUseSessionNotes(Boolean(String(session.notes ?? "").trim()));
      // PlanLine shows coach notes without a tap - do not also open the editable field.
      setLiveUseExerciseNotes(false);
      const setsList = session.sets || [];
      setLiveUseSetNotes(setsList.some((s) => String(s.notes ?? "").trim() !== ""));
      const ctxRIR = Boolean(session.blockContext.useRIR);
      const ctxRPE = Boolean(session.blockContext.useRPE);
      const ctxSignal = ctxRIR ? "rir" : ctxRPE ? "rpe" : null;
      const seeded = sessionLoggedEffortSignal(setsList) ?? ctxSignal;
      setLiveUseRIR(seeded === "rir");
      setLiveUseRPE(seeded === "rpe");
      return;
    }

    const p = loadQuickWorkoutLogPrefs();
    setLiveUseSessionNotes(false);
    saveQuickWorkoutLogPrefs({ useSessionNotes: false });
    setLiveUseExerciseNotes(
      typeof p.useExerciseNotes === "boolean" ? p.useExerciseNotes : true
    );
    // Same rule as the template branch: what is already logged outranks the
    // device pref, which any template screen can rewrite mid-workout.
    const effortSignal = sessionLoggedEffortSignal(session.sets) ?? loadEffortSignal();
    setLiveUseRIR(effortSignal === "rir");
    setLiveUseRPE(effortSignal === "rpe");
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

  // Same auto-dismiss idiom as the Remove-exercise confirm, but with a
  // longer window - the reopen copy is three sentences, not three words.
  useEffect(() => {
    if (!confirmReopen || reopenBusy) return;
    const t = setTimeout(() => setConfirmReopen(false), 10000);
    return () => clearTimeout(t);
  }, [confirmReopen, reopenBusy]);

  useEffect(() => {
    if (!confirmDiscard || discardBusy) return;
    const t = setTimeout(() => setConfirmDiscard(false), 10000);
    return () => clearTimeout(t);
  }, [confirmDiscard, discardBusy]);

  useEffect(() => {
    if (!confirmDiscard || discardBusy) return;
    keepLoggingBtnRef.current?.focus();
  }, [confirmDiscard, discardBusy]);

  useEffect(() => {
    if (!confirmDiscard) return;
    function onKeyDown(e) {
      if (e.key !== "Escape") return;
      if (discardBusy) return;
      e.preventDefault();
      setConfirmDiscard(false);
      discardBtnRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDiscard, discardBusy]);

  const pendingSetSavesRef = useRef(new Set());
  const setPatchChainsRef = useRef(new Map());

  const trackSetSave = useCallback((promise) => {
    const pending = pendingSetSavesRef.current;
    pending.add(promise);
    const drop = () => pending.delete(promise);
    promise.then(drop, drop);
    return promise;
  }, []);

  async function onComplete() {
    if (completeBusy) return;
    setError(null);
    setCompleteBusy(true);
    setConfirmFinish(false);
    try {
      // Commit the field being typed in (blur fires its save synchronously),
      // then drain every in-flight set write - completing must not race or
      // silently drop the last keystrokes. Loop because a draft promotion can
      // enqueue a follow-up patch while we wait.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      while (pendingSetSavesRef.current.size > 0) {
        await Promise.allSettled(Array.from(pendingSetSavesRef.current));
      }
      const payload = (() => {
        // Template and block sessions already have a server name - do not rename on complete.
        if (!session || session.workoutTemplate || session.blockContext) return {};
        const trimmed = quickTitleDraft.trim();
        if (trimmed) return { name: trimmed };
        return {
          name: smartWorkoutNameFromSessionExercises(
            orderedSessionExercises,
            session?.startedAt || session?.performedAt || session?.completedAt
          ),
        };
      })();
      await sessionApi.completeSession(sessionId, payload);
      if (session && !session.workoutTemplate && !session.blockContext) {
        setAdHocSessionTitle(sessionId, "");
      }
      navigate("/", { replace: true, state: { workoutSaved: true } });
    } catch (err) {
      setError(err);
    } finally {
      setCompleteBusy(false);
    }
  }

  async function onReopen() {
    if (reopenBusy) return;
    setError(null);
    setReopenBusy(true);
    try {
      await sessionApi.reopenSession(sessionId);
      setConfirmReopen(false);
      // Refresh in place - the live builder UX and finish dock take over.
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setReopenBusy(false);
    }
  }

  function cancelDiscardConfirm() {
    if (discardBusy) return;
    setConfirmDiscard(false);
    discardBtnRef.current?.focus();
  }

  function requestDiscard() {
    if (discardBusy || writesFrozenRef.current) return;
    if (!session || session.completedAt || session.reopenedAt != null) return;
    setDiscardMessage(null);
    const savedSets = Array.isArray(session.sets) ? session.sets.length : 0;
    if (savedSets === 0) {
      void onDiscard();
      return;
    }
    setConfirmDiscard(true);
  }

  async function onDiscard() {
    if (discardBusy) return;
    setDiscardMessage(null);
    setError(null);
    writesFrozenRef.current = true;
    setDiscardBusy(true);
    setLiveLoggingGuard(false);
    try {
      await sessionApi.discardSession(sessionId);
      discardLeavingRef.current = true;
      setConfirmDiscard(false);
      navigate("/", { replace: true, state: { workoutDiscarded: true } });
    } catch (err) {
      writesFrozenRef.current = false;
      setDiscardBusy(false);
      if (err?.status === 409) {
        setConfirmDiscard(false);
        setDiscardMessage("This workout was already finished.");
        try {
          const data = await sessionApi.getSessionById(sessionId);
          setSession(data.session);
        } catch (loadErr) {
          setError(loadErr);
        }
        return;
      }
      if (session && !session.completedAt) {
        setLiveLoggingGuard(true);
      }
      setDiscardMessage("Couldn't discard. Check your connection and try again.");
    }
  }

  const onCreateSetForExercise = useCallback(
    async (sessionExerciseId, options) => {
      if (writesFrozenRef.current) return;
      const perSide = options?.perSide === true;
      setError(null);
      try {
        if (perSide) {
          await createSetPairForExercise(sessionId, sessionExerciseId, async () => {
            const latestRes = await sessionApi.getSessionById(sessionId);
            const latest = latestRes?.session;
            if (latest) setSession(latest);
            return latest ?? null;
          });
          const end = await sessionApi.getSessionById(sessionId);
          if (end?.session) setSession(end.session);
          return;
        }

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
        const body = buildCreateSetBodyFromLast(last, sessionExerciseId, order, null);
        const data = await sessionApi.createSet(sessionId, body);
        if (writesFrozenRef.current) return;
        if (data?.set) {
          appendSetRow(data.set);
        } else {
          await load();
        }
      } catch (err) {
        if (writesFrozenRef.current) return;
        setError(err);
        await load();
      }
    },
    [sessionId, appendSetRow, load]
  );

  const promoteDraftSet = useCallback(
    async (sessionExerciseId, draft) => {
      if (writesFrozenRef.current) return null;
      setError(null);
      try {
        const sess = sessionRef.current;
        if (!sess) {
          await load();
          return;
        }
        const order = nextSetOrder(sess);
        const body = { sessionExerciseId, order, ...promotionPayloadFromDraft(draft) };
        // Block-day per-side grids pass side on the draft; keep the existing
        // create path (sessionController validateOptionalSide) intact.
        if (draft?.side === "L" || draft?.side === "R") {
          body.side = draft.side;
        }

        const data = await sessionApi.createSet(sessionId, body);
        if (writesFrozenRef.current) return null;
        if (data?.set) {
          appendSetRow(data.set);
          return data.set;
        }
        await load();
        return null;
      } catch (err) {
        if (writesFrozenRef.current) return null;
        setError(err);
        await load();
        throw err;
      }
    },
    [sessionId, appendSetRow, load]
  );

  const promoteDraftSetTracked = useCallback(
    (sessionExerciseId, draft) => trackSetSave(promoteDraftSet(sessionExerciseId, draft)),
    [promoteDraftSet, trackSetSave]
  );

  async function onAdjustSetCountForExercise(sessionExerciseId, targetCount, options) {
    if (writesFrozenRef.current) return;
    if (!Number.isInteger(targetCount) || targetCount < 1) return;
    const perSide = options?.perSide === true;
    setError(null);
    setAdjustingSetCountExerciseId(sessionExerciseId);
    try {
      const initial = await sessionApi.getSessionById(sessionId);
      const sess = initial?.session;
      if (!sess) return;

      const sorted = (Array.isArray(sess.sets) ? sess.sets : [])
        .filter((s) => s.sessionExerciseId === sessionExerciseId)
        .sort((a, b) => a.order - b.order);

      if (perSide) {
        const cur = Math.max(1, Math.ceil(sorted.length / 2));
        if (targetCount === cur) {
          setSession(sess);
          return;
        }

        if (targetCount > cur) {
          const toAdd = targetCount - cur;
          for (let k = 0; k < toAdd; k += 1) {
            await createSetPairForExercise(sessionId, sessionExerciseId, async () => {
              const latestRes = await sessionApi.getSessionById(sessionId);
              const latest = latestRes?.session;
              if (latest) setSession(latest);
              return latest ?? null;
            });
          }
          const end = await sessionApi.getSessionById(sessionId);
          if (end?.session) setSession(end.session);
          return;
        }

        const pairsToRemove = cur - targetCount;
        const rowsToRemove = sorted.slice(sorted.length - pairsToRemove * 2);
        const anyFilled = rowsToRemove.some((s) => !sessionSetRowIsBlank(s));
        if (anyFilled) {
          const ok = window.confirm(
            `Lower the set count to ${targetCount}? This removes ${pairsToRemove} left/right pair(s) from the end, including some with entered weight, reps, or notes.`
          );
          if (!ok) {
            setSession(sess);
            return;
          }
        }
        for (let i = rowsToRemove.length - 1; i >= 0; i -= 1) {
          await sessionApi.deleteSet(rowsToRemove[i].id);
        }
        const end = await sessionApi.getSessionById(sessionId);
        if (end?.session) setSession(end.session);
        return;
      }

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
          const body = buildCreateSetBodyFromLast(last, sessionExerciseId, order, null);
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
      if (writesFrozenRef.current) return;
      setError(err);
      await load();
    } finally {
      setAdjustingSetCountExerciseId(null);
    }
  }

  const applyUpdateSet = useCallback(async (setId, patch) => {
    if (writesFrozenRef.current) return;
    setError(null);
    try {
      const data = await sessionApi.updateSet(setId, patch);
      if (writesFrozenRef.current) return;
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
            side: "side" in apiSet ? apiSet.side : nextSets[idx].side,
            durationSec:
              "durationSec" in apiSet ? apiSet.durationSec : nextSets[idx].durationSec,
          };
          return { ...prev, sets: nextSets };
        });
      } else {
        await load();
      }
    } catch (err) {
      if (writesFrozenRef.current) return;
      setError(err);
      await load();
    }
  }, [load]);

  // Rapid entry fires PATCHes for the same set in quick succession; each one
  // carries the full row, so out-of-order arrival lets an older payload win.
  // Chain per set id to guarantee server-side ordering, and track every
  // in-flight write so onComplete can drain them before completing.
  const onUpdateSet = useCallback(
    (setId, patch) => {
      if (writesFrozenRef.current) return Promise.resolve();
      const chains = setPatchChainsRef.current;
      const prev = chains.get(setId) ?? Promise.resolve();
      const next = prev.then(() => applyUpdateSet(setId, patch));
      chains.set(
        setId,
        next.then(
          () => {},
          () => {}
        )
      );
      return trackSetSave(next);
    },
    [applyUpdateSet, trackSetSave]
  );

  const onDeleteSet = useCallback(
    async (setId, { skipConfirm = false } = {}) => {
      if (writesFrozenRef.current) return;
      if (!skipConfirm && !confirm("Delete this set?")) return;
      setError(null);
      try {
        await sessionApi.deleteSet(setId);
        if (writesFrozenRef.current) return;
        removeSetRow(setId);
      } catch (err) {
        if (writesFrozenRef.current) return;
        setError(err);
        await load();
      }
    },
    [removeSetRow, load]
  );

  const onDeleteExercise = useCallback(
    async (sessionExerciseId) => {
      if (writesFrozenRef.current) return;
      setError(null);
      try {
        await sessionApi.deleteSessionExercise(sessionExerciseId);
        if (writesFrozenRef.current) return;
        await load();
      } catch (err) {
        if (writesFrozenRef.current) return;
        setError(err);
      }
    },
    [load]
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
    if (writesFrozenRef.current) return;
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
      if (!writesFrozenRef.current) setError(err);
    } finally {
      setAddingExercise(false);
    }
  }, [sessionId, appendSessionExerciseRow, load, activateExercise]);

  async function commitSessionNotes() {
    if (writesFrozenRef.current) return;
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
      if (writesFrozenRef.current) return;
      setError(err);
      setSessionNotesDraft(session.notes ?? "");
    }
  }

  if (loading) {
    return (
      <LoadingState
        tone="skeleton"
        variant="session"
        rows={3}
        label="Loading workout…"
        slowLabel="Taking longer than usual…"
      />
    );
  }

  const isFromTemplate = Boolean(session?.workoutTemplate);
  const isFromBlock = Boolean(session?.blockContext);
  const isQuickLog = !isFromTemplate && !isFromBlock;
  const useLiveBuilderUX = !isCompleted;
  const inLiveBuilder = useLiveBuilderUX && liveViewMode === "builder";
  const inLiveTable = useLiveBuilderUX && liveViewMode === "table";
  const blockContext = session?.blockContext ?? null;

  // Plain computation, not useMemo: this runs after the loading early return,
  // so a hook here changes the hook order between renders (crash).
  // Width = logged / total of CURRENT counts (0% at 0/N) - never a stub ratio.
  const blockProgress = (() => {
    if (!isFromBlock) return { logged: 0, total: 0 };
    let logged = 0;
    let total = 0;
    for (const se of orderedSessionExercises) {
      const stats = blockSlotStats.get(se.id);
      if (stats) {
        logged += stats.logged || 0;
        total += stats.total || 0;
      } else {
        const planSets = Array.isArray(se.plan?.sets) ? se.plan.sets.length : 0;
        const list = setsByExercise.get(se.id) || [];
        logged += list.filter((s) => blockSetIsLogged(s)).length;
        total += Math.max(planSets, list.length);
      }
    }
    return { logged, total };
  })();
  const blockUnloggedPlanned = Math.max(0, blockProgress.total - blockProgress.logged);

  const sourceSummary = isFromTemplate
    ? `Saved workout: ${session.workoutTemplate.name}`
    : isFromBlock
      ? `Block: ${blockContext.blockName}`
      : "Quick log (one-time)";

  const pageTitle = isCompleted ? "Workout summary" : "Log workout";

  const sessionExercises = orderedSessionExercises;
  const totalSetsLogged = Array.isArray(session?.sets) ? session.sets.length : 0;
  const liveEffortSignal = liveUseRIR ? "rir" : liveUseRPE ? "rpe" : null;
  const sessionSets = Array.isArray(session?.sets) ? session.sets : [];
  // Lock once any set carries a non-blank effort value (and a signal is active).
  const effortSignalLocked =
    !isCompleted &&
    liveEffortSignal != null &&
    sessionSets.some((s) => sessionSetHasAnyEffortValue(s));
  const coreLoggedSets = sessionSets.filter((s) => sessionSetHasCoreLogged(s));
  const setsMissingEffort =
    !isCompleted && liveEffortSignal != null
      ? coreLoggedSets.filter((s) => !sessionSetHasSignalEffort(s, liveEffortSignal)).length
      : 0;
  const effortMandateOk = liveEffortSignal == null || setsMissingEffort === 0;
  const canFinishWorkout = totalSetsLogged >= 1 && effortMandateOk;
  const highlightMissingEffort = !isCompleted && setsMissingEffort > 0;
  const readonlyWorkoutName = isFromTemplate
    ? session.workoutTemplate.name
    : isFromBlock
      ? session.name || `${blockContext.blockName} · W${blockContext.weekOrder} · ${blockContext.dayName}`
      : sessionDisplayTitle(session);

  function onLiveEffortSignalChange(next) {
    if (effortSignalLocked) return;
    setLiveUseRIR(next === "rir");
    setLiveUseRPE(next === "rpe");
    if (isQuickLog) saveEffortSignal(next);
  }

  const blockLocksEffortScale =
    isFromBlock &&
    (Boolean(blockContext?.useRIR) || Boolean(blockContext?.useRPE));
  // RIR wins when both true - same resolution as session seeding.
  const blockLockedEffortLabel = blockContext?.useRIR ? "RIR" : "RPE";

  const liveEffortToggle = blockLocksEffortScale ? (
    <span
      className="bk-log-effort-chip"
      title={`Effort scale locked to ${blockLockedEffortLabel} for this block day. Explainer: the block chose this scale; it stays fixed for the workout.`}
      aria-label={`Effort: ${blockLockedEffortLabel}. Locked by this block day; the scale stays fixed for the workout.`}
    >
      {`Effort: ${blockLockedEffortLabel}`}
    </span>
  ) : (
    <div
      className="session-effort-signal"
      style={
        effortSignalLocked
          ? { opacity: 0.72, pointerEvents: "none" }
          : undefined
      }
      aria-disabled={effortSignalLocked || undefined}
    >
      <RirRpeToggleRow
        value={liveEffortSignal}
        onChange={onLiveEffortSignalChange}
      />
      {effortSignalLocked ? (
        <p className="muted small" style={{ margin: 0, lineHeight: 1.35 }}>
          Signal locked - fixed for this workout once effort is logged on a set.
        </p>
      ) : null}
    </div>
  );

  function leaveSessionNow() {
    setConfirmLeave(false);
    if (typeof window !== "undefined" && window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  function requestFinishWorkout() {
    if (!canFinishWorkout || completeBusy || discardBusy) return;
    if (isFromBlock && blockUnloggedPlanned > 0) {
      setConfirmFinish(true);
      return;
    }
    void onComplete();
  }

  async function commitQuickTitle() {
    if (writesFrozenRef.current) return;
    if (!session || session.workoutTemplate || session.blockContext || session.completedAt) return;
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
      if (writesFrozenRef.current) return;
      setError(err);
      setQuickTitleDraft(prev || getAdHocSessionTitle(sessionId) || "");
    }
  }

  function goBackFromSession() {
    if (session && !session.completedAt) {
      if (isFromBlock) {
        // Autosave path: leave without a native confirm. Only prompt inline
        // when a write is still in flight.
        if (pendingSetSavesRef.current.size > 0 || completeBusy || discardBusy) {
          setConfirmLeave(true);
          return;
        }
        leaveSessionNow();
        return;
      }
      // Non-block live workouts also lose nothing on Back - reopen from Home.
    }
    leaveSessionNow();
  }

  return (
    <div
      className={`stack session-detail-page${!isCompleted ? " session-detail-page--live" : ""}${
        isFromBlock ? " session-detail-page--block" : ""
      }`}
    >
      {isFromBlock && !isCompleted ? (
        <div className="bk-log-block-head-actions bk">
          {session && session.reopenedAt == null ? (
            <button
              ref={discardBtnRef}
              type="button"
              className="session-discard-x"
              aria-label="Discard workout"
              disabled={discardBusy}
              aria-busy={discardBusy || undefined}
              onClick={() => requestDiscard()}
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goBackFromSession}
          >
            Back
          </button>
        </div>
      ) : (
        <div className="row session-detail-head">
          <div className="session-detail-head__text">
            {blockContext ? (
              <div className="bk bk-log-eyebrow-wrap">
                <Eyebrow>
                  {`${blockContext.blockName} · W${blockContext.weekOrder}${
                    blockContext.weekLabel ? ` · ${blockContext.weekLabel}` : ""
                  } · ${blockContext.dayName}`}
                </Eyebrow>
              </div>
            ) : null}
            <h1 style={{ marginBottom: 6 }}>{pageTitle}</h1>
            <p className="muted small" style={{ margin: 0 }}>
              {isCompleted ? (
                <>
                  Finished {formatDate(session?.completedAt)} · {sourceSummary}
                </>
              ) : (
                <>
                  Live session — updates save as you go.{" "}
                  {isFromTemplate
                    ? `Started from ${session.workoutTemplate.name}.`
                    : "One-time session."}
                </>
              )}
            </p>
          </div>
          <div className="session-detail-head__actions">
            {session && !isCompleted && session.reopenedAt == null ? (
              <button
                ref={discardBtnRef}
                type="button"
                className="session-discard-x"
                aria-label="Discard workout"
                disabled={discardBusy}
                aria-busy={discardBusy || undefined}
                onClick={() => requestDiscard()}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={goBackFromSession}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {confirmLeave ? (
        <div className="stack session-leave-confirm">
          <p className="muted small session-leave-confirm__title">
            Saves still finishing - leave anyway?
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={leaveSessionNow}
            >
              Leave anyway
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmLeave(false)}
            >
              Keep logging
            </button>
          </div>
        </div>
      ) : null}

      {confirmDiscard ? (
        <div className="stack session-discard-confirm">
          <p className="muted small session-discard-confirm__title">
            Discard this workout?
          </p>
          <p className="muted small session-discard-confirm__body">
            {(() => {
              const n = isFromBlock ? blockProgress.logged : totalSetsLogged;
              return `Your ${n} logged ${n === 1 ? "set" : "sets"} will be deleted. This can't be undone.`;
            })()}
          </p>
          <div className="row session-discard-confirm__actions">
            <button
              type="button"
              className="session-discard-confirm__discard"
              onClick={() => void onDiscard()}
              disabled={discardBusy}
              aria-busy={discardBusy || undefined}
            >
              Discard workout
            </button>
            <button
              ref={keepLoggingBtnRef}
              type="button"
              className="btn btn-secondary"
              onClick={cancelDiscardConfirm}
              disabled={discardBusy}
            >
              Keep logging
            </button>
          </div>
        </div>
      ) : null}

      {discardMessage ? (
        <p className="session-discard-message" role="status">
          {discardMessage}
        </p>
      ) : null}

      {isCompleted && isQuickLog ? (
        <p className="muted small session-summary-footnote" style={{ margin: 0 }}>
          One-time session—saved in History only, not as a reusable workout.
        </p>
      ) : null}

      <ErrorMessage error={error} />

      {!isCompleted ? (
        isFromBlock ? (
          <div className="stack bk-log-block-stack session-log-workout-form">
            <BlockSessionHeader
              weekOrder={blockContext.weekOrder}
              dayName={blockContext.dayName}
              weekLabel={blockContext.weekLabel}
              blockName={blockContext.blockName}
              loggedSets={blockProgress.logged}
              totalSets={blockProgress.total}
            />

            <div className="bk-log-effort-slot bk">{liveEffortToggle}</div>

            {sessionExercises.length === 0 ? (
              <div className="muted small session-empty-card" style={{ margin: 0 }}>
                No exercises in this block day.
              </div>
            ) : (
              <div className="stack bk-log-block-stack">
                {sessionExercises.map((se) => {
                  const sets = setsByExercise.get(se.id) || [];
                  return (
                    <div
                      key={se.id}
                      ref={(el) => setExerciseAnchorRef(se.id, el)}
                      className="bk"
                    >
                      <BlockExerciseCard
                        se={se}
                        sets={sets}
                        sessionId={sessionId}
                        isCompleted={false}
                        effortSignal={liveEffortSignal}
                        weightUnit={weightUnit}
                        onPromoteDraftSet={promoteDraftSetTracked}
                        onUpdateSet={onUpdateSet}
                        onDeleteSet={onDeleteSet}
                        onActivateExercise={() => activateExercise(se.id)}
                        onExerciseNotesSaved={mergeSessionExerciseRow}
                        writesFrozen={discardBusy}
                        writesFrozenRef={writesFrozenRef}
                        onStatsChange={onBlockSlotStatsChange}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <section className="bk-card bk-log-session-note bk">
              <label>
                <span className="bk-log-session-note__label">How the session went</span>
                <textarea
                  ref={sessionNoteRef}
                  value={sessionNotesDraft}
                  onChange={(e) => setSessionNotesDraft(e.target.value)}
                  onFocus={(e) => {
                    const el = e.currentTarget;
                    requestAnimationFrame(() => {
                      el.scrollIntoView?.({ block: "center", behavior: "smooth" });
                    });
                  }}
                  onBlur={() => void commitSessionNotes()}
                  placeholder="Energy, soreness, anything worth remembering"
                  disabled={discardBusy}
                />
              </label>
            </section>
          </div>
        ) : (
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
                disabled={discardBusy}
              />
            )}
          </label>
          {isQuickLog ? (
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
                disabled={discardBusy}
              />
            </label>
          ) : null}

          {isFromTemplate ? (
            <div className="stack" style={{ gap: 10 }}>
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
              </div>
              {liveEffortToggle}
            </div>
          ) : (
            <div className="quick-log-display-prefs stack">
              {liveEffortToggle}
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
              <div className="quick-log-display-prefs__group stack">
                <div className="quick-log-display-prefs__label muted small">Units</div>
                <div className="quick-log-toggle-row row">
                  <button
                    type="button"
                    className={`quick-log-toggle ${weightUnit === "lbs" ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={weightUnit === "lbs"}
                    onClick={() => {
                      saveWeightUnit("lbs");
                      setWeightUnit("lbs");
                    }}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    className={`quick-log-toggle ${weightUnit === "kg" ? "quick-log-toggle--on" : ""}`}
                    aria-pressed={weightUnit === "kg"}
                    onClick={() => {
                      saveWeightUnit("kg");
                      setWeightUnit("kg");
                    }}
                  >
                    kg
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
                      weightUnit={undefined}
                      trackedStatus={trackedStatusByExerciseId.get(se.id) ?? null}
                      onOpenAddToLibrary={() => openAddToLibrarySheet(se.exerciseName, se.id)}
                      onExerciseCommitted={mergeSessionExerciseRow}
                      onSaved={load}
                      onCreateSet={onCreateSetForExercise}
                      onPromoteDraftSet={promoteDraftSetTracked}
                      onUpdateSet={onUpdateSet}
                      onDeleteSet={onDeleteSet}
                      onDeleteExercise={onDeleteExercise}
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
                      highlightMissingEffort={highlightMissingEffort}
                      writesFrozen={discardBusy}
                      writesFrozenRef={writesFrozenRef}
                    />
                  </div>
                );
              })}
              <div className="workout-builder-append session-append-exercise">
                <button
                  type="button"
                  className="btn btn-secondary workout-append-row-btn"
                  onClick={() => void onAppendExercise()}
                  disabled={addingExercise || discardBusy}
                >
                  {addingExercise ? "Adding…" : "+ Add exercise"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        )
      ) : (
        <div className="stack session-completed">
          <CompletedSessionSummary
            session={session}
            exercises={sessionExercises}
            setsByExercise={setsByExercise}
            weightUnit={weightUnit}
            setHasPR={setHasPR}
            renderTracked={(se) => {
              const status = trackedStatusByExerciseId.get(se.id) ?? null;
              if (!status) return null;
              const interactive = status === "unresolved";
              return (
                <ExerciseTrackedIndicator
                  status={status}
                  interactive={interactive}
                  onOpenAddToLibrary={
                    interactive ? () => openAddToLibrarySheet(se.exerciseName, se.id) : undefined
                  }
                />
              );
            }}
          />

          <CoachPanel
            mode="debrief"
            focus={{ type: "session", sessionId }}
            collapsedLabel="Debrief this workout"
            autoAsk="Debrief this workout."
          />

          {confirmReopen ? (
            <div className="stack" style={{ gap: 8 }}>
              <p className="muted small" style={{ margin: 0, fontWeight: 600 }}>
                Reopen this workout? It goes back to in-progress so you can add sets and
                exercises or fix anything. It leaves your history and analytics until you
                finish it again, and nothing already logged is lost.
              </p>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void onReopen()}
                  disabled={reopenBusy}
                  aria-busy={reopenBusy}
                  style={{ padding: "6px 10px" }}
                >
                  {reopenBusy ? "Reopening…" : "Yes, reopen"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmReopen(false)}
                  disabled={reopenBusy}
                  style={{ padding: "6px 10px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmReopen(true)}
              >
                Reopen workout
              </button>
            </div>
          )}
        </div>
      )}

      {!isCompleted ? (
        <div className="session-finish-dock" role="region" aria-label="Finish workout">
          <div className="session-finish-dock__inner stack">
            {confirmFinish && isFromBlock ? (
              <div className="stack session-finish-confirm">
                <p className="muted small session-finish-confirm__title">
                  {`${blockUnloggedPlanned} of ${blockProgress.total} planned sets not logged - finish anyway?`}
                </p>
                <div className="session-finish-confirm__actions">
                  <button
                    ref={finishAnywayBtnRef}
                    type="button"
                    className="btn session-finish-btn session-finish-confirm__go"
                    onClick={() => void onComplete()}
                    disabled={completeBusy || discardBusy}
                    aria-busy={completeBusy}
                  >
                    {completeBusy ? "Saving…" : "Finish anyway"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirmFinish(false)}
                    disabled={completeBusy}
                  >
                    Keep logging
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
                  Autosaves as you go. Finishing saves it to your history.
                </p>
                {!canFinishWorkout ? (
                  <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
                    {totalSetsLogged < 1 ? (
                      <>
                        Log at least one set anywhere to enable <strong>Finish workout</strong>.
                      </>
                    ) : setsMissingEffort > 0 ? (
                      <>
                        Add {liveEffortSignal === "rpe" ? "RPE" : "RIR"} on {setsMissingEffort} more{" "}
                        {setsMissingEffort === 1 ? "set" : "sets"} to enable{" "}
                        <strong>Finish workout</strong>.
                      </>
                    ) : (
                      <>
                        Log at least one set anywhere to enable <strong>Finish workout</strong>.
                      </>
                    )}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn session-finish-btn session-finish-dock__btn"
                  onClick={() => requestFinishWorkout()}
                  disabled={!canFinishWorkout || completeBusy || discardBusy}
                  aria-busy={completeBusy}
                >
                  {completeBusy ? "Saving…" : "Finish workout"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <AddExerciseToLibrarySheet
        open={Boolean(addToLibrarySheet)}
        initialName={addToLibrarySheet?.exerciseName ?? ""}
        sessionExerciseId={addToLibrarySheet?.sessionExerciseId ?? null}
        context={isCompleted ? "completed" : "live"}
        onClose={closeAddToLibrarySheet}
        onLink={handleAddToLibraryLink}
        onCreateCommitted={handleAddToLibraryCreateCommitted}
      />
    </div>
  );
}


