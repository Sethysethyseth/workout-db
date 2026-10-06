import { useMemo } from "react";
import { Link } from "react-router-dom";
import { dayAfterLive } from "./dayAfterLive.js";
import { countWorkoutVolume, mapApiExerciseForRun } from "./runExerciseHelpers.js";
import "../../../styles/blocks/bk-run.css";

function weekStripState(weeks, currentWeekOrder) {
  const list = Array.isArray(weeks) ? weeks : [];
  const current =
    currentWeekOrder != null && Number.isFinite(Number(currentWeekOrder))
      ? Number(currentWeekOrder)
      : null;
  return list.map((week) => {
    const order = Number(week.order);
    if (current == null) {
      return { order, state: "future" };
    }
    if (order < current) return { order, state: "done" };
    if (order === current) return { order, state: "current" };
    return { order, state: "future" };
  });
}

function exerciseLine(workout) {
  const exercises = Array.isArray(workout?.exercises) ? workout.exercises : [];
  const names = exercises
    .map((ex) => {
      const mapped = mapApiExerciseForRun(ex);
      return String(mapped.exerciseName || "").trim();
    })
    .filter(Boolean);
  const shown = names.slice(0, 4);
  const extra = Math.max(0, names.length - shown.length);
  const volume = countWorkoutVolume(workout);
  return { shown, extra, sets: volume.sets };
}

/**
 * Home "Up next" card - sits below the log hero when a run is active.
 * Never uses card--live (that means an in-progress workout only).
 * When mutedOnly (live workout on Home): one muted line naming the day
 * AFTER the live block day, or nothing if none remain.
 */
export function UpNextCard({
  block,
  progress,
  runId,
  starting = false,
  onStart,
  mutedOnly = false,
  /** { weekOrder, workoutOrder } for the open live block session */
  liveDay = null,
}) {
  const afterLive = useMemo(() => {
    if (!mutedOnly) return null;
    return dayAfterLive(progress, liveDay);
  }, [mutedOnly, progress, liveDay]);

  if (mutedOnly) {
    if (!afterLive || !block) return null;
    const dayLabel = `W${afterLive.weekOrder} · ${
      afterLive.name || `Day ${afterLive.workoutOrder}`
    }`;
    return (
      <p className="bk-up-next-muted muted small" role="status">
        Up next after this: {dayLabel}
      </p>
    );
  }

  const next = progress?.nextDay;
  if (!next || !block) return null;

  const week = (progress.weeks || []).find((w) => w.order === next.weekOrder);
  const day = (week?.days || []).find((d) => d.order === next.workoutOrder);
  if (!day) return null;

  const dayLabel = `W${next.weekOrder} · ${day.name || `Day ${day.order}`}`;

  const blockWeek = (block.weeks || []).find((w) => w.order === next.weekOrder);
  const workout = (blockWeek?.workouts || []).find((w) => w.order === next.workoutOrder);
  const { shown, extra, sets } = exerciseLine(workout);
  const weeksTotal = Array.isArray(progress.weeks) ? progress.weeks.length : 0;
  const weekOf =
    progress.currentWeekOrder != null
      ? Number(progress.currentWeekOrder)
      : Number(next.weekOrder);
  const strip = weekStripState(progress.weeks, weekOf);

  return (
    <section className="card bk-up-next" aria-labelledby="bk-up-next-title">
      <div className="bk-up-next__top">
        <p className="bk-up-next__eyebrow">NEXT IN YOUR BLOCK</p>
        <Link className="bk-up-next__view" to="/blocks/current">
          View block ›
        </Link>
      </div>
      <h2 id="bk-up-next-title" className="bk-up-next__title">
        {dayLabel}
      </h2>
      <p className="bk-up-next__block muted small">
        {block.name || "Block"}
        {weeksTotal > 0 ? ` · Week ${weekOf} of ${weeksTotal}` : ""}
      </p>
      {strip.length > 0 ? (
        <div
          className="bk-up-next__strip"
          role="img"
          aria-label={`Week ${weekOf} of ${weeksTotal}`}
        >
          {strip.map((seg) => (
            <span
              key={seg.order}
              className={`bk-up-next__seg bk-up-next__seg--${seg.state}`}
            />
          ))}
        </div>
      ) : null}
      {shown.length > 0 || sets > 0 ? (
        <p className="bk-up-next__exercises muted small">
          {shown.length > 0 ? (
            <span className="bk-up-next__ex-names">{shown.join(", ")}</span>
          ) : null}
          <span className="bk-up-next__ex-more">
            {extra > 0 ? `+${extra} · ${sets} sets` : `${sets} sets`}
          </span>
        </p>
      ) : null}
      <button
        type="button"
        className="btn bk-up-next__start"
        disabled={starting || runId == null}
        onClick={() => onStart?.(next)}
      >
        {starting ? "Starting..." : `Start ${dayLabel}`}
      </button>
    </section>
  );
}
