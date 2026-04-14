import { sessionDisplayTitle, sessionQuickExerciseLabel } from "../../lib/sessionDisplay.js";

function formatStartedShort(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function startedAtMs(session) {
  const raw = session?.startedAt || session?.performedAt;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
}

export function ActiveWorkoutHero({ session, nowMs, onResume }) {
  const title = sessionDisplayTitle(session);
  const startMs = startedAtMs(session);
  const elapsed = startMs && nowMs ? formatElapsed(nowMs - startMs) : null;
  const started = formatStartedShort(session?.startedAt || session?.performedAt);
  const exercise = sessionQuickExerciseLabel(session);

  return (
    <section className="workout-hero workout-hero--active card" aria-labelledby="workout-hero-active-headline">
      <p className="workout-hero__eyebrow muted small">In progress</p>
      <h1 id="workout-hero-active-headline" className="workout-hero__headline">
        Resume workout
      </h1>
      <p className="workout-hero__session-title">{title}</p>
      <p className="workout-hero__meta muted small">
        {elapsed ? <span>{elapsed} elapsed</span> : null}
        {elapsed && started ? <span aria-hidden="true"> · </span> : null}
        {started ? <span>Started {started}</span> : null}
        {!elapsed && !started ? <span>Tap below to continue logging</span> : null}
      </p>
      {exercise ? (
        <p className="workout-hero__sublabel muted small">
          <span className="workout-hero__sublabel-key">Now</span> {exercise}
        </p>
      ) : null}
      <button type="button" className="btn workout-hero__cta" onClick={onResume}>
        Resume Workout
      </button>
    </section>
  );
}
