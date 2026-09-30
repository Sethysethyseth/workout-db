import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";

/**
 * Empty state when no block run is active.
 */
export function RunEmptyState({
  blocks = [],
  startingId = null,
  onStart,
}) {
  const startable = (blocks || []).filter((b) => !b.isDraft);

  return (
    <div className="bk-run-empty">
      <h2 className="bk-run-empty__title">No block running</h2>
      <p className="bk-run-empty__lede muted">
        Start a block from your library to train week by week.
      </p>

      {startable.length > 0 ? (
        <ul className="bk-run-empty__list">
          {startable.map((b) => {
            const weeks = Array.isArray(b.weeks) ? b.weeks.length : 0;
            const days = (b.weeks || []).reduce(
              (acc, w) => acc + (Array.isArray(w.workouts) ? w.workouts.length : 0),
              0
            );
            return (
              <li key={b.id}>
                <Card className="bk-run-empty__card">
                  <div className="bk-run-empty__card-body">
                    <h3 className="bk-run-empty__name">{b.name || `Block #${b.id}`}</h3>
                    <p className="bk-run-empty__meta muted small">
                      {weeks} week{weeks === 1 ? "" : "s"} · {days} day
                      {days === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    disabled={startingId != null}
                    onClick={() => onStart?.(b)}
                  >
                    {startingId === b.id ? "Starting…" : "Start"}
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted small">No saved blocks yet.</p>
      )}

      <div className="bk-run-empty__links">
        <Link className="btn btn-secondary" to="/create-template?type=block">
          Build a block
        </Link>
        <Link className="btn btn-secondary" to="/blocks/import">
          Import a block
        </Link>
      </div>
    </div>
  );
}
