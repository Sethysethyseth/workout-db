import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

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

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Past workouts</h1>
          <p className="muted">Completed and in-progress training — separate from saved workouts and blocks.</p>
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
            Nothing here yet. On <Link to="/">Home</Link>, use <strong>Start Workout</strong> to begin,
            or start from a saved template under <Link to="/templates">My programs</Link>.
          </p>
        </div>
      ) : null}

      <div className="stack">
        {sessions.map((s) => (
          <div key={s.id} className="card stack">
            <div className="row">
              <div>
                <h2 style={{ marginBottom: 6 }}>
                  <Link to={`/sessions/${s.id}`}>Workout #{s.id}</Link>
                </h2>
                <div className="muted small">Performed: {formatDate(s.performedAt)}</div>
                <div className="muted small">Started: {formatDate(s.startedAt)}</div>
              </div>
              <div className="stack" style={{ alignItems: "flex-end" }}>
                <span className="pill">{s.completedAt ? "Completed" : "Active"}</span>
                <span className="pill">
                  Sets: {s._count?.sets ?? "—"} · Exercises:{" "}
                  {s._count?.sessionExercises ?? "—"}
                </span>
              </div>
            </div>

            <div className="muted small">
              Program:{" "}
              {s.workoutTemplate
                ? `${s.workoutTemplate.name} (#${s.workoutTemplate.id})`
                : "Custom (not from a saved template)"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
