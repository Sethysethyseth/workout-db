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

function dateParts(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { day: "—", weekday: "", time: "" };
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
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
  const totalSets = sessions.reduce((sum, s) => sum + (s?._count?.sets ?? 0), 0);

  return (
    <div className="stack sessions-page">
      <div className="row page-head">
        <div>
          <h1 className="page-title">History</h1>
          <p className="muted sessions-intro">
            {loading && sessions.length === 0
              ? "Every session you started or finished."
              : completedCount === 0
                ? "Nothing finished yet."
                : `${completedCount} finished ${completedCount === 1 ? "workout" : "workouts"} · ${totalSets} sets logged`}
          </p>
        </div>
        <button className="btn btn-secondary btn--toolbar" type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />
      {loading && sessions.length === 0 ? (
        <LoadingState tone="skeleton" variant="list" rows={4} slowLabel="Taking longer than usual…" />
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
          <h2 className="history-group__label">
            <span>{group.key}</span>
            <span className="history-group__count">
              {group.items.length} {group.items.length === 1 ? "workout" : "workouts"}
            </span>
          </h2>
          <div className="card history-list">
            {group.items.map((s) => {
              const title = sessionDisplayTitle(s);
              const live = !s.completedAt;
              const sets = s._count?.sets ?? "—";
              const exercises = s._count?.sessionExercises ?? "—";
              const when = dateParts(sessionActivityTimestamp(s));
              return (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  className={`history-row${live ? " history-row--live" : ""}`}
                >
                  <span className="history-row__date" aria-hidden="true">
                    <span className="history-row__weekday">{when.weekday}</span>
                    <span className="history-row__day">{when.day}</span>
                  </span>
                  <span className="history-row__main">
                    <span className="history-row__title">{title}</span>
                    <span className="history-row__meta muted small">
                      {when.time}
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
                  {live ? (
                    <span className="history-row__status history-row__status--live">In progress</span>
                  ) : (
                    <span className="history-row__done" title="Finished">
                      <CheckIcon />
                    </span>
                  )}
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
