import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eyebrow } from "../ui/Eyebrow.jsx";
import { dayAfterLive } from "./dayAfterLive.js";
import { countWorkoutVolume } from "./runExerciseHelpers.js";
import "../../../styles/blocks/bk-run.css";

/**
 * Home "Up next" card - sits below card--live when both exist.
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
  onResume,
  mutedOnly = false,
  /** { weekOrder, workoutOrder } for the open live block session */
  liveDay = null,
}) {
  const navigate = useNavigate();

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
  const volume = countWorkoutVolume(workout);
  const status = day.status || "todo";
  const inProgress = status === "in_progress";

  function onBodyActivate() {
    navigate("/blocks/current");
  }

  return (
    <section
      className="bk card bk-up-next"
      aria-labelledby="bk-up-next-title"
      onClick={onBodyActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBodyActivate();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <Eyebrow>
        NEXT: W{next.weekOrder} · {(day.name || `Day ${day.order}`).toUpperCase()}
      </Eyebrow>
      <h2 id="bk-up-next-title" className="bk-up-next__title">
        {dayLabel}
      </h2>
      <p className="bk-up-next__block muted small">{block.name || "Block"}</p>
      <p className="bk-up-next__summary muted small">
        {volume.exercises} exercise{volume.exercises === 1 ? "" : "s"} · {volume.sets}{" "}
        set{volume.sets === 1 ? "" : "s"}
      </p>
      <div
        className="bk-up-next__actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn"
          disabled={starting || runId == null}
          onClick={() => {
            if (inProgress) onResume?.(next);
            else onStart?.(next);
          }}
        >
          {starting ? "Starting…" : inProgress ? "Resume" : "Start"}
        </button>
      </div>
    </section>
  );
}
