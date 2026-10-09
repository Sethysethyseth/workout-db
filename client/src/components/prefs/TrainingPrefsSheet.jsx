import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TrainingPrefsForm } from "./TrainingPrefsForm.jsx";
import "../../styles/training-prefs.css";

export function TrainingPrefsSheet({ open, onClose }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    function fit() {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const available = vv.height - 12;
      sheet.style.maxHeight = `${Math.max(240, Math.round(available))}px`;
    }
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
      if (sheetRef.current) sheetRef.current.style.maxHeight = "";
    };
  }, [open]);

  if (!open) return null;

  const node = (
    <div
      className="start-workout-picker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-prefs-sheet-title"
    >
      <button
        type="button"
        className="start-workout-picker__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="start-workout-picker__sheet card training-prefs-sheet"
      >
        <div className="start-workout-picker__handle" aria-hidden="true" />
        <h2 id="training-prefs-sheet-title" className="start-workout-picker__title">
          Logging setup
        </h2>
        <p className="start-workout-picker__lead muted small">
          Saved on this phone. Changes apply right away.
        </p>
        <div className="training-prefs-sheet__scroll">
          <TrainingPrefsForm variant="sheet" />
        </div>
        <button type="button" className="btn training-prefs-sheet__done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
