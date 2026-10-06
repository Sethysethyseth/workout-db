import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Chip } from "../blocks/ui/index.js";
import "../../styles/blocks/bk-library.css";

export function LibraryWorkoutCard({
  workout: t,
  isCurrent,
  busy,
  isActing,
  actingAction,
  onStart,
  onSetCurrent,
  onTogglePublic,
  onDelete,
}) {
  const exerciseCount = Array.isArray(t.exercises) ? t.exercises.length : 0;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const keepBtnRef = useRef(null);

  useEffect(() => {
    if (!confirmDelete) return;
    keepBtnRef.current?.focus();
  }, [confirmDelete]);

  useEffect(() => {
    if (!confirmDelete) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmDelete(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDelete]);

  return (
    <Card className="bk-lib-card">
      <div>
        <h2 className="bk-lib-card__title">{t.name}</h2>
        <p className="bk-lib-card__meta">
          {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
        </p>
        {t.description ? <p className="bk-lib-card__desc">{t.description}</p> : null}
        <div className="bk-lib-card__chips">
          <Chip tone={t.isPublic ? "accent" : "neutral"}>{t.isPublic ? "Public" : "Private"}</Chip>
          {isCurrent ? <Chip tone="good">Current</Chip> : null}
        </div>
      </div>

      {confirmDelete ? (
        <div
          className="stack session-discard-confirm bk-lib-card-confirm"
          role="alertdialog"
          aria-labelledby={`bk-lib-del-workout-title-${t.id}`}
        >
          <p
            id={`bk-lib-del-workout-title-${t.id}`}
            className="muted small session-discard-confirm__title"
          >
            Delete &ldquo;{t.name}&rdquo;? Your logged workouts stay.
          </p>
          <div className="row session-discard-confirm__actions">
            <button
              type="button"
              className="session-discard-confirm__discard"
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                onDelete(t);
              }}
            >
              {isActing && actingAction === "delete" ? "Deleting…" : "Delete workout"}
            </button>
            <button
              ref={keepBtnRef}
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Keep
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bk-lib-card__primary">
            <button
              className="bk-lib-btn bk-lib-btn--primary"
              type="button"
              onClick={() => onStart(t.id)}
              disabled={busy}
            >
              {isActing && actingAction === "start" ? "Starting…" : "Start"}
            </button>
          </div>

          <div className="bk-lib-card__secondary">
            <button
              type="button"
              className="bk-lib-btn bk-lib-btn--ghost"
              disabled={busy}
              onClick={() => onSetCurrent(t)}
            >
              Set as current
            </button>
            <Link
              className="bk-lib-btn bk-lib-btn--ghost"
              to={`/templates/${t.id}/edit`}
              tabIndex={busy ? -1 : undefined}
              aria-disabled={busy}
              style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
            >
              Edit
            </Link>
            <button
              type="button"
              className="bk-lib-btn bk-lib-btn--ghost"
              onClick={() => onTogglePublic(t)}
              disabled={busy}
            >
              {isActing && actingAction === "toggle"
                ? "Updating…"
                : t.isPublic
                  ? "Make private"
                  : "Make public"}
            </button>
            <button
              type="button"
              className="bk-lib-btn bk-lib-btn--ghost bk-lib-btn--danger"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
