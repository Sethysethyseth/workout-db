import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";
import {
  compareSessionsByRecentActivity,
  sessionActivityTimestamp,
  sessionDisplayTitle,
} from "../lib/sessionDisplay.js";

function formatSessionWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [startWorkoutError, setStartWorkoutError] = useState(null);

  async function onStartWorkout() {
    setStartWorkoutError(null);
    setStartingWorkout(true);
    try {
      await startAdHocWorkoutAndNavigate(navigate, { replace: false });
    } catch (err) {
      setStartWorkoutError(err);
    } finally {
      setStartingWorkout(false);
    }
  }

  const topRecent = useMemo(() => {
    const list = Array.isArray(recentSessions) ? [...recentSessions] : [];
    list.sort(compareSessionsByRecentActivity);
    return list.slice(0, 3);
  }, [recentSessions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await sessionApi.getMySessions();
        const list = Array.isArray(data.sessions) ? data.sessions : [];
        if (!cancelled) setRecentSessions(list);
      } catch {
        if (!cancelled) setRecentSessions([]);
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stack">
      <div className="card">
        <h1>Home</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Signed in as {currentUser.email}. Start a live session to log sets now, or build saved
          workouts and blocks under My programs.
        </p>
      </div>

      <div className="card stack home-primary-actions">
        <h2 className="home-primary-actions__title">Log a workout</h2>
        <p className="muted home-primary-actions__lead">
          Starts an empty session right away so you can add exercises and sets—fastest way to train
          without a saved program.
        </p>
        <button
          type="button"
          className="btn home-primary-actions__start"
          onClick={() => void onStartWorkout()}
          disabled={startingWorkout}
        >
          {startingWorkout ? "Starting…" : "Start Workout"}
        </button>
        <ErrorMessage error={startWorkoutError} />

        <div className="home-planning-actions stack">
          <p className="home-planning-actions__label muted small" style={{ margin: 0 }}>
            Plan reusable templates (not a live session)
          </p>
          <div className="home-planning-actions__buttons row">
            <Link className="btn btn-secondary home-planning-actions__btn" to="/create-template?type=workout">
              Create Workout
            </Link>
            <Link className="btn btn-secondary home-planning-actions__btn" to="/create-template?type=block">
              Create Block
            </Link>
          </div>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Recent activity</h2>
          <Link className="btn btn-secondary" to="/sessions">
            Full history
          </Link>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Your latest sessions—open one to keep logging or review what you did.
        </p>
        {recentLoading ? (
          <p className="muted small" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : topRecent.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            No sessions yet. Use <strong>Start Workout</strong> above to log your first one.
          </p>
        ) : (
          <ul className="recent-activity-list">
            {topRecent.map((s) => {
              const when = formatSessionWhen(sessionActivityTimestamp(s));
              const title = sessionDisplayTitle(s);
              return (
                <li key={s.id}>
                  <Link to={`/sessions/${s.id}`} className="recent-activity-row">
                    <div className="recent-activity-row__main">
                      <span className="recent-activity-row__title">{title}</span>
                      <span className="muted small recent-activity-row__when">{when}</span>
                    </div>
                    <span className="pill">{s.completedAt ? "Completed" : "In progress"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h2>My programs</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Saved workout templates and multi-week blocks—plans you reuse, not past sessions.
          </p>
          <div className="row">
            <Link className="btn btn-secondary" to="/templates">
              Open My programs
            </Link>
            <Link className="btn btn-secondary" to="/templates/public">
              Public programs
            </Link>
          </div>
        </div>

        <div className="card stack">
          <h2>History</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Logbook of workouts you have performed—every logged session in one place.
          </p>
          <Link className="btn btn-secondary" to="/sessions">
            Open History
          </Link>
        </div>
      </div>
    </div>
  );
}
