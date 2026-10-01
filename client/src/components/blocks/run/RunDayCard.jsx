import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";
import { Chip } from "../ui/Chip.jsx";
import { Disclosure } from "../ui/Disclosure.jsx";
import { ExerciseRx } from "../ui/ExerciseRx.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import {
  exerciseRxSummary,
  mapApiExerciseForRun,
  slotBadge,
} from "./runExerciseHelpers.js";
import { dayLoggedFraction } from "./dayStatusTiles.js";
import "../../../styles/blocks/bk-run.css";

/**
 * Selected-day card on /blocks/current: chips, rx list, Start/Resume/View.
 */
export function RunDayCard({
  weekOrder,
  day,
  exercises = [],
  effort = "none",
  unit = "lb",
  starting = false,
  onStart,
  onResume,
  onView,
  onTrainAgain,
}) {
  const status = day?.status || "todo";
  const name = day?.name || `Day ${day?.order ?? ""}`;
  const order = day?.order ?? 1;

  const rows = exercises.map((raw, i) => {
    const mapped = mapApiExerciseForRun(raw);
    const summary = exerciseRxSummary(mapped, { effort, unit });
    return { mapped, summary, index: i };
  });
  const exCount = rows.length;
  const setCount = rows.reduce((acc, row) => acc + (row.mapped.sets?.length || 0), 0);

  return (
    <Card className="bk-run-day">
      <p className="bk-run-day__eyebrow">
        W{weekOrder} · DAY {order}
      </p>
      <h2 className="bk-run-day__name">{name}</h2>

      <div className="bk-run-day__chips">
        <Chip>
          {exCount} EXERCISE{exCount === 1 ? "" : "S"}
        </Chip>
        <Chip>
          {setCount} SET{setCount === 1 ? "" : "S"}
        </Chip>
        {status === "done" ? <Chip tone="good">DONE</Chip> : null}
        {status === "in_progress" ? <Chip tone="accent">IN PROGRESS</Chip> : null}
      </div>

      <DayProgressMeter status={status} day={day} />

      <div className="bk-run-day__actions">
        {status === "todo" ? (
          <button type="button" className="btn" disabled={starting} onClick={onStart}>
            {starting ? "Starting…" : "Start workout"}
          </button>
        ) : null}
        {status === "in_progress" ? (
          <button type="button" className="btn" disabled={starting} onClick={onResume}>
            {starting ? "Opening…" : "Resume workout"}
          </button>
        ) : null}
        {status === "done" ? (
          <>
            <button type="button" className="btn" disabled={starting} onClick={onView}>
              View workout
            </button>
            <button
              type="button"
              className="btn btn-ghost bk-run-day__again"
              disabled={starting}
              onClick={onTrainAgain}
            >
              {starting ? "Starting…" : "Train it again"}
            </button>
          </>
        ) : null}
      </div>

      <ul className="bk-run-day__ex-list">
        {rows.map(({ mapped, summary, index }) => (
          <li key={mapped.id || index} className="bk-run-ex">
            <div className="bk-run-ex__top">
              <span className="bk-run-ex__slot">{slotBadge(index)}</span>
            </div>
            <h3 className="bk-run-ex__name">{mapped.exerciseName || "Untitled"}</h3>
            {summary.uniform ? (
              <ExerciseRx rx={summary.rx} />
            ) : (
              <p className="bk-rx bk-rx--summary">{summary.summary}</p>
            )}
            {mapped.notes ? (
              <Disclosure summary="Coach note">
                <p className="bk-run-ex__notes">{mapped.notes}</p>
              </Disclosure>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Honest day progress: real fraction when counts exist; otherwise a distinct
 * visual in-progress meter (no duplicate "IN PROGRESS" label - chip owns that).
 */
function DayProgressMeter({ status, day }) {
  if (status === "done") {
    return <ProgressBar value={1} label="Day progress 100%" />;
  }
  if (status === "todo") {
    return <ProgressBar value={0} label="Day progress 0%" />;
  }

  const realFrac = dayLoggedFraction(day);
  if (realFrac != null) {
    return (
      <ProgressBar
        value={realFrac}
        label={`Day progress ${Math.round(realFrac * 100)}%`}
      />
    );
  }

  // Chip already shows "IN PROGRESS" once; meter is visual-only here.
  return (
    <div
      className="bk-run-day__live-meter"
      role="status"
      aria-label="In progress"
    >
      <span className="bk-run-day__live-track" aria-hidden="true">
        <span className="bk-run-day__live-arc" />
        <span className="bk-run-day__live-dot" />
      </span>
    </div>
  );
}

/** Quiet edit-block link for StickyHeader right slot. */
export function EditBlockLink({ blockId }) {
  if (blockId == null) return null;
  return (
    <Link className="bk-run-edit-link" to={`/blocks/${blockId}/edit`}>
      Edit block
    </Link>
  );
}
