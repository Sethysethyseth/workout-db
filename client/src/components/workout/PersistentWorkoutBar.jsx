import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveSession } from "../../context/ActiveSessionContext.jsx";
import { sessionDisplayTitle, sessionQuickExerciseLabel } from "../../lib/sessionDisplay.js";

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

export function PersistentWorkoutBar() {
  const navigate = useNavigate();
  const { activeSession } = useActiveSession();
  const [now, setNow] = useState(() => Date.now());

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

  if (!activeSession) return null;

  return (
    <button
      type="button"
      className="persistent-workout-bar card"
      aria-label={`Active workout: ${title}. Resume.`}
      onClick={() => navigate(`/sessions/${activeSession.id}`)}
    >
      <div className="persistent-workout-bar__left">
        <span className="persistent-workout-bar__eyebrow muted small">
          In progress{elapsed ? ` · ${elapsed}` : ""}
        </span>
        <span className="persistent-workout-bar__title">{title}</span>
        {exercise ? <span className="persistent-workout-bar__sub muted small">{exercise}</span> : null}
      </div>
      <span className="persistent-workout-bar__cta">Resume</span>
    </button>
  );
}

