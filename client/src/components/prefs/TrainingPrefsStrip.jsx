import { useEffect, useRef, useState } from "react";
import { setTrainingPref, useTrainingPrefs } from "../../lib/trainingPrefs.js";
import { TrainingPrefsSheet } from "./TrainingPrefsSheet.jsx";
import "../../styles/training-prefs.css";

export function TrainingPrefsStrip({ effortSignal, effortNote } = {}) {
  const prefs = useTrainingPrefs();
  const editRef = useRef(null);
  const [open, setOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const resolvedEffort = effortSignal === undefined ? prefs.effortSignal : effortSignal;
  const showScale = resolvedEffort === "rir" || resolvedEffort === "rpe";
  const scaleLocked = Boolean(effortNote);

  useEffect(() => {
    if (wasOpenRef.current && !open) editRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  function onScaleTap(next) {
    if (resolvedEffort === next) return;
    if (scaleLocked) {
      setOpen(true);
      return;
    }
    setTrainingPref("effortSignal", next);
  }

  return (
    <>
      <div className="training-prefs-strip" role="group" aria-label="Logging setup">
        {showScale ? (
          <span className="training-prefs-pair">
            <button
              type="button"
              className={`training-prefs-chip${resolvedEffort === "rir" ? " training-prefs-chip--lit" : ""}`}
              aria-pressed={resolvedEffort === "rir"}
              onClick={() => onScaleTap("rir")}
            >
              RIR
            </button>
            <button
              type="button"
              className={`training-prefs-chip${resolvedEffort === "rpe" ? " training-prefs-chip--lit" : ""}`}
              aria-pressed={resolvedEffort === "rpe"}
              onClick={() => onScaleTap("rpe")}
            >
              RPE
            </button>
          </span>
        ) : null}
        <button
          type="button"
          className={`training-prefs-chip${prefs.useExerciseNotes ? " training-prefs-chip--lit" : ""}`}
          aria-pressed={prefs.useExerciseNotes}
          onClick={() => setTrainingPref("useExerciseNotes", !prefs.useExerciseNotes)}
        >
          Exercise notes
        </button>
        <button
          type="button"
          className={`training-prefs-chip${prefs.mirrorLast ? " training-prefs-chip--lit" : ""}`}
          aria-pressed={prefs.mirrorLast}
          onClick={() => setTrainingPref("mirrorLast", !prefs.mirrorLast)}
        >
          Repeat last
        </button>
        <button
          ref={editRef}
          type="button"
          className="training-prefs-strip__edit"
          onClick={() => setOpen(true)}
        >
          Edit
        </button>
      </div>
      <TrainingPrefsSheet
        open={open}
        onClose={() => setOpen(false)}
        effortNote={effortNote}
      />
    </>
  );
}
