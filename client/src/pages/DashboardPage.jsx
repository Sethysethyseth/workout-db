import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";

function formatSessionWhen(value) {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await sessionApi.getMySessions();
        const list = Array.isArray(data.sessions) ? data.sessions : [];
        if (!cancelled) setRecentSessions(list.slice(0, 6));
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
          Signed in as {currentUser.email}. Start training, build workouts or blocks, or jump to
          recent sessions and your library.
        </p>
      </div>

      <div className="card stack home-primary-actions">
        <h2 className="home-primary-actions__title">Start here</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Pick what you want to do — no extra steps.
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
        <div className="home-primary-actions__secondary">
          <Link className="btn btn-secondary home-primary-actions__secondary-btn" to="/create-template?type=workout">
            Create Workout
          </Link>
          <Link className="btn btn-secondary home-primary-actions__secondary-btn" to="/create-template?type=block">
            Create Block
          </Link>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Recent workouts</h2>
          <Link className="btn btn-secondary" to="/sessions">
            View all
          </Link>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Last few sessions (completed and in progress). Open one to review or keep logging.
        </p>
        {recentLoading ? (
          <p className="muted small" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : recentSessions.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            No workouts yet. Tap <strong>Start Workout</strong> above to begin.
          </p>
        ) : (
          <div className="recent-workouts-grid">
            {recentSessions.map((s) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="card recent-workout-card">
                <div className="row" style={{ alignItems: "flex-start", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>Workout #{s.id}</strong>
                  <span className="pill">{s.completedAt ? "Done" : "Active"}</span>
                </div>
                <div className="muted small" style={{ margin: 0 }}>
                  {formatSessionWhen(s.performedAt || s.startedAt)}
                </div>
                <div className="muted small" style={{ marginTop: 4, marginBottom: 0 }}>
                  {s.workoutTemplate?.name
                    ? s.workoutTemplate.name
                    : "Custom session"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h2>Your library</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            Workouts and blocks you have saved.
          </p>
          <div className="row">
            <Link className="btn btn-secondary" to="/templates">
              My programs
            </Link>
            <Link className="btn btn-secondary" to="/templates/public">
              Public programs
            </Link>
          </div>
        </div>

        <div className="card stack">
          <h2>History</h2>
          <div className="row">
            <Link className="btn btn-secondary" to="/sessions">
              Past workouts
            </Link>
          </div>
          <p className="muted small">
            Review workouts you have already finished.
          </p>
        </div>
      </div>
    </div>
  );
}
