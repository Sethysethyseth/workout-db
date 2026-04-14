import { useEffect } from "react";
import { createPortal } from "react-dom";

export function StartWorkoutPicker({
  open,
  onClose,
  templates,
  onEmptyWorkout,
  onPickTemplate,
  onBrowseTemplates,
  emptyBusy,
  templateBusyId,
}) {
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

  if (!open) return null;

  const node = (
    <div className="start-workout-picker" role="dialog" aria-modal="true" aria-labelledby="start-picker-title">
      <button type="button" className="start-workout-picker__backdrop" aria-label="Close" onClick={onClose} />
      <div className="start-workout-picker__sheet card">
        <div className="start-workout-picker__handle" aria-hidden="true" />
        <h2 id="start-picker-title" className="start-workout-picker__title">
          Start workout
        </h2>
        <p className="start-workout-picker__lead muted small">Choose how to begin.</p>

        <button
          type="button"
          className="btn start-workout-picker__primary"
          disabled={emptyBusy}
          onClick={() => void onEmptyWorkout()}
        >
          {emptyBusy ? "Starting…" : "Empty workout"}
        </button>
        <p className="muted small start-workout-picker__hint" style={{ margin: 0 }}>
          One blank exercise—name it when you start lifting.
        </p>

        {templates.length > 0 ? (
          <>
            <p className="start-workout-picker__section-label muted small">Saved workouts</p>
            <ul className="start-workout-picker__list">
              {templates.map((t) => {
                const n = Array.isArray(t.exercises) ? t.exercises.length : 0;
                const busy = templateBusyId === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="start-workout-picker__row"
                      disabled={Boolean(templateBusyId)}
                      onClick={() => onPickTemplate(t.id)}
                    >
                      <span className="start-workout-picker__row-name">{t.name || "Untitled"}</span>
                      <span className="muted small">{busy ? "Starting…" : `${n} ex`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        <button type="button" className="btn btn-secondary start-workout-picker__browse" onClick={onBrowseTemplates}>
          Browse templates
        </button>
        <button type="button" className="btn btn-ghost start-workout-picker__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
