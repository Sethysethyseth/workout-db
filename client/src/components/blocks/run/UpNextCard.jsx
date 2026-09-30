import { useNavigate } from "react-router-dom";
import { Eyebrow } from "../ui/Eyebrow.jsx";
import { countWorkoutVolume } from "./runExerciseHelpers.js";
import "../../../styles/blocks/bk-run.css";

/**
 * Home "Up next" card - sits below card--live when both exist.
 * Never uses card--live (that means an in-progress workout only).
 */
export function UpNextCard({
  block,
  progress,
  runId,
  starting = false,
  onStart,
  onResume,
}) {
  const navigate = useNavigate();
  const next = progress?.nextDay;
  if (!next || !block) return null;

  const week = (progress.weeks || []).find((w) => w.order === next.weekOrder);
  const day = (week?.days || []).find((d) => d.order === next.workoutOrder);
  if (!day) return null;

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
        UP NEXT · {(block.name || "BLOCK").toUpperCase()}
      </Eyebrow>
      <h2 id="bk-up-next-title" className="bk-up-next__title">
        W{next.weekOrder} · {day.name || `Day ${day.order}`}
      </h2>
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
