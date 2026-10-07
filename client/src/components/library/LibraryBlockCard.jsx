import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Chip } from "../blocks/ui/index.js";
import { blockMetaLine } from "./meta.js";
import "../../styles/blocks/bk-library.css";

function leftOffLabel(leftOff) {
  if (!leftOff?.nextDay) return null;
  const weekOrder = leftOff.nextDay.weekOrder;
  const dayName = leftOff.dayName || `Day ${leftOff.nextDay.workoutOrder}`;
  return `W${weekOrder} · ${dayName}`;
}

export function LibraryBlockCard({
  block: t,
  isActive,
  leftOff = null,
  busy,
  isActing,
  actingAction,
  onStart,
  onTogglePublic,
  onDelete,
}) {
  const isDraft = Boolean(t.isDraft);
  const meta = blockMetaLine(t);
  const leftOffLine = !isActive && !isDraft ? leftOffLabel(leftOff) : null;
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
        {meta ? <p className="bk-lib-card__meta">{meta}</p> : null}
        {leftOffLine ? (
          <p className="bk-lib-card__left-off muted small">Left off at {leftOffLine}</p>
        ) : null}
        {t.description ? <p className="bk-lib-card__desc">{t.description}</p> : null}
        <div className="bk-lib-card__chips">
          <Chip tone={t.isPublic ? "accent" : "neutral"}>{t.isPublic ? "Public" : "Private"}</Chip>
          {isDraft ? <Chip tone="warn">Draft</Chip> : null}
          {isActive ? <Chip tone="good">Running</Chip> : null}
        </div>
      </div>

      {confirmDelete ? (
        <div
          className="stack session-discard-confirm bk-lib-card-confirm"
          role="alertdialog"
          aria-labelledby={`bk-lib-del-block-title-${t.id}`}
        >
          <p
            id={`bk-lib-del-block-title-${t.id}`}
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
              {isActing && actingAction === "delete" ? "Deleting…" : "Delete block"}
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
            {isDraft ? (
              <Link
                className="bk-lib-btn bk-lib-btn--primary"
                to={`/blocks/${t.id}/edit`}
                tabIndex={busy ? -1 : undefined}
                aria-disabled={busy}
                style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
              >
                Review
              </Link>
            ) : isActive ? (
              <Link
                className="bk-lib-btn bk-lib-btn--primary"
                to="/blocks/current"
                tabIndex={busy ? -1 : undefined}
                aria-disabled={busy}
                style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
              >
                Open
              </Link>
            ) : (
              <button
                type="button"
                className="bk-lib-btn bk-lib-btn--primary"
                disabled={busy}
                onClick={() => void onStart(t)}
              >
                {isActing && actingAction === "start-block" ? "Starting…" : "Start"}
              </button>
            )}
          </div>

          <div className="bk-lib-card__secondary">
            {!isDraft ? (
              <Link
                className="bk-lib-btn bk-lib-btn--ghost"
                to={`/blocks/${t.id}/edit`}
                tabIndex={busy ? -1 : undefined}
                aria-disabled={busy}
                style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
              >
                Edit
              </Link>
            ) : null}
            <button
              type="button"
              className="bk-lib-btn bk-lib-btn--ghost"
              onClick={() => onTogglePublic(t)}
              disabled={busy || isDraft}
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
