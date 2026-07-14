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
import { getAdHocSessionTitle, setAdHocSessionTitle } from "../lib/adHocSessionTitle.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";
import { smartWorkoutNameFromSessionExercises } from "../lib/smartWorkoutName.js";
import {
  loadQuickWorkoutLogPrefs,
  saveQuickWorkoutLogPrefs,
} from "../lib/quickWorkoutLogPrefs.js";
import { loadWeightUnit, saveWeightUnit } from "../lib/weightUnitPref.js";
import { useSessionLiveLoggingGuard } from "../context/SessionLiveLoggingGuardContext.jsx";
import {
  BLANK_SESSION_EXERCISE_NAME,
  inputToSessionExerciseName,
  isBlankSessionExerciseName,
  sessionExerciseNameForInput,
} from "../lib/sessionExerciseName.js";

const exerciseResolutionCache = new Map();

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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenAddToLibrary?.();
      }}
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
  return d.toLocaleString();
}

function nextSetOrder(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  const max = sets.reduce((acc, s) => (s.order > acc ? s.order : acc), 0);
  return max + 1;
}

function exerciseNameImpliesPerSide(name) {
  const n = String(name ?? "").trim();
  if (!n || isBlankSessionExerciseName(n)) return false;
  return /\bsingle\b/i.test(n);
}

function anySetHasSide(sets) {
  return Array.isArray(sets) && sets.some((s) => s.side === "L" || s.side === "R");
}

function derivePerSideMode(manualOverride, exerciseName, sets) {
  if (manualOverride === true) return true;
  if (manualOverride === false) return false;
  return anySetHasSide(sets) || exerciseNameImpliesPerSide(exerciseName);
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

/** POST create-set field payload from local draft (promotion path). Omits blank fields. */
function promotionPayloadFromDraft(d) {
  const payload = {};
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (t(d.reps) !== "") payload.reps = Number(String(d.reps).trim());
  if (t(d.weight) !== "") payload.weight = Number(String(d.weight).trim());
  if (t(d.rpe) !== "") payload.rpe = Number(String(d.rpe).trim());
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
  /** Live session: report draft tracked/untracked status while typing (write-free). */
  onDraftTrackedStatusChange,
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
}) {
  const rootRef = useRef(null);
  const [draft, setDraft] = useState(() =>
    isDraft
      ? { reps: "", weight: "", rpe: "", rir: "", notes: "" }
      : {
          order: String(set.order ?? ""),
          reps: set.reps ?? "",
          weight: set.weight ?? "",
          rpe: set.rpe ?? "",
          rir: set.rir ?? "",
          notes: set.notes ?? "",
        }
  );
  const draftRef = useRef(draft);
  const promotingRef = useRef(false);
  const lastSentKeyRef = useRef(null);

  const fieldIds = useMemo(
    () =>
      isDraft
        ? {
            weight: `log-draft-${sessionExerciseId}-weight`,
            reps: `log-draft-${sessionExerciseId}-reps`,
            rir: `log-draft-${sessionExerciseId}-rir`,
            rpe: `log-draft-${sessionExerciseId}-rpe`,
            notes: `log-draft-${sessionExerciseId}-notes`,
          }
        : {
            weight: `log-set-${set.id}-weight`,
            reps: `log-set-${set.id}-reps`,
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
    const empty = { reps: "", weight: "", rpe: "", rir: "", notes: "" };
    setDraft(empty);
    draftRef.current = empty;
    lastSentKeyRef.current = null;
  }, [isDraft, resumeVersion]);

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

  useEffect(() => {
    if (isDraft) return;
    const next = {
      order: String(set.order ?? ""),
      reps: set.reps ?? "",
      weight: set.weight ?? "",
      rpe: set.rpe ?? "",
      rir: set.rir ?? "",
      notes: set.notes ?? "",
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
  }, [isDraft, set?.id, set?.order, set?.reps, set?.weight, set?.rpe, set?.rir, set?.notes, lockSetOrder]);

  const tryPromote = useCallback(async () => {
    if (!isDraft) return;
    if (promotingRef.current) return;
    const cur = draftRef.current;
    if (sessionSetRowIsBlank(cur)) return;
    const k = payloadKey(promotionPayloadFromDraft(cur));
    if (k === lastSentKeyRef.current) return;
    promotingRef.current = true;
    try {
      const created = await onPromoteDraft(cur);
      lastSentKeyRef.current = k;
      // The POST above sent a snapshot (`cur`) taken before the await; keystrokes
      // typed into this same row while it was in flight already live in local
      // state but never reached the server under the just-created set's id -
      // patch them on now.
      if (created && created.id != null && onUpdateSet) {
        const latest = draftRef.current;
        const latestKey = payloadKey(promotionPayloadFromDraft(latest));
        if (latestKey !== k) {
          lastSentKeyRef.current = latestKey;
          onUpdateSet(created.id, {
            order: created.order,
            reps: latest.reps === "" ? "" : Number(latest.reps),
            weight: latest.weight === "" ? "" : Number(latest.weight),
            rpe: latest.rpe === "" ? "" : Number(latest.rpe),
            rir: latest.rir === "" ? "" : Number(latest.rir),
            notes: latest.notes === "" ? "" : latest.notes,
          });
        }
      }
    } catch {
      lastSentKeyRef.current = null;
    } finally {
      promotingRef.current = false;
    }
  }, [isDraft, onPromoteDraft, onUpdateSet]);

  function flushNow() {
    if (isDraft || disabled) return;
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

  useEffect(() => {
    if (isDraft) {
      const cur = draftRef.current;
      if (sessionSetRowIsBlank(cur)) return;
      const k = payloadKey(promotionPayloadFromDraft(cur));
      if (k === lastSentKeyRef.current) return;
      const t = setTimeout(() => {
        void tryPromote();
      }, 900);
      return () => clearTimeout(t);
    }
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
  }, [draft, disabled, isDraft, tryPromote]);

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
  const needsWeightHighlight = Boolean(needsWeight && (!isNext || rTrim !== ""));
  const needsRepsHighlight = Boolean(needsReps && (!isNext || wTrim !== ""));
  const showNextHint = Boolean(!disabled && isNext && !coreLogged && !wTrim && !rTrim);

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
                placeholder="e.g. 8"
                aria-invalid={needsRepsHighlight ? true : undefined}
              />
            </label>
          </div>

          {useRIR || useRPE ? (
            <div className="session-set-optional-row grid-set-row" style={{ "--set-cols": optionalColCount }}>
              {useRIR ? (
                <label className="session-set-field session-set-field--secondary">
                  <span className="session-set-field-label session-set-field-label-line">
                    <span>RIR</span> <MetricInfoButton metric="rir" />
                  </span>
                  <span className="muted small" style={{ fontWeight: 500, lineHeight: 1.2, marginTop: -1 }}>
                    Reps in Reserve
                  </span>
                  <input
                    id={fieldIds.rir}
                    value={draft.rir}
                    onChange={(e) => setDraft((d) => ({ ...d, rir: e.target.value }))}
                    onBlur={onFieldBlur}
                    onKeyDown={(e) => onEnterNext(e, "rir")}
                    enterKeyHint={useRPE || useSetNotes ? "next" : "done"}
                    inputMode="numeric"
                    disabled={isDraft ? false : disabled}
                    placeholder="—"
                    title="Optional"
                  />
                </label>
              ) : null}
              {useRPE ? (
                <label className="session-set-field session-set-field--secondary">
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
}) {
  const [draftResumeVersion, setDraftResumeVersion] = useState(0);
  const [draftTrackedStatus, setDraftTrackedStatus] = useState(null);
  const [perSideOverride, setPerSideOverride] = useState(null);
  const prevSetsLenRef = useRef(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setPerSideOverride(null);
    setDraftTrackedStatus(null);
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

  const exerciseCommitted = isCompleted ? undefined : onExerciseCommitted;
  const rawName = se.exerciseName ?? "";
  const perSideMode = derivePerSideMode(perSideOverride, rawName, sets);
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
          void onDeleteSet(id);
        }
        return;
      }
      void onDeleteSet(setId);
    },
    [onDeleteSet, perSideMode]
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

  const headingInner = (
    <>
      {collapsible && !isCompleted ? (
        <span className="session-exercise-heading-chevron" aria-hidden="true">
          {isCollapsed ? "▸" : "▾"}
        </span>
      ) : null}
      <span className="session-exercise-heading-text">
        <strong className="session-exercise-heading">{namePart}</strong>
        <span className="session-exercise-heading-meta muted">
          {" "}
          · {setCountLabel}
        </span>
        <ExerciseTrackedIndicator
          status={displayTrackedStatus}
          interactive={displayTrackedStatus === "unresolved"}
          onOpenAddToLibrary={
            displayTrackedStatus === "unresolved" ? onOpenAddToLibrary : undefined
          }
        />
        {summaryLine ? (
          <span className="session-exercise-heading-summary muted small"> · {summaryLine}</span>
        ) : null}
      </span>
    </>
  );

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
          collapsible && !isCompleted
            ? "session-exercise-heading-sticky"
            : "session-exercise-heading-sticky session-exercise-heading-sticky--static"
        }
      >
        {collapsible && !isCompleted ? (
          <div className="row session-exercise-heading-row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="session-exercise-heading-toggle"
              onClick={() => onToggleCollapsed?.()}
              aria-expanded={expanded}
            >
              {headingInner}
            </button>
            {removeControl}
          </div>
        ) : (
          <div
            className="row session-exercise-heading-row session-exercise-heading-toggle-static"
            style={{ justifyContent: "space-between" }}
          >
            <div>{headingInner}</div>
            {removeControl}
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
            onDraftTrackedStatusChange={!isCompleted ? setDraftTrackedStatus : undefined}
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
                <>
                  <PlanningSetCountControl
                    value={pairCount}
                    disabled={setCountBusy}
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
                      setPerSideOverride(perSideMode ? false : true);
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
                  disabled={setCountBusy}
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
                    />
                  )
                ) : (
                  renderUnits.map((unit, idx) => {
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
                              onDeleteSet={() => handleDeleteSet(s.id, unit)}
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
                        onDeleteSet={() => handleDeleteSet(s.id, unit)}
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
                    disabled={setCountBusy}
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
  const [resolutionTick, setResolutionTick] = useState(0);
  const [addToLibrarySheet, setAddToLibrarySheet] = useState(null);
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
      if (sessionExerciseId && userExerciseId) {
        const data = await sessionApi.updateSessionExercise(sessionId, sessionExerciseId, {
          userExerciseId,
        });
        const row = data?.sessionExercise;
        if (row) mergeSessionExerciseRow(row);
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
        if (!session || session.workoutTemplate) return {};
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
    async (sessionExerciseId, options) => {
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

  const promoteDraftSet = useCallback(
    async (sessionExerciseId, draft) => {
      setError(null);
      try {
        const sess = sessionRef.current;
        if (!sess) {
          await load();
          return;
        }
        const order = nextSetOrder(sess);
        const body = { sessionExerciseId, order, ...promotionPayloadFromDraft(draft) };

        const data = await sessionApi.createSet(sessionId, body);
        if (data?.set) {
          appendSetRow(data.set);
          return data.set;
        }
        await load();
        return null;
      } catch (err) {
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
      setError(err);
      await load();
    } finally {
      setAdjustingSetCountExerciseId(null);
    }
  }

  const applyUpdateSet = useCallback(async (setId, patch) => {
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
            side: "side" in apiSet ? apiSet.side : nextSets[idx].side,
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

  // Rapid entry fires PATCHes for the same set in quick succession; each one
  // carries the full row, so out-of-order arrival lets an older payload win.
  // Chain per set id to guarantee server-side ordering, and track every
  // in-flight write so onComplete can drain them before completing.
  const onUpdateSet = useCallback(
    (setId, patch) => {
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

  const onDeleteExercise = useCallback(
    async (sessionExerciseId) => {
      setError(null);
      try {
        await sessionApi.deleteSessionExercise(sessionExerciseId);
        await load();
      } catch (err) {
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

  if (loading) return <LoadingState label="Loading workout…" slowLabel="Waking up the server…" />;

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
                <span>
                  Use RIR on sets
                  <span className="muted small" style={{ display: "block", fontWeight: 400, marginTop: 2 }}>
                    Reps in Reserve
                  </span>
                </span>
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={liveUseRPE}
                  onChange={(e) => setLiveUseRPE(e.target.checked)}
                />
                <span>
                  Use RPE on sets
                  <span className="muted small" style={{ display: "block", fontWeight: 400, marginTop: 2 }}>
                    Rating of Perceived Exertion
                  </span>
                </span>
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
                    />
                  </div>
                );
              })}
              <div className="workout-builder-append session-append-exercise">
                <button
                  type="button"
                  className="btn btn-secondary workout-append-row-btn"
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
                  trackedStatus={trackedStatusByExerciseId.get(se.id) ?? null}
                  onOpenAddToLibrary={() => openAddToLibrarySheet(se.exerciseName, se.id)}
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
            <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
              Autosaves as you go. Finishing saves it to your history.
            </p>
            {!canFinishWorkout ? (
              <p className="muted small session-finish-dock__hint" style={{ margin: 0 }}>
                Log at least one set anywhere to enable <strong>Finish workout</strong>.
              </p>
            ) : null}
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


