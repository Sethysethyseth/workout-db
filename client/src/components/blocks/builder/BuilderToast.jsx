import { useEffect } from "react";

/** Transient toast with optional Undo action. */
export function BuilderToast({ message, onUndo, onDismiss, durationMs = 5000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = window.setTimeout(() => onDismiss?.(), durationMs);
    return () => window.clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="bk-toast" role="status" aria-live="polite">
      <span className="bk-toast__msg">{message}</span>
      {onUndo ? (
        <button type="button" className="bk-toast__undo" onClick={onUndo}>
          Undo
        </button>
      ) : null}
      <button
        type="button"
        className="bk-toast__dismiss"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
