import { useEffect, useRef, useState } from "react";
import { useTrainingPrefs } from "../../lib/trainingPrefs.js";
import { TrainingPrefsSheet } from "./TrainingPrefsSheet.jsx";
import "../../styles/training-prefs.css";

function SlidersIcon() {
  return (
    <svg
      className="training-prefs-strip__icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function notesPillLabel(exerciseOn, setOn) {
  if (exerciseOn && setOn) return "Notes on";
  if (exerciseOn) return "Exercise notes";
  if (setOn) return "Set notes";
  return null;
}

export function TrainingPrefsStrip({ effortSignal, effortNote } = {}) {
  const prefs = useTrainingPrefs();
  const stripRef = useRef(null);
  const [open, setOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const notesLabel = notesPillLabel(prefs.useExerciseNotes, prefs.useSetNotes);
  const resolvedEffort = effortSignal === undefined ? prefs.effortSignal : effortSignal;
  const effortLabel =
    resolvedEffort === "rpe" ? "RPE" : resolvedEffort === "rir" ? "RIR" : null;

  useEffect(() => {
    if (wasOpenRef.current && !open) stripRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={stripRef}
        type="button"
        className="training-prefs-strip"
        onClick={() => setOpen(true)}
      >
        <SlidersIcon />
        <span className="training-prefs-strip__pills">
          <span className="training-prefs-pill">{prefs.weightUnit}</span>
          {effortLabel ? <span className="training-prefs-pill">{effortLabel}</span> : null}
          {notesLabel ? <span className="training-prefs-pill">{notesLabel}</span> : null}
          {prefs.mirrorLast ? (
            <span className="training-prefs-pill training-prefs-pill--accent">Repeat last</span>
          ) : null}
        </span>
        <span className="training-prefs-strip__edit">Edit</span>
      </button>
      <TrainingPrefsSheet
        open={open}
        onClose={() => setOpen(false)}
        effortNote={effortNote}
      />
    </>
  );
}
