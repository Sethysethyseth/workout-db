import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as sessionApi from "../../api/sessionApi.js";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { sessionDisplayTitle, sessionQuickExerciseLabel } from "../../lib/sessionDisplay.js";
import { ConfirmPanel } from "../ConfirmPanel.jsx";
import "../../styles/workout-bar.css";

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

function useCompactCta() {
  const query = "(max-width: 420px)";
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setCompact(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return compact;
}

export function PersistentWorkoutBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession } = useActiveSession();
  const compactCta = useCompactCta();
  const [now, setNow] = useState(() => Date.now());
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardBusy, setDiscardBusy] = useState(false);
  const [discardError, setDiscardError] = useState(null);

  useEffect(() => {
    if (!activeSession) return;
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  const title = useMemo(() => (activeSession ? sessionDisplayTitle(activeSession) : ""), [activeSession]);
  const exercise = useMemo(
    () => (activeSession ? sessionQuickExerciseLabel(activeSession) : null),
    [activeSession]
  );
  const startMs = useMemo(() => startedAtMs(activeSession), [activeSession]);
  const elapsed = useMemo(() => {
    if (!startMs) return null;
    return formatElapsed(now - startMs);
  }, [now, startMs]);

  // Home already offers Resume on ActiveWorkoutHero - one control only.
  // Import preview sticky "Create block" sits under the bar - hide there too.
  // Coach's composer sits where the bar would, and the bar's x discards the
  // workout. Home's live card is one tap away. Query string does not matter:
  // pathname stays /coach for /coach?c=id.
  // Builder / log-focus hide via html class on the wrap (bk-builder / bk-log).
  if (
    location.pathname === "/" ||
    location.pathname === "/blocks/import" ||
    location.pathname === "/coach"
  ) {
    return null;
  }
  if (!activeSession) return null;

  // Column the bar floats over. Default is the shared .container. Library and
  // Training are narrower columns inside that container.
  const column =
    location.pathname === "/templates"
      ? "library"
      : location.pathname === "/profile/training"
        ? "training"
        : "container";

  const offerDiscard = canOfferDiscard(activeSession);
  const count = loggedSetCount(activeSession);

  async function confirmDiscard() {
    if (discardBusy) return;
    setDiscardBusy(true);
    setDiscardError(null);
    try {
      await sessionApi.discardSession(activeSession.id);
      setDiscardOpen(false);
      navigate("/", { state: { workoutDiscarded: true } });
    } catch {
      setDiscardError(DISCARD_ERROR);
      setDiscardBusy(false);
    }
  }

  return (
    <>
      <div className={`persistent-workout-bar persistent-workout-bar--${column} card card--live`}>
        <button
          type="button"
          className="persistent-workout-bar__main"
          aria-label={`Active workout: ${title}. Resume workout.`}
          onClick={() => navigate(`/sessions/${activeSession.id}`)}
        >
          <div className="persistent-workout-bar__left">
            <span className="persistent-workout-bar__eyebrow small">
              <span className="persistent-workout-bar__status">In progress</span>
              {elapsed ? (
                <span className="persistent-workout-bar__elapsed muted">{elapsed}</span>
              ) : null}
            </span>
            <span className="persistent-workout-bar__title">{title}</span>
            {exercise ? (
              <span className="persistent-workout-bar__sub muted small">{exercise}</span>
            ) : null}
          </div>
          <span className="persistent-workout-bar__cta">{compactCta ? "Resume" : "Resume workout"}</span>
        </button>
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
      </div>
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
    </>
  );
}
