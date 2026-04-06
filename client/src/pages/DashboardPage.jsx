import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { pickLatestActiveSession } from "../lib/activeSession.js";
import { ACTIVE_WORKOUT_ERROR, startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";

function formatStartedWhen(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLoggedWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTemplateId, setStartingTemplateId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [quickStartError, setQuickStartError] = useState(null);
  const [quickStarting, setQuickStarting] = useState(false);

  const activeSession = useMemo(() => pickLatestActiveSession(sessions), [sessions]);

  const completedRecent = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions.filter((s) => s?.completedAt) : [];
    list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return list.slice(0, 5);
  }, [sessions]);

  const homeTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? [...templates] : [];
    return list.slice(0, 5);
  }, [templates]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessData, tmplData] = await Promise.all([
          sessionApi.getMySessions(),
          templateApi.getMyTemplates(),
        ]);
        if (!cancelled) {
          setSessions(Array.isArray(sessData.sessions) ? sessData.sessions : []);
          setTemplates(Array.isArray(tmplData.templates) ? tmplData.templates : []);
        }
      } catch {
        if (!cancelled) {
          setSessions([]);
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onStartFromTemplate(templateId) {
    if (activeSession) return;
    setStartError(null);
    setStartingTemplateId(templateId);
    try {
      const data = await sessionApi.startSession(templateId);
      if (data?.session?.id != null) {
        navigate(`/sessions/${data.session.id}`);
      }
    } catch (err) {
      setStartError(err);
    } finally {
      setStartingTemplateId(null);
    }
  }

  async function onQuickWorkout() {
    setQuickStartError(null);
    setQuickStarting(true);
    try {
      await startAdHocWorkoutAndNavigate(navigate, { replace: false });
    } catch (err) {
      setQuickStartError(err);
    } finally {
      setQuickStarting(false);
    }
  }

  const resumeTitle = activeSession ? sessionDisplayTitle(activeSession) : "";
  const resumeStarted = activeSession
    ? formatStartedWhen(activeSession.startedAt || activeSession.performedAt)
    : null;

  return (
    <div className="stack">
      <div className="card">
        <h1>Home</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Signed in as {currentUser.email}. Pick up a saved workout to log training, or review what you
          recently finished.
        </p>
      </div>

      {activeSession ? (
        <Link
          to={`/sessions/${activeSession.id}`}
          className="card stack home-resume-card"
          aria-label={`Resume workout: ${resumeTitle}`}
        >
          <span className="home-resume-card__eyebrow muted small">In progress</span>
          <span className="home-resume-card__title">Resume workout</span>
          <span className="home-resume-card__name">{resumeTitle}</span>
          {resumeStarted ? (
            <span className="muted small home-resume-card__meta">Started {resumeStarted}</span>
          ) : null}
          <span className="home-resume-card__cta">Continue logging →</span>
        </Link>
      ) : null}

      <div className="card stack home-primary-actions">
        <h2 className="home-primary-actions__title">
          {activeSession ? "Saved workouts" : "Start a saved workout"}
        </h2>
        <p className="muted home-primary-actions__lead">
          {activeSession
            ? "Finish your current session before starting another from here. You can still edit templates under My programs."
            : "Use a template you have saved—exercises and targets load so you can log sets quickly."}
        </p>
        {startError ? <ErrorMessage error={startError} /> : null}
        {loading ? (
          <p className="muted small" style={{ margin: 0 }}>
            Loading saved workouts…
          </p>
        ) : homeTemplates.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            No saved workouts yet. Create one below, then come back here to log it.
          </p>
        ) : (
          <ul className="home-saved-workout-list">
            {homeTemplates.map((t) => (
              <li key={t.id} className="home-saved-workout-row">
                <div className="home-saved-workout-row__main">
                  <span className="home-saved-workout-row__name">{t.name}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary home-saved-workout-row__start"
                  disabled={Boolean(activeSession) || startingTemplateId === t.id}
                  onClick={() => void onStartFromTemplate(t.id)}
                >
                  {startingTemplateId === t.id ? "Starting…" : "Start"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <Link className="btn btn-secondary" to="/templates">
            All saved workouts
          </Link>
          <Link className="btn btn-secondary" to="/templates/public">
            Public programs
          </Link>
        </div>
      </div>

      <div className="card stack home-planning-card">
        <h2 style={{ marginTop: 0 }}>Create</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Plan reusable workouts and multi-week blocks—not a live logging session.
        </p>
        <div className="row" style={{ flexWrap: "wrap", gap: "10px", justifyContent: "flex-start" }}>
          <Link className="btn btn-secondary" to="/create-template?type=workout">
            New workout template
          </Link>
          <Link className="btn btn-secondary" to="/create-template?type=block">
            New block
          </Link>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Recently logged</h2>
          <Link className="btn btn-secondary" to="/sessions">
            Full history
          </Link>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Completed workouts—what you trained and when.
        </p>
        {loading ? (
          <p className="muted small" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : completedRecent.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            No completed workouts yet. Start a saved workout above when you are ready to log.
          </p>
        ) : (
          <ul className="recent-activity-list">
            {completedRecent.map((s) => {
              const when = formatLoggedWhen(s.completedAt);
              const title = sessionDisplayTitle(s);
              return (
                <li key={s.id}>
                  <Link to={`/sessions/${s.id}`} className="recent-activity-row">
                    <div className="recent-activity-row__main">
                      <span className="recent-activity-row__title">{title}</span>
                      <span className="muted small recent-activity-row__when">Finished {when}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card stack home-secondary-links">
        <h2 style={{ marginTop: 0 }}>More</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Blank session if you are not using a template (one in-progress workout at a time).
        </p>
        {quickStartError ? (
          <div className="card error">
            <strong>Cannot start blank workout</strong>
            <div className="mt-2">
              {quickStartError.code === ACTIVE_WORKOUT_ERROR && quickStartError.activeSessionId ? (
                <>
                  {quickStartError.message}{" "}
                  <Link to={`/sessions/${quickStartError.activeSessionId}`}>Resume your workout</Link>
                </>
              ) : (
                quickStartError.message || String(quickStartError)
              )}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost home-quick-workout-btn"
          onClick={() => void onQuickWorkout()}
          disabled={quickStarting || Boolean(activeSession)}
          title={
            activeSession
              ? "Finish or leave your current workout before starting a blank one."
              : undefined
          }
        >
          {quickStarting ? "Starting…" : "Log without a template"}
        </button>
      </div>
    </div>
  );
}
