import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/confirm.css";

const PROGRESS_LABELS = {
  "Finish anyway": "Finishing…",
  "Discard workout": "Discarding…",
  "Remove pair": "Removing…",
  "Remove sets": "Removing…",
};

function progressLabel(label) {
  if (PROGRESS_LABELS[label]) return PROGRESS_LABELS[label];
  if (typeof label === "string" && label.endsWith("…")) return label;
  return `${label}…`;
}

/**
 * Bottom-sheet confirm. Reuses the StartWorkoutPicker sheet chrome.
 * Focus starts on Cancel when tone is danger, and returns to the trigger on close.
 */
export function ConfirmPanel({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);
  onCancelRef.current = onCancel;
  busyRef.current = busy;

  useLayoutEffect(() => {
    if (!open) return undefined;
    const trigger = document.activeElement;
    const root = dialogRef.current;
    const initial = tone === "danger" ? cancelRef.current : confirmRef.current;
    // focusVisible so a keyboard open paints :focus-visible on the safe action.
    initial?.focus({ focusVisible: true });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        if (busyRef.current) return;
        event.preventDefault();
        onCancelRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const focusable = [...root.querySelectorAll("button, [href], input, select, textarea")].filter(
        (el) => !el.disabled
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open, tone]);

  if (!open || typeof document === "undefined") return null;

  const danger = tone === "danger";

  return createPortal(
    <div
      ref={dialogRef}
      className="start-workout-picker confirm-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={body ? bodyId : undefined}
    >
      <button
        type="button"
        className="start-workout-picker__backdrop"
        aria-label="Close"
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel?.();
        }}
      />
      <div className="start-workout-picker__sheet card confirm-panel__sheet">
        <div className="start-workout-picker__handle" aria-hidden="true" />
        <h2 id={titleId} className="start-workout-picker__title">
          {title}
        </h2>
        {body ? (
          <div id={bodyId} className="confirm-panel__body">
            {typeof body === "string" ? (
              <p className="muted small confirm-panel__copy">{body}</p>
            ) : (
              body
            )}
          </div>
        ) : null}
        <div className="confirm-panel__actions">
          <button
            ref={confirmRef}
            type="button"
            className={
              danger
                ? "session-discard-confirm__discard confirm-panel__confirm"
                : "btn confirm-panel__confirm"
            }
            onClick={() => onConfirm?.()}
            disabled={busy}
            aria-busy={busy || undefined}
          >
            {busy ? progressLabel(confirmLabel) : confirmLabel}
          </button>
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary confirm-panel__cancel"
            onClick={() => {
              if (!busy) onCancel?.();
            }}
            disabled={busy}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
