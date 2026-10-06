import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import * as templateApi from "../api/templateApi.js";
import * as blockRunApi from "../api/blockRunApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { WeeklyReport } from "../components/analytics/WeeklyReport.jsx";
import { ActiveWorkoutHero } from "../components/workout/ActiveWorkoutHero.jsx";
import { StartWorkoutHero } from "../components/workout/StartWorkoutHero.jsx";
import { StartWorkoutPicker } from "../components/workout/StartWorkoutPicker.jsx";
import { WeekStrip } from "../components/workout/WeekStrip.jsx";
import { UpNextCard } from "../components/blocks/run/UpNextCard.jsx";
import { isRunFinished } from "../components/blocks/run/dayStatusTiles.js";
import { useActiveSession } from "../context/ActiveSessionContext.jsx";
import { readCurrentProgram } from "../lib/currentProgramStorage.js";
import { ACTIVE_WORKOUT_ERROR, startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";
import { countWorkoutVolume } from "../components/blocks/run/runExerciseHelpers.js";
import {
  blockDayPrimaryTitle,
  sessionDisplayBlockName,
  sessionDisplayTitle,
} from "../lib/sessionDisplay.js";
import { formatTonnage, sessionDurationLabel, sessionTonnage } from "../lib/sessionFacts.js";
import { loadWeightUnit } from "../lib/weightUnitPref.js";

/** Logged-set count from the sessions-list payload (weight/reps only). */
function countLoggedSetsFromListSession(session) {
  const sets = Array.isArray(session?.sets) ? session.sets : [];
  return sets.filter((s) => {
    const reps = s?.reps;
    return reps != null && String(reps).trim() !== "";
  }).length;
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

function formatRelativeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessions, activeSession, refresh, loading: sessionsLoading } = useActiveSession();

  const [templates, setTemplates] = useState([]);
  const [, setTemplatesLoading] = useState(true);
  const [startingTemplateId, setStartingTemplateId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [quickStartError, setQuickStartError] = useState(null);
  const [quickStarting, setQuickStarting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [heroNow, setHeroNow] = useState(() => Date.now());
  const [workoutSavedFlash, setWorkoutSavedFlash] = useState(false);
  const [workoutDiscardedFlash, setWorkoutDiscardedFlash] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null);
  const [activeBlockReady, setActiveBlockReady] = useState(false);
  const [upNextStarting, setUpNextStarting] = useState(false);

  const quickPickTemplates = useMemo(() => {
    const list = Array.isArray(templates) ? [...templates] : [];
    const cur = readCurrentProgram();
    if (cur?.kind === "workout") {
      const idx = list.findIndex((t) => t.id === cur.id);
      if (idx > 0) {
        const [picked] = list.splice(idx, 1);
        list.unshift(picked);
      }
    }
    return list.slice(0, 6);
  }, [templates]);

  const pickerTemplates = useMemo(() => quickPickTemplates.slice(0, 5), [quickPickTemplates]);

  const completedRecent = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions.filter((s) => s?.completedAt) : [];
    list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return list.slice(0, 5);
  }, [sessions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tmplData = await templateApi.getMyTemplates();
        if (!cancelled) {
          setTemplates(Array.isArray(tmplData.templates) ? tmplData.templates : []);
        }
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActiveBlockReady(false);
    (async () => {
      try {
        const data = await blockRunApi.getActiveBlockRun();
        if (cancelled) return;
        if (data?.run && data.block && data.progress && !isRunFinished(data.progress)) {
          setActiveBlock({
            run: data.run,
            block: data.block,
            progress: data.progress,
          });
        } else {
          setActiveBlock(null);
        }
      } catch {
        if (!cancelled) setActiveBlock(null);
      } finally {
        if (!cancelled) setActiveBlockReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSession?.id, location.pathname]);

  useEffect(() => {
    if (!activeSession) return;
    const id = window.setInterval(() => setHeroNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  useEffect(() => {
    const st = location.state;
    if (!st || typeof st !== "object") return;
    if (st.workoutSaved) {
      setWorkoutSavedFlash(true);
      navigate("/", { replace: true, state: {} });
      return;
    }
    if (st.workoutDiscarded) {
      setWorkoutDiscardedFlash(true);
      navigate("/", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!workoutSavedFlash) return;
    const id = window.setTimeout(() => setWorkoutSavedFlash(false), 8000);
    return () => window.clearTimeout(id);
  }, [workoutSavedFlash]);

  useEffect(() => {
    if (!workoutDiscardedFlash) return;
    const id = window.setTimeout(() => setWorkoutDiscardedFlash(false), 8000);
    return () => window.clearTimeout(id);
  }, [workoutDiscardedFlash]);

  async function onStartFromTemplate(templateId) {
    if (activeSession) return;
    setStartError(null);
    setStartingTemplateId(templateId);
    try {
      const data = await sessionApi.startSession(templateId);
      if (data?.session?.id != null) {
        await refresh();
        navigate(`/sessions/${data.session.id}`);
      }
    } catch (err) {
      setStartError(err);
    } finally {
      setStartingTemplateId(null);
    }
  }

  async function onStartEmptyWorkout({ closePicker = false } = {}) {
    setQuickStartError(null);
    setQuickStarting(true);
    try {
      await startAdHocWorkoutAndNavigate(navigate, { replace: false });
      if (closePicker) setPickerOpen(false);
      await refresh();
    } catch (err) {
      setQuickStartError(err);
    } finally {
      setQuickStarting(false);
    }
  }

  async function onUpNextStart(next) {
    if (!activeBlock?.run || !next) return;
    setUpNextStarting(true);
    setStartError(null);
    try {
      const data = await blockRunApi.startFromBlock({
        blockRunId: activeBlock.run.id,
        weekOrder: next.weekOrder,
        workoutOrder: next.workoutOrder,
      });
      if (data?.session?.id != null) {
        await refresh();
        navigate(`/sessions/${data.session.id}`);
      }
    } catch (err) {
      setStartError(err);
    } finally {
      setUpNextStarting(false);
    }
  }

  const hasActive = Boolean(activeSession);
  const unit = loadWeightUnit();
  const mastheadDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /** Live block day identity for muted "Up next after this" (skips this day). */
  const liveBlockDay = useMemo(() => {
    if (!activeSession) return null;
    const weekOrder =
      activeSession.blockContext?.weekOrder ?? activeSession.blockWeekOrder;
    const workoutOrder =
      activeSession.blockContext?.workoutOrder ?? activeSession.blockWorkoutOrder;
    if (weekOrder == null || workoutOrder == null) return null;
    return {
      weekOrder: Number(weekOrder),
      workoutOrder: Number(workoutOrder),
    };
  }, [activeSession]);

  /** Mirrors UpNextCard's own render guard so the week-strip rule never leaves Home with none. */
  const showBlockCard = Boolean(
    !hasActive &&
      activeBlockReady &&
      activeBlock?.block &&
      activeBlock.progress?.nextDay &&
      (activeBlock.progress.weeks || [])
        .find((w) => w.order === activeBlock.progress.nextDay.weekOrder)
        ?.days?.some((d) => d.order === activeBlock.progress.nextDay.workoutOrder)
  );

  /** Planned/logged sets for ActiveWorkoutHero when the live session is a block day. */
  const liveSetsProgress = useMemo(() => {
    if (!activeSession || blockDayPrimaryTitle(activeSession) == null) return null;
    if (!liveBlockDay || !activeBlock?.block) return null;
    const blockWeek = (activeBlock.block.weeks || []).find(
      (w) => Number(w.order) === liveBlockDay.weekOrder
    );
    const workout = (blockWeek?.workouts || []).find(
      (w) => Number(w.order) === liveBlockDay.workoutOrder
    );
    if (!workout) return null;
    const { sets: planned } = countWorkoutVolume(workout);
    if (!planned || planned <= 0) return null;
    return {
      planned,
      logged: countLoggedSetsFromListSession(activeSession),
    };
  }, [activeSession, activeBlock, liveBlockDay]);

  return (
    <div className="stack workout-tab">
      <header className="home-masthead">
        <div className="home-masthead__brand">
          <span className="home-masthead__crown" aria-hidden="true" />
          <h1 className="home-masthead__wordmark">LogChamp</h1>
        </div>
        <p className="home-masthead__date">{mastheadDate}</p>
      </header>
      {workoutSavedFlash ? (
        <div className="workout-tab__saved-flash card" role="status">
          <strong>Workout saved</strong>
          <span aria-hidden="true"> </span>✅
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            {"You're done. It's in History and Recent workouts below."}
          </p>
        </div>
      ) : null}
      {workoutDiscardedFlash ? (
        <div className="workout-tab__discard-flash card muted" role="status">
          Workout discarded
        </div>
      ) : null}

      {(quickStartError || startError) && (
        <div className="workout-tab__errors stack" style={{ gap: 8 }}>
          {quickStartError ? (
            <div className="card error workout-tab__error-compact">
              <strong className="small">Cannot start</strong>
              <div className="muted small mt-2" style={{ marginBottom: 0 }}>
                {quickStartError.code === ACTIVE_WORKOUT_ERROR && quickStartError.activeSessionId ? (
                  <>
                    {quickStartError.message}{" "}
                    <Link to={`/sessions/${quickStartError.activeSessionId}`}>Open session</Link>
                  </>
                ) : (
                  quickStartError.message || String(quickStartError)
                )}
              </div>
            </div>
          ) : null}
          {startError ? <ErrorMessage error={startError} /> : null}
        </div>
      )}

      {hasActive ? (
        <ActiveWorkoutHero
          session={activeSession}
          nowMs={heroNow}
          onResume={() => navigate(`/sessions/${activeSession.id}`)}
          setsProgress={liveSetsProgress}
        />
      ) : (
        <StartWorkoutHero
          onStartEmpty={() => void onStartEmptyWorkout()}
          onBrowseTemplates={() => setPickerOpen(true)}
          startingEmpty={quickStarting}
          lastSessionLabel={
            completedRecent[0]
              ? `${sessionDisplayTitle(completedRecent[0])}, ${formatRelativeDay(completedRecent[0].completedAt)}`
              : null
          }
        />
      )}

      {/* Active run + no live: bold "Next in your block" card under the log hero.
          Live workout + active block: muted "Up next after this" only. */}
      {showBlockCard ? (
        <UpNextCard
          block={activeBlock.block}
          progress={activeBlock.progress}
          runId={activeBlock.run.id}
          starting={upNextStarting}
          onStart={(next) => void onUpNextStart(next)}
        />
      ) : null}
      {hasActive && activeBlockReady && activeBlock ? (
        <UpNextCard
          block={activeBlock.block}
          progress={activeBlock.progress}
          runId={activeBlock.run.id}
          mutedOnly
          liveDay={liveBlockDay}
        />
      ) : null}

      {/* One week strip on Home (Seth, Oct 5): the block card's week strip
          wins; the day strip shows only when no block card does. */}
      <WeeklyReport weekStrip={showBlockCard ? null : <WeekStrip sessions={sessions} />} />

      <section className="workout-tab-recent" aria-labelledby="workout-recent-heading">
        <div className="row workout-tab-recent__head">
          <h2 id="workout-recent-heading" className="workout-tab-recent__title">
            Recent workouts
          </h2>
          <Link className="workout-tab-recent__view-all" to="/sessions">
            View all → History
          </Link>
        </div>
        {sessionsLoading && completedRecent.length === 0 ? (
          <p className="muted small workout-tab-recent__empty" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : completedRecent.length === 0 ? (
          <p className="muted small workout-tab-recent__empty" style={{ margin: 0 }}>
            Completed workouts show up here.
          </p>
        ) : (
          <div className="card recent-list">
            {completedRecent.map((s) => {
              const when = formatLoggedWhen(s.completedAt);
              const title = sessionDisplayTitle(s);
              const blockName = sessionDisplayBlockName(s);
              const exercises = s._count?.sessionExercises ?? null;
              const sets = s._count?.sets ?? null;
              const duration = sessionDurationLabel(s);
              const tonnage = formatTonnage(sessionTonnage(s), unit);
              return (
                <Link key={s.id} to={`/sessions/${s.id}`} className="recent-row">
                  <span className="recent-row__main">
                    <span className="recent-row__title">{title}</span>
                    {blockName ? (
                      <span className="recent-row__block muted small">{blockName}</span>
                    ) : null}
                    <span className="recent-row__when muted small">
                      {when}
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
                    </span>
                  </span>
                  <span className="recent-row__facts">
                    {tonnage ? <span className="recent-row__fact">{tonnage}</span> : null}
                    {duration ? <span className="recent-row__fact recent-row__fact--muted">{duration}</span> : null}
                  </span>
                  <span className="recent-row__chevron" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <StartWorkoutPicker
        open={pickerOpen && !hasActive}
        onClose={() => setPickerOpen(false)}
        templates={pickerTemplates}
        onEmptyWorkout={() => void onStartEmptyWorkout({ closePicker: true })}
        onPickTemplate={(id) => {
          setPickerOpen(false);
          void onStartFromTemplate(id);
        }}
        onBrowseTemplates={() => {
          setPickerOpen(false);
          navigate("/templates");
        }}
        emptyBusy={quickStarting}
        templateBusyId={startingTemplateId}
      />
    </div>
  );
}
