import { useState } from "react";
import * as sessionApi from "../../api/sessionApi.js";
import { ConfirmPanel } from "../ConfirmPanel.jsx";
import {
  blockDayPrimaryTitle,
  sessionDisplayBlockName,
  sessionDisplayTitle,
  sessionQuickExerciseLabel,
} from "../../lib/sessionDisplay.js";

const DISCARD_ERROR = "Couldn't discard. Check your connection and try again.";

function canOfferDiscard(session) {
  return Boolean(session) && !session.completedAt && session.reopenedAt == null;
}

function loggedSetCount(session) {
  if (Array.isArray(session?.sets)) return session.sets.length;
  const n = Number(session?._count?.sets);
  return Number.isFinite(n) ? n : 0;
}

function discardBody(count) {
  if (!count) return "Nothing has been logged yet.";
  const noun = count === 1 ? "set" : "sets";
  return `Your ${count} logged ${noun} will be deleted. This can't be undone.`;
}

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
export function ActiveWorkoutHero({ session, nowMs, onResume, setsProgress = null, onDiscarded }) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardBusy, setDiscardBusy] = useState(false);
  const [discardError, setDiscardError] = useState(null);
  const offerDiscard = canOfferDiscard(session);
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

  async function confirmDiscard() {
    if (discardBusy || !session?.id) return;
    setDiscardBusy(true);
    setDiscardError(null);
    try {
      await sessionApi.discardSession(session.id);
      setDiscardOpen(false);
      onDiscarded?.();
    } catch {
      setDiscardError(DISCARD_ERROR);
      setDiscardBusy(false);
    }
  }

  const count = loggedSetCount(session);

  return (
    <section
      className="workout-hero workout-hero--active card card--notched card--live"
      aria-labelledby="workout-hero-active-headline"
    >
      {offerDiscard ? (
        <button
          type="button"
          className="session-discard-x confirm-discard-x"
          aria-label="Discard workout"
          onClick={() => {
            setDiscardError(null);
            setDiscardOpen(true);
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
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
      <ConfirmPanel
        open={discardOpen}
        tone="danger"
        title="Discard this workout?"
        body={
          <>
            <p className="muted small confirm-panel__copy">{discardBody(count)}</p>
            {discardError ? (
              <p className="confirm-panel__error" role="alert">
                {discardError}
              </p>
            ) : null}
          </>
        }
        confirmLabel="Discard workout"
        cancelLabel="Keep workout"
        busy={discardBusy}
        onConfirm={() => void confirmDiscard()}
        onCancel={() => {
          if (!discardBusy) setDiscardOpen(false);
        }}
      />
    </section>
  );
}
