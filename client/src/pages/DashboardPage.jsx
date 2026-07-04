import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { WeeklyReport } from "../components/analytics/WeeklyReport.jsx";
import { ActiveWorkoutHero } from "../components/workout/ActiveWorkoutHero.jsx";
import { StartWorkoutHero } from "../components/workout/StartWorkoutHero.jsx";
import { StartWorkoutPicker } from "../components/workout/StartWorkoutPicker.jsx";
import { useActiveSession } from "../context/ActiveSessionContext.jsx";
import { readCurrentProgram } from "../lib/currentProgramStorage.js";
import { ACTIVE_WORKOUT_ERROR, startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { sessions, activeSession, refresh, loading: sessionsLoading } = useActiveSession();

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [startingTemplateId, setStartingTemplateId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [quickStartError, setQuickStartError] = useState(null);
  const [quickStarting, setQuickStarting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [heroNow, setHeroNow] = useState(() => Date.now());
  const [workoutSavedFlash, setWorkoutSavedFlash] = useState(false);

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
    if (!activeSession) return;
    const id = window.setInterval(() => setHeroNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  useEffect(() => {
    const st = location.state;
    if (!st || typeof st !== "object" || !st.workoutSaved) return;
    setWorkoutSavedFlash(true);
    navigate("/", { replace: true, state: {} });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!workoutSavedFlash) return;
    const id = window.setTimeout(() => setWorkoutSavedFlash(false), 8000);
    return () => window.clearTimeout(id);
  }, [workoutSavedFlash]);

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

  async function onEmptyWorkoutFromPicker() {
    setQuickStartError(null);
    setQuickStarting(true);
    try {
      await startAdHocWorkoutAndNavigate(navigate, { replace: false });
      setPickerOpen(false);
      await refresh();
    } catch (err) {
      setQuickStartError(err);
    } finally {
      setQuickStarting(false);
    }
  }

  const hasActive = Boolean(activeSession);
  const mastheadDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        />
      ) : (
        <StartWorkoutHero onOpenPicker={() => setPickerOpen(true)} />
      )}

      <WeeklyReport />

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
          <ul className="workout-tab-recent__scroll">
            {completedRecent.map((s) => {
              const when = formatLoggedWhen(s.completedAt);
              const title = sessionDisplayTitle(s);
              return (
                <li key={s.id} className="workout-tab-recent__item">
                  <Link to={`/sessions/${s.id}`} className="card card--notched workout-tab-recent__card">
                    <span className="workout-tab-recent__card-title">{title}</span>
                    <span className="muted small workout-tab-recent__card-when">{when}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <StartWorkoutPicker
        open={pickerOpen && !hasActive}
        onClose={() => setPickerOpen(false)}
        templates={pickerTemplates}
        onEmptyWorkout={() => void onEmptyWorkoutFromPicker()}
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
