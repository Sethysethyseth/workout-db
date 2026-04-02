import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import {
  compareSessionsByRecentActivity,
  sessionActivityTimestamp,
  sessionDisplayTitle,
} from "../lib/sessionDisplay.js";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionApi.getMySessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sortedSessions = useMemo(() => {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    list.sort(compareSessionsByRecentActivity);
    return list;
  }, [sessions]);

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>History</h1>
          <p className="muted">
            Your logbook: every workout session you have started or completed. This is not your
            saved programs—those live under My programs.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />
      {loading ? <LoadingState /> : null}

      {!loading && sessions.length === 0 ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            Nothing logged yet. On <Link to="/">Home</Link>, use <strong>Start Workout</strong> to log
            right away, or start from a saved template on <Link to="/templates">My programs</Link>.
          </p>
        </div>
      ) : null}

      <div className="stack">
        {sortedSessions.map((s) => {
          const title = sessionDisplayTitle(s);
          return (
            <div key={s.id} className="card stack">
              <div className="row">
                <div>
                  <h2 style={{ marginBottom: 6 }}>
                    <Link to={`/sessions/${s.id}`}>{title}</Link>
                  </h2>
                  <div className="muted small">Session #{s.id}</div>
                  <div className="muted small">
                    Last activity: {formatDate(sessionActivityTimestamp(s))}
                  </div>
                  <div className="muted small">Started: {formatDate(s.startedAt)}</div>
                </div>
                <div className="stack" style={{ alignItems: "flex-end" }}>
                  <span className="pill">{s.completedAt ? "Completed" : "In progress"}</span>
                  <span className="pill">
                    Sets: {s._count?.sets ?? "—"} · Exercises:{" "}
                    {s._count?.sessionExercises ?? "—"}
                  </span>
                </div>
              </div>

              <div className="muted small">
                {s.workoutTemplate ? (
                  <>Logged from a saved workout template in My programs.</>
                ) : (
                  <>Quick session—not started from a saved template.</>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
