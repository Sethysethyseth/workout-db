import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { pickLatestActiveSession } from "../lib/activeSession.js";
import { ACTIVE_WORKOUT_ERROR, startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";
import { readCurrentProgram } from "../lib/currentProgramStorage.js";
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

  const currentProgramRef = readCurrentProgram();

  const homeTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? [...templates] : [];
    const cur = readCurrentProgram();
    if (cur?.kind === "workout") {
      const idx = list.findIndex((t) => t.id === cur.id);
      if (idx > 0) {
        const [picked] = list.splice(idx, 1);
        list.unshift(picked);
      }
    }
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
    <div className="stack home-dashboard">
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

      <div className="card stack home-welcome-card">
        <h1 style={{ marginBottom: 6 }}>Home</h1>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Signed in as {currentUser.email}
        </p>
      </div>

      <div className="card stack home-start-workout">
        <h2 className="home-start-workout__title">
          {activeSession ? "Log another workout" : "Log a workout"}
        </h2>
        <p className="muted small home-start-workout__lead">
          {activeSession
            ? "Finish or delete your in-progress session first—only one live workout at a time."
            : "Start a live session now. Everything you finish shows up in History."}
        </p>

        {quickStartError ? (
          <div className="card error">
            <strong>Cannot start workout</strong>
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

        <div className="home-start-workout__actions">
          <div className="home-action-block">
            <button
              type="button"
              className="btn home-start-workout__quick"
              onClick={() => void onQuickWorkout()}
              disabled={quickStarting || Boolean(activeSession)}
              title={
                activeSession
                  ? "Finish or leave your current workout before starting a new one."
                  : undefined
              }
            >
              {quickStarting ? "Starting…" : "Log workout"}
            </button>
            <p className="home-action-hint muted small">
              Starts with one empty exercise ready to name. One-time—won't appear in your Programs
              library.
            </p>
          </div>

          <div className="home-start-workout__from-saved home-action-block">
            <div className="row home-start-workout__from-saved-head">
              <div className="home-start-workout__from-saved-title">From saved workout</div>
              <Link className="btn btn-secondary home-start-workout__from-saved-all" to="/templates">
                All saved
              </Link>
            </div>
            {currentProgramRef?.kind === "block" ? (
              <div className="card stack home-current-block-card" style={{ marginBottom: 12 }}>
                <span className="muted small" style={{ fontWeight: 600 }}>
                  Current program (block)
                </span>
                <Link className="home-current-block-card__link" to={`/blocks/${currentProgramRef.id}/edit`}>
                  {currentProgramRef.name?.trim() || `Block #${currentProgramRef.id}`}
                </Link>
                <span className="muted small">
                  Set this in <Link to="/templates">Programs</Link> → Your library → blocks.
                </span>
              </div>
            ) : null}
            <p className="home-action-hint muted small">
              Starts a live session from a reusable workout you already built.
            </p>

            {startError ? <ErrorMessage error={startError} /> : null}
            {loading ? (
              <p className="muted small" style={{ margin: 0 }}>
                Loading saved workouts…
              </p>
            ) : homeTemplates.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>
                No saved workouts yet. Use Build for later below, then start one from here.
              </p>
            ) : (
              <ul className="home-saved-workout-list">
                {homeTemplates.map((t) => (
                  <li key={t.id} className="home-saved-workout-row">
                    <div className="home-saved-workout-row__main">
                      <span className="home-saved-workout-row__name">{t.name}</span>
                      {currentProgramRef?.kind === "workout" && currentProgramRef.id === t.id ? (
                        <span className="pill home-current-program-pill">Current</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary home-saved-workout-row__start"
                      disabled={Boolean(activeSession) || startingTemplateId === t.id}
                      onClick={() => void onStartFromTemplate(t.id)}
                      title={
                        activeSession
                          ? "Finish your current workout before starting another."
                          : undefined
                      }
                    >
                      {startingTemplateId === t.id ? "Starting…" : "Start"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="row home-from-saved-extras">
              <Link className="btn btn-secondary" to="/templates?area=community">
                Browse community programs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card stack home-build-later home-planning-card">
        <h2 className="home-build-later__title">Create programs</h2>
        <p className="muted small home-build-later__lead">
          Reusable plans only—no live session until you log a workout from above.
        </p>
        <div className="home-build-later__grid">
          <Link className="home-build-card home-build-card--featured" to="/create-template?type=block">
            <span className="home-build-card__label">Create block</span>
            <span className="home-build-card__hint muted small">
              Multi-week plan with week-by-week structure—primary way to build periodized work.
            </span>
          </Link>
          <Link className="home-build-card home-build-card--secondary" to="/create-template?type=workout">
            <span className="home-build-card__label">Create workout</span>
            <span className="home-build-card__hint muted small">
              Single reusable workout—start it from Home when you train.
            </span>
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
            No completed workouts yet. Use Log workout when you train.
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
    </div>
  );
}
