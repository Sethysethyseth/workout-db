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
          onClick={() => onDelete(t)}
          disabled={busy}
        >
          {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Card>
  );
}
