import {
  blockDayPrimaryTitle,
  sessionDisplayBlockName,
  sessionDisplayTitle,
  sessionQuickExerciseLabel,
} from "../../lib/sessionDisplay.js";

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

/**
 * @param {{ logged: number, planned: number } | null | undefined} setsProgress
 */
export function ActiveWorkoutHero({ session, nowMs, onResume, setsProgress = null }) {
  const blockDayLabel = blockDayPrimaryTitle(session);
  const isBlockDay = blockDayLabel != null;
  const title = isBlockDay ? blockDayLabel : sessionDisplayTitle(session);
  const blockName = sessionDisplayBlockName(session);
  const startMs = startedAtMs(session);
  const elapsed = startMs && nowMs ? formatElapsed(nowMs - startMs) : null;
  const started = formatStartedShort(session?.startedAt || session?.performedAt);
  const exercise = sessionQuickExerciseLabel(session);

  const planned =
    setsProgress?.planned != null && Number(setsProgress.planned) > 0
      ? Number(setsProgress.planned)
      : null;
  const logged =
    planned != null && setsProgress?.logged != null
      ? Math.max(0, Number(setsProgress.logged) || 0)
      : null;
  const ratio = planned != null && logged != null ? Math.min(1, logged / planned) : null;

  return (
    <section
      className="workout-hero workout-hero--active card card--notched card--live"
      aria-labelledby="workout-hero-active-headline"
    >
      <p className="workout-hero__eyebrow muted small">In progress</p>
      <h1 id="workout-hero-active-headline" className="workout-hero__headline">
        Resume workout
      </h1>
      <p className="workout-hero__session-title">{title}</p>
      {blockName ? (
        <p className="workout-hero__session-block muted small">{blockName}</p>
      ) : null}
      {planned != null && logged != null ? (
        <div className="workout-hero__sets">
          <p className="workout-hero__sets-label muted small">
            {`${logged} of ${planned} sets logged`}
          </p>
          <div
            className="workout-hero__sets-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={planned}
            aria-valuenow={logged}
            aria-label={`${logged} of ${planned} sets logged`}
          >
            <span
              className="workout-hero__sets-fill"
              style={{ width: `${Math.round((ratio ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
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
        Resume workout
      </button>
    </section>
  );
}
