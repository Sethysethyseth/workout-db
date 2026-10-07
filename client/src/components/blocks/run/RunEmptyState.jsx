import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";

function leftOffLabel(leftOff) {
  if (!leftOff?.nextDay) return null;
  const weekOrder = leftOff.nextDay.weekOrder;
  const dayName = leftOff.dayName || `Day ${leftOff.nextDay.workoutOrder}`;
  return `W${weekOrder} · ${dayName}`;
}

/**
 * Empty state when no block run is active.
 */
export function RunEmptyState({
  blocks = [],
  leftOffByBlockId = {},
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
            const firstWeekDays = Array.isArray(b.weeks?.[0]?.workouts)
              ? b.weeks[0].workouts.length
              : 0;
            const leftOffLine = leftOffLabel(leftOffByBlockId[b.id]);
            return (
              <li key={b.id}>
                <Card className="bk-run-empty__card">
                  <div className="bk-run-empty__card-body">
                    <h3 className="bk-run-empty__name">{b.name || `Block #${b.id}`}</h3>
                    <p className="bk-run-empty__meta muted small">
                      {weeks} week{weeks === 1 ? "" : "s"} · {firstWeekDays} day
                      {firstWeekDays === 1 ? "" : "s"} a week
                    </p>
                    {leftOffLine ? (
                      <p className="bk-run-empty__left-off muted small">
                        Left off at {leftOffLine}
                      </p>
                    ) : null}
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
