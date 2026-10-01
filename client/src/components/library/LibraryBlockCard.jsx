import { Link } from "react-router-dom";
import { Card, Chip } from "../blocks/ui/index.js";
import { blockMetaLine } from "./meta.js";
import "../../styles/blocks/bk-library.css";

export function LibraryBlockCard({
  block: t,
  isActive,
  busy,
  isActing,
  actingAction,
  onStart,
  onTogglePublic,
  onDelete,
}) {
  const isDraft = Boolean(t.isDraft);
  const meta = blockMetaLine(t);

  return (
    <Card className="bk-lib-card">
      <div>
        <h2 className="bk-lib-card__title">{t.name}</h2>
        {meta ? <p className="bk-lib-card__meta">{meta}</p> : null}
        {t.description ? <p className="bk-lib-card__desc">{t.description}</p> : null}
        <div className="bk-lib-card__chips">
          <Chip tone={t.isPublic ? "accent" : "neutral"}>{t.isPublic ? "Public" : "Private"}</Chip>
          {isDraft ? <Chip tone="warn">Draft</Chip> : null}
          {isActive ? <Chip tone="good">Running</Chip> : null}
        </div>
      </div>

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
            Running
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
          onClick={() => onDelete(t)}
          disabled={busy}
        >
          {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Card>
  );
}
