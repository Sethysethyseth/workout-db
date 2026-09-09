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

function formatWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
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

  /* Newest activity first, grouped by month so a long history scans by
     eye instead of by scrolling. */
  const groups = useMemo(() => {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    list.sort(compareSessionsByRecentActivity);
    const out = [];
    for (const s of list) {
      const key = monthKey(sessionActivityTimestamp(s));
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(s);
      else out.push({ key, items: [s] });
    }
    return out;
  }, [sessions]);

  const completedCount = sessions.filter((s) => s?.completedAt).length;

  return (
    <div className="stack sessions-page">
      <div className="row">
        <div>
          <h1 className="page-title">History</h1>
          <p className="muted sessions-intro">
            {loading && sessions.length === 0
              ? "Every session you started or finished."
              : completedCount === 1
                ? "1 finished workout so far."
                : `${completedCount} finished workouts so far.`}
          </p>
        </div>
        <button className="btn btn-secondary btn--toolbar" type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />
      {loading && sessions.length === 0 ? (
        <LoadingState tone="skeleton" variant="list" rows={4} slowLabel="Waking up the server…" />
      ) : null}

      {!loading && sessions.length === 0 ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            Nothing yet. Open <Link to="/">Workout</Link> to start, or pick a saved program.
          </p>
        </div>
      ) : null}

      {groups.map((group) => (
        <section key={group.key} className="history-group" aria-label={group.key}>
          <h2 className="history-group__label">{group.key}</h2>
          <div className="card history-list">
            {group.items.map((s) => {
              const title = sessionDisplayTitle(s);
              const live = !s.completedAt;
              const sets = s._count?.sets ?? "—";
              const exercises = s._count?.sessionExercises ?? "—";
              return (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  className={`history-row${live ? " history-row--live" : ""}`}
                >
                  <span className="history-row__main">
                    <span className="history-row__title">{title}</span>
                    <span className="history-row__meta muted small">
                      {formatWhen(sessionActivityTimestamp(s))}
                      <span aria-hidden="true"> · </span>
                      {exercises} {exercises === 1 ? "exercise" : "exercises"}
                      <span aria-hidden="true"> · </span>
                      {sets} {sets === 1 ? "set" : "sets"}
                      {s.workoutTemplate ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          from {s.workoutTemplate.name}
                        </>
                      ) : null}
                    </span>
                  </span>
                  <span className={`history-row__status${live ? " history-row__status--live" : ""}`}>
                    {live ? "In progress" : "Done"}
                  </span>
                  <span className="history-row__chevron" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
