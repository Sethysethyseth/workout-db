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

const CHIP_CYCLE = ["off", "main", "assist"];

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

function nextChipRole(current) {
  const idx = CHIP_CYCLE.indexOf(current);
  return CHIP_CYCLE[(idx + 1) % CHIP_CYCLE.length];
}

export function AddExerciseToLibrarySheet({ open, initialName = "", onClose, onSuccess }) {
  const titleId = useId();
  const nameInputRef = useRef(null);
  const [name, setName] = useState("");
  const [muscleRoles, setMuscleRoles] = useState({});
  const [musclesLoading, setMusclesLoading] = useState(false);
  const [musclesError, setMusclesError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyTracked, setAlreadyTracked] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(String(initialName ?? "").trim());
    setMuscleRoles({});
    setMusclesError(null);
    setSubmitError(null);
    setSubmitting(false);
    setAlreadyTracked(null);
  }, [open, initialName]);

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
    if (!open) return;
    const id = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setMusclesLoading(true);
    setMusclesError(null);
    exerciseApi
      .getMuscles()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.muscles) ? data.muscles : [];
        if (list.length === 0) {
          setMusclesError("Could not load muscles.");
        }
      })
      .catch((err) => {
        if (!cancelled) setMusclesError(err);
      })
      .finally(() => {
        if (!cancelled) setMusclesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      setAlreadyTracked(null);
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
          } else {
            setAlreadyTracked(null);
          }
        })
        .catch(() => {
          if (!cancelled) setAlreadyTracked(null);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, name]);

  const toggleMuscle = useCallback((muscle) => {
    setMuscleRoles((prev) => {
      const current = prev[muscle] || "off";
      const next = nextChipRole(current);
      if (next === "off") {
        const { [muscle]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [muscle]: next };
    });
    setSubmitError(null);
  }, []);

  const mainCount = Object.values(muscleRoles).filter((r) => r === "main").length;
  const trimmedName = String(name ?? "").trim();
  const canSubmit =
    Boolean(trimmedName) && mainCount > 0 && !alreadyTracked && !submitting && !musclesLoading;

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
      await exerciseApi.createCustomExercise({ name: trimmedName, muscles });
      onSuccess?.(trimmedName);
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  }, [canSubmit, muscleRoles, trimmedName, onSuccess]);

  if (!open) return null;

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
          <h2 id={titleId} className="add-exercise-library-sheet__title">
            Add to your library
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
        <p className="add-exercise-library-sheet__lead muted small">
          Tell us what it works and your analytics will count it.
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
          <p className="add-exercise-library-sheet__already-tracked muted small">
            Already tracked as {alreadyTracked}
          </p>
        ) : null}

        {musclesError ? <ErrorMessage error={musclesError} /> : null}
        {submitError ? <ErrorMessage error={submitError} /> : null}

        <div className="add-exercise-library-sheet__picker" aria-busy={musclesLoading}>
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
                  return (
                    <button
                      key={muscle}
                      type="button"
                      className={chipClass}
                      aria-pressed={role !== "off"}
                      aria-label={`${formatMuscleLabel(muscle)}: ${roleLabel}`}
                      disabled={musclesLoading}
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
          <button type="button" className="btn btn-secondary" disabled={submitting} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
