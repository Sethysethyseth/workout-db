import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import * as exerciseApi from "../../api/exerciseApi.js";
import { ErrorMessage } from "../ErrorMessage.jsx";

/** Display-only grouping for the 17-muscle vocabulary from GET /exercises/muscles. */
const MUSCLE_GROUPS = [
  {
    label: "Upper body",
    muscles: [
      "chest",
      "shoulders",
      "triceps",
      "biceps",
      "forearms",
      "lats",
      "middle back",
      "traps",
      "neck",
    ],
  },
  {
    label: "Core",
    muscles: ["abdominals", "lower back"],
  },
  {
    label: "Lower body",
    muscles: [
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "abductors",
      "adductors",
    ],
  },
];

function formatMuscleLabel(muscle) {
  return muscle;
}

function joinMuscleList(muscles) {
  if (muscles.length === 0) return "";
  if (muscles.length === 1) return muscles[0];
  if (muscles.length === 2) return `${muscles[0]} and ${muscles[1]}`;
  return `${muscles.slice(0, -1).join(", ")} and ${muscles[muscles.length - 1]}`;
}

function buildMuscleSummary(selections) {
  const main = [];
  const assist = [];
  for (const [muscle, role] of Object.entries(selections)) {
    if (role === "main") main.push(muscle);
    else if (role === "assist") assist.push(muscle);
  }
  if (main.length === 0) return "Tap the muscles this movement works.";
  let line = `Mostly ${joinMuscleList(main)}`;
  if (assist.length > 0) {
    line += ` - assists ${joinMuscleList(assist)}`;
  }
  return line;
}

/** Map search row primary/secondary arrays into picker roles (Main / Assists). */
function muscleRolesFromSearchRow(row) {
  const roles = {};
  for (const muscle of row.primaryMuscles ?? []) {
    roles[muscle] = "main";
  }
  for (const muscle of row.secondaryMuscles ?? []) {
    roles[muscle] = "assist";
  }
  return roles;
}

function formatMatchMeta(row) {
  const parts = [];
  if (row.equipment) parts.push(row.equipment);
  const primaries = Array.isArray(row.primaryMuscles) ? row.primaryMuscles : [];
  if (primaries.length > 0) parts.push(joinMuscleList(primaries));
  return parts.join(" · ");
}

function SearchMatchRow({ row, onSelect, disabled }) {
  const meta = formatMatchMeta(row);
  return (
    <button
      type="button"
      className="add-exercise-library-sheet__match"
      disabled={disabled}
      onClick={() => onSelect(row)}
    >
      <span className="add-exercise-library-sheet__match-name">{row.name}</span>
      {row.source === "userExercise" ? (
        <span className="add-exercise-library-sheet__match-tag">Custom</span>
      ) : null}
      {meta ? <span className="add-exercise-library-sheet__match-meta muted small">{meta}</span> : null}
    </button>
  );
}

const STEP_TITLES = {
  suggest: "Is it one of these?",
  seed: "Start from a similar exercise?",
  curate: "Add to your library",
  done: "Added to your library",
};

export function AddExerciseToLibrarySheet({
  open,
  initialName = "",
  sessionExerciseId = null,
  context = "live",
  onClose,
  onLink,
  onCreateCommitted,
}) {
  const isCompletedContext = context === "completed";
  const titleId = useId();
  const nameInputRef = useRef(null);
  const seedInputRef = useRef(null);
  const initialSearchSeqRef = useRef(0);
  const seedSearchSeqRef = useRef(0);

  const [step, setStep] = useState("suggest");
  const [hadSuggestStep, setHadSuggestStep] = useState(false);
  const [initialSearchLoading, setInitialSearchLoading] = useState(false);
  const [suggestMatches, setSuggestMatches] = useState([]);

  const [seedQuery, setSeedQuery] = useState("");
  const [seedMatches, setSeedMatches] = useState([]);
  const [seedSearchLoading, setSeedSearchLoading] = useState(false);

  const [name, setName] = useState("");
  const [muscleRoles, setMuscleRoles] = useState({});
  const [pickerMode, setPickerMode] = useState("main");
  const [submitError, setSubmitError] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [linking, setLinking] = useState(false);
  const [alreadyTracked, setAlreadyTracked] = useState(null);
  const [alreadyTrackedResolution, setAlreadyTrackedResolution] = useState(null);

  const [doneVariant, setDoneVariant] = useState("create");
  const [doneLinkName, setDoneLinkName] = useState("");

  useEffect(() => {
    if (!open) return;
    const trimmed = String(initialName ?? "").trim();
    setName(trimmed);
    setSeedQuery(trimmed);
    setMuscleRoles({});
    setPickerMode("main");
    setSubmitError(null);
    setLinkError(null);
    setSubmitting(false);
    setLinking(false);
    setAlreadyTracked(null);
    setAlreadyTrackedResolution(null);
    setSuggestMatches([]);
    setSeedMatches([]);
    setDoneVariant("create");
    setDoneLinkName("");
    setHadSuggestStep(false);
    setInitialSearchLoading(Boolean(trimmed));

    let cancelled = false;
    const seq = initialSearchSeqRef.current + 1;
    initialSearchSeqRef.current = seq;

    async function runInitialSearch() {
      // Completed sessions are locked server-side (no rename/link) - create-only
      // flow opens at seed and never enters suggest.
      if (isCompletedContext) {
        setStep("seed");
        setInitialSearchLoading(false);
        return;
      }
      if (!trimmed) {
        setStep("seed");
        setInitialSearchLoading(false);
        return;
      }
      try {
        const data = await exerciseApi.searchExercises(trimmed, { limit: 5 });
        if (cancelled || seq !== initialSearchSeqRef.current) return;
        const results = Array.isArray(data?.results) ? data.results.slice(0, 5) : [];
        setSuggestMatches(results);
        if (results.length > 0) {
          setStep("suggest");
          setHadSuggestStep(true);
        } else {
          setStep("seed");
        }
      } catch {
        if (!cancelled) setStep("seed");
      } finally {
        if (!cancelled) setInitialSearchLoading(false);
      }
    }

    void runInitialSearch();
    return () => {
      cancelled = true;
    };
  }, [open, initialName, isCompletedContext]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || step !== "curate") return;
    const id = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
    return () => clearTimeout(id);
  }, [open, step]);

  useEffect(() => {
    if (!open || step !== "seed") return;
    const id = window.setTimeout(() => {
      seedInputRef.current?.focus();
      seedInputRef.current?.select();
    }, 0);
    return () => clearTimeout(id);
  }, [open, step]);

  useEffect(() => {
    if (!open || step !== "curate") return;
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      setAlreadyTracked(null);
      setAlreadyTrackedResolution(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      exerciseApi
        .resolveExerciseNames([trimmed])
        .then((data) => {
          if (cancelled) return;
          const row = data?.results?.[0];
          if (row?.resolved && row.canonicalName) {
            setAlreadyTracked(row.canonicalName);
            setAlreadyTrackedResolution(row);
          } else {
            setAlreadyTracked(null);
            setAlreadyTrackedResolution(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAlreadyTracked(null);
            setAlreadyTrackedResolution(null);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, step, name]);

  useEffect(() => {
    if (!open || step !== "seed") return undefined;

    const trimmed = String(seedQuery ?? "").trim();
    if (trimmed.length < 2) {
      setSeedMatches([]);
      return undefined;
    }

    const seq = seedSearchSeqRef.current + 1;
    seedSearchSeqRef.current = seq;
    setSeedSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await exerciseApi.searchExercises(trimmed, { limit: 8 });
        if (seq !== seedSearchSeqRef.current) return;
        const results = Array.isArray(data?.results) ? data.results : [];
        setSeedMatches(results);
      } catch {
        if (seq !== seedSearchSeqRef.current) return;
        setSeedMatches([]);
      } finally {
        if (seq === seedSearchSeqRef.current) setSeedSearchLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [open, step, seedQuery]);

  const handleLinkRow = useCallback(
    async (row) => {
      if (!sessionExerciseId || !onLink) return;
      setLinking(true);
      setLinkError(null);
      try {
        await onLink({
          sessionExerciseId,
          name: row.name,
          exerciseId: row.exerciseId ?? undefined,
          userExerciseId: row.userExerciseId ?? undefined,
        });
        setDoneVariant("link");
        setDoneLinkName(row.name);
        setStep("done");
      } catch (err) {
        setLinkError(err);
      } finally {
        setLinking(false);
      }
    },
    [sessionExerciseId, onLink]
  );

  const handleUseThatName = useCallback(async () => {
    if (!alreadyTrackedResolution || !sessionExerciseId || !onLink) return;
    const row = alreadyTrackedResolution;
    setLinking(true);
    setSubmitError(null);
    try {
      const linkPayload = {
        sessionExerciseId,
        name: row.canonicalName,
      };
      if (row.source === "catalog" && row.catalogId) {
        linkPayload.exerciseId = row.catalogId;
      }
      await onLink(linkPayload);
      setDoneVariant("link");
      setDoneLinkName(row.canonicalName);
      setStep("done");
    } catch (err) {
      setSubmitError(err);
    } finally {
      setLinking(false);
    }
  }, [alreadyTrackedResolution, sessionExerciseId, onLink]);

  const handleSeedSelect = useCallback((row) => {
    setMuscleRoles(muscleRolesFromSearchRow(row));
    setPickerMode("main");
    setSubmitError(null);
    setStep("curate");
  }, []);

  const toggleMuscle = useCallback(
    (muscle) => {
      setMuscleRoles((prev) => {
        const current = prev[muscle] || "off";
        if (pickerMode === "main") {
          if (current === "main") {
            const { [muscle]: _removed, ...rest } = prev;
            return rest;
          }
          return { ...prev, [muscle]: "main" };
        }
        if (current === "assist") {
          const { [muscle]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [muscle]: "assist" };
      });
      setSubmitError(null);
    },
    [pickerMode]
  );

  const mainCount = Object.values(muscleRoles).filter((r) => r === "main").length;
  const trimmedName = String(name ?? "").trim();
  const canSubmit =
    Boolean(trimmedName) &&
    mainCount > 0 &&
    !alreadyTracked &&
    !submitting &&
    !linking;

  const submitBlockReason = (() => {
    if (submitting || linking) return null;
    if (!trimmedName) return "Enter a name for this exercise";
    if (alreadyTracked) return null;
    if (mainCount === 0) return "Pick at least one Main muscle";
    return null;
  })();

  const summaryLine = buildMuscleSummary(muscleRoles);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    const muscles = {};
    for (const [muscle, role] of Object.entries(muscleRoles)) {
      if (role === "main") muscles[muscle] = "primary";
      else if (role === "assist") muscles[muscle] = "secondary";
    }
    try {
      const data = await exerciseApi.createCustomExercise({ name: trimmedName, muscles });
      const userExerciseId = data?.userExercise?.id ?? null;
      if (onCreateCommitted) {
        try {
          if (isCompletedContext) {
            // Locked session: skip userExerciseId stamp (PATCH would 4xx). Name-based
            // resolution alone flips the pill after invalidate + refresh.
            await onCreateCommitted({ name: trimmedName });
          } else {
            await onCreateCommitted({ name: trimmedName, userExerciseId });
          }
        } catch {
          // Stamp is best-effort; library entry exists and name-based resolution still works.
        }
      }
      setDoneVariant("create");
      setStep("done");
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  }, [canSubmit, muscleRoles, trimmedName, onCreateCommitted, isCompletedContext]);

  const goBack = useCallback(() => {
    setLinkError(null);
    setSubmitError(null);
    if (step === "curate") {
      setStep("seed");
      return;
    }
    if (step === "seed" && hadSuggestStep) {
      setStep("suggest");
    }
  }, [step, hadSuggestStep]);

  const showBack = step === "curate" || (step === "seed" && hadSuggestStep);

  if (!open) return null;

  const stepTitle =
    step === "done"
      ? doneVariant === "link"
        ? "Linked"
        : "Added to your library"
      : STEP_TITLES[step];

  const node = (
    <div
      className="add-exercise-library-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="add-exercise-library-sheet__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="add-exercise-library-sheet__card card">
        <div className="add-exercise-library-sheet__header">
          {showBack ? (
            <button
              type="button"
              className="add-exercise-library-sheet__back btn btn-ghost"
              aria-label="Back"
              onClick={goBack}
            >
              ←
            </button>
          ) : (
            <span className="add-exercise-library-sheet__back-spacer" aria-hidden="true" />
          )}
          <h2 id={titleId} className="add-exercise-library-sheet__title">
            {stepTitle}
          </h2>
          <button
            type="button"
            className="add-exercise-library-sheet__close btn btn-ghost"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div
          key={step}
          className={`add-exercise-library-sheet__step add-exercise-library-sheet__step--${step}`}
        >
          {step === "suggest" && !isCompletedContext ? (
            <>
              <p className="add-exercise-library-sheet__lead muted small">
                Pick a match to link this set row, or say it is its own thing.
              </p>
              {initialSearchLoading ? (
                <p className="add-exercise-library-sheet__loading muted small">Searching…</p>
              ) : (
                <div className="add-exercise-library-sheet__matches">
                  {suggestMatches.map((row) => (
                    <SearchMatchRow
                      key={`${row.source}-${row.exerciseId ?? row.userExerciseId}`}
                      row={row}
                      disabled={linking || !sessionExerciseId}
                      onSelect={(match) => void handleLinkRow(match)}
                    />
                  ))}
                </div>
              )}
              {linkError ? <ErrorMessage error={linkError} /> : null}
              <button
                type="button"
                className="add-exercise-library-sheet__escape"
                onClick={() => setStep("seed")}
              >
                None of these - it&apos;s its own thing
              </button>
            </>
          ) : null}

          {step === "seed" ? (
            <>
              <p className="add-exercise-library-sheet__lead muted small">
                Starting from a similar exercise copies its muscle profile, so your analytics
                data stays curated-quality.
              </p>
              <label className="add-exercise-library-sheet__search-field">
                <span className="small">Search exercises</span>
                <input
                  ref={seedInputRef}
                  type="search"
                  value={seedQuery}
                  onChange={(e) => setSeedQuery(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>
              {seedSearchLoading ? (
                <p className="add-exercise-library-sheet__loading muted small">Searching…</p>
              ) : null}
              {seedMatches.length > 0 ? (
                <div className="add-exercise-library-sheet__matches">
                  {seedMatches.map((row) => (
                    <SearchMatchRow
                      key={`seed-${row.source}-${row.exerciseId ?? row.userExerciseId}`}
                      row={row}
                      disabled={false}
                      onSelect={handleSeedSelect}
                    />
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="add-exercise-library-sheet__escape"
                onClick={() => {
                  setMuscleRoles({});
                  setPickerMode("main");
                  setStep("curate");
                }}
              >
                Start from scratch
              </button>
            </>
          ) : null}

          {step === "curate" ? (
            <>
              <p className="add-exercise-library-sheet__lead muted small">
                Name it and confirm what it works.
              </p>

              <label className="add-exercise-library-sheet__name-field">
                <span className="small">Name</span>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSubmitError(null);
                  }}
                  autoComplete="off"
                  enterKeyHint="done"
                />
              </label>

              {alreadyTracked ? (
                <div className="add-exercise-library-sheet__already-tracked">
                  <p className="add-exercise-library-sheet__already-tracked-text muted small">
                    Already tracked as {alreadyTracked}
                  </p>
                  {!isCompletedContext ? (
                    <button
                      type="button"
                      className="btn btn-secondary add-exercise-library-sheet__use-name-btn"
                      disabled={linking || !sessionExerciseId}
                      onClick={() => void handleUseThatName()}
                    >
                      Use that name
                    </button>
                  ) : null}
                </div>
              ) : null}

              {submitError ? <ErrorMessage error={submitError} /> : null}

              <div
                className="add-exercise-library-sheet__role-toggle"
                aria-label="Muscle role"
              >
                <button
                  type="button"
                  aria-pressed={pickerMode === "main"}
                  className={`add-exercise-library-sheet__role-btn${
                    pickerMode === "main" ? " add-exercise-library-sheet__role-btn--active" : ""
                  }`}
                  onClick={() => setPickerMode("main")}
                >
                  Main
                </button>
                <button
                  type="button"
                  aria-pressed={pickerMode === "assist"}
                  className={`add-exercise-library-sheet__role-btn${
                    pickerMode === "assist" ? " add-exercise-library-sheet__role-btn--active" : ""
                  }`}
                  onClick={() => setPickerMode("assist")}
                >
                  Assists
                </button>
              </div>
              <p className="add-exercise-library-sheet__role-hint muted small">
                {pickerMode === "main"
                  ? "Tap muscles this exercise mainly works."
                  : "Tap muscles that assist the movement."}
              </p>

              <div className="add-exercise-library-sheet__picker">
                {MUSCLE_GROUPS.map((group) => (
                  <div key={group.label} className="add-exercise-library-sheet__muscle-group">
                    <p className="add-exercise-library-sheet__muscle-group-label muted small">
                      {group.label}
                    </p>
                    <div className="add-exercise-library-sheet__muscle-chips">
                      {group.muscles.map((muscle) => {
                        const role = muscleRoles[muscle] || "off";
                        const chipClass = [
                          "add-exercise-library-sheet__chip",
                          role === "main" ? "add-exercise-library-sheet__chip--main" : "",
                          role === "assist" ? "add-exercise-library-sheet__chip--assist" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        const roleLabel =
                          role === "main" ? "Main" : role === "assist" ? "Assists" : "Off";
                        const pressedInMode =
                          pickerMode === "main" ? role === "main" : role === "assist";
                        return (
                          <button
                            key={muscle}
                            type="button"
                            className={chipClass}
                            aria-pressed={pressedInMode}
                            aria-label={`${formatMuscleLabel(muscle)}: ${roleLabel}`}
                            onClick={() => toggleMuscle(muscle)}
                          >
                            {formatMuscleLabel(muscle)}
                            {role === "main" ? (
                              <span className="add-exercise-library-sheet__chip-badge">Main</span>
                            ) : null}
                            {role === "assist" ? (
                              <span className="add-exercise-library-sheet__chip-badge">Assists</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="add-exercise-library-sheet__summary muted small">{summaryLine}</p>

              {submitBlockReason ? (
                <p className="add-exercise-library-sheet__helper muted small">{submitBlockReason}</p>
              ) : null}

              <div className="add-exercise-library-sheet__footer">
                <button
                  type="button"
                  className="btn"
                  disabled={!canSubmit}
                  aria-busy={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? "Adding..." : "Add exercise"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting || linking}
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : null}

          {step === "done" ? (
            <>
              <div className="add-exercise-library-sheet__done">
                {doneVariant === "create" ? (
                  <>
                    <p className="add-exercise-library-sheet__done-name">
                      <strong>{trimmedName}</strong> is in your library.
                    </p>
                    <p className="add-exercise-library-sheet__done-detail muted small">
                      Counts toward your analytics, including past workouts logged under this name.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="add-exercise-library-sheet__done-name">
                      This row now logs as <strong>{doneLinkName}</strong>.
                    </p>
                    <p className="add-exercise-library-sheet__done-detail muted small">
                      Tracked - counts toward your analytics.
                    </p>
                  </>
                )}
              </div>
              <div className="add-exercise-library-sheet__footer">
                <button type="button" className="btn" onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
