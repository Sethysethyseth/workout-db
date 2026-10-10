import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CoachConversationList } from "../components/library/CoachConversationList.jsx";
import { SlidingIndicator } from "../components/motion/SlidingIndicator.jsx";
import { captureFlip, peekFlip, playCapturedSurface } from "../components/motion/useFlip.js";
import { peekHistorySessions, putHistorySessions } from "../lib/historySessionCache.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { formatRepsValue } from "../lib/repsDisplay.js";
import {
  compareSessionsByRecentActivity,
  sessionActivityTimestamp,
  sessionDisplayTitle,
} from "../lib/sessionDisplay.js";
import {
  formatTonnage,
  sessionDurationLabel,
  sessionTonnage,
  sessionTopSet,
} from "../lib/sessionFacts.js";
import { formatWeight } from "../lib/weightDisplay.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import "../styles/coach-history.css";

const HISTORY_SIDE_KEY = "workoutdb-history-side";

function readHistorySide() {
  try {
    return sessionStorage.getItem(HISTORY_SIDE_KEY) === "coach" ? "coach" : "workouts";
  } catch {
    return "workouts";
  }
}

function writeHistorySide(side) {
  try {
    sessionStorage.setItem(HISTORY_SIDE_KEY, side);
  } catch {
    /* ignore */
  }
}

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

export function SessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sideHostRef = useRef(null);
  const paramSide = searchParams.get("view");
  const view = paramSide === "coach" ? "coach" : "workouts";

  useEffect(() => {
    if (paramSide === "coach" || paramSide === "workouts") {
      writeHistorySide(paramSide);
      return;
    }
    // The route layer keeps this page mounted until the next page commits,
    // while the URL has already moved on - without this check, leaving
    // History wrote view=coach onto /coach?c=7 (seen in review).
    if (window.location.pathname !== "/sessions") return;
    if (readHistorySide() === "coach") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("view", "coach");
          return next;
        },
        { replace: true }
      );
    }
  }, [paramSide, setSearchParams]);

  function setView(next) {
    writeHistorySide(next);
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        if (next === "coach") nextParams.set("view", "coach");
        else nextParams.delete("view");
        return nextParams;
      },
      { replace: true }
    );
  }

  const cached = peekHistorySessions();
  const [sessions, setSessions] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [loadedOnce, setLoadedOnce] = useState(Boolean(cached));
  const [error, setError] = useState(null);
  const unit = loadWeightUnit();
  /* Back's capture is written by the detail page's unmount, which runs
     before this layout effect. The row is already on screen when the list
     was cached, so the shrink starts in the same commit as the route fade. */
  const rowEls = useRef(new Map());
  useLayoutEffect(() => {
    if (!loadedOnce) return;
    const key = peekFlip();
    if (key == null) return;
    const el = rowEls.current.get(String(key));
    if (!el) return;
    if (!sessions.some((s) => String(s.id) === String(key) && s.completedAt)) return;
    playCapturedSurface(key, el);
  }, [loadedOnce, sessions]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionApi.getMySessions();
      const list = data.sessions || [];
      putHistorySessions(list);
      setSessions(list);
      setLoadedOnce(true);
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
          <p className="muted sessions-intro" aria-live="polite">
            {view === "coach"
              ? "Conversations with the coach."
              : !loadedOnce
                ? " "
                : completedCount === 0
                  ? "Nothing finished yet."
                  : `${completedCount} finished ${completedCount === 1 ? "workout" : "workouts"} · ${totalSets} sets logged`}
          </p>
        </div>
        {view === "workouts" ? (
          <button className="btn btn-secondary btn--toolbar" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        ) : null}
      </div>

      <div
        ref={sideHostRef}
        className="history-view-tabs mx-slide-host"
        role="group"
        aria-label="History"
      >
        <SlidingIndicator containerRef={sideHostRef} activeKey={view} />
        <button
          type="button"
          className={`history-view-tab${view === "workouts" ? " is-active" : ""}`}
          aria-pressed={view === "workouts"}
          onClick={() => setView("workouts")}
        >
          Workouts
        </button>
        <button
          type="button"
          className={`history-view-tab${view === "coach" ? " is-active" : ""}`}
          aria-pressed={view === "coach"}
          onClick={() => setView("coach")}
        >
          Coach
        </button>
      </div>

      {view === "coach" ? <CoachConversationList /> : null}

      {view === "workouts" ? <ErrorMessage error={error} /> : null}
      {view === "workouts" && loading && sessions.length === 0 ? (
        <LoadingState tone="skeleton" variant="history" rows={5} slowLabel="Taking longer than usual…" />
      ) : null}

      {view === "workouts" && !loading && sessions.length === 0 ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            Nothing yet. Open <Link to="/">Workout</Link> to start, or pick a saved program.
          </p>
        </div>
      ) : null}

      {view === "workouts"
        ? groups.map((group) => (
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
              const sets = s._count?.sets ?? null;
              const exercises = s._count?.sessionExercises ?? null;
              const when = dateParts(sessionActivityTimestamp(s));
              const duration = live ? null : sessionDurationLabel(s);
              const tonnage = formatTonnage(sessionTonnage(s), unit);
              const top = sessionTopSet(s);
              const topLabel = top
                ? `${formatWeight(top.weight, unit)}${top.reps != null ? ` × ${formatRepsValue(top.reps)}` : ""}`
                : null;
              return (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  ref={
                    live
                      ? undefined
                      : (node) => {
                          const id = String(s.id);
                          if (node) rowEls.current.set(id, node);
                          else rowEls.current.delete(id);
                        }
                  }
                  state={
                    live
                      ? undefined
                      : {
                          mxRow: {
                            id: s.id,
                            title,
                            when: `${when.weekday} ${when.day}`.trim(),
                            time: when.time,
                            top: topLabel,
                            volume: tonnage || null,
                          },
                        }
                  }
                  className={`history-row${live ? " history-row--live" : ""}`}
                  onClick={(e) => {
                    if (live) return;
                    captureFlip(String(s.id), { head: e.currentTarget });
                  }}
                >
                  <span className="history-row__date" aria-hidden="true">
                    <span className="history-row__weekday">{when.weekday}</span>
                    <span className="history-row__day">{when.day}</span>
                  </span>
                  <span className="history-row__main">
                    <span className="history-row__title">{title}</span>
                    <span className="history-row__meta muted small">
                      {when.time}
                      {exercises != null ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          {exercises} {exercises === 1 ? "exercise" : "exercises"}
                        </>
                      ) : null}
                      {sets != null ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          {sets} {sets === 1 ? "set" : "sets"}
                        </>
                      ) : null}
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
                    <span className="history-row__facts" aria-label="Workout totals">
                      <span className="history-row__fact">
                        <span className="history-row__fact-value">
                          {top ? (
                            <>
                              {formatWeight(top.weight, unit)}
                              {top.reps != null ? ` × ${formatRepsValue(top.reps)}` : ""}
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                        <span className="history-row__fact-label">top set</span>
                      </span>
                      <span className="history-row__fact">
                        <span className="history-row__fact-value">{tonnage || "—"}</span>
                        <span className="history-row__fact-label">volume</span>
                      </span>
                      <span className="history-row__fact history-row__fact--duration">
                        <span className="history-row__fact-value">{duration || "—"}</span>
                        <span className="history-row__fact-label">time</span>
                      </span>
                    </span>
                  )}
                  <span className="history-row__chevron" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ))
        : null}
    </div>
  );
}
