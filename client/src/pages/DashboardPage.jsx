import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as sessionApi from "../api/sessionApi.js";
import * as templateApi from "../api/templateApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { ActiveWorkoutHero } from "../components/workout/ActiveWorkoutHero.jsx";
import { QuickPickTemplates } from "../components/workout/QuickPickTemplates.jsx";
import { SecondaryActions } from "../components/workout/SecondaryActions.jsx";
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

  const currentProgramRef = readCurrentProgram();

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

  return (
    <div className="stack workout-tab">
      {workoutSavedFlash ? (
        <div className="workout-tab__saved-flash card" role="status">
          <strong>Workout saved</strong>
          <span aria-hidden="true"> </span>✅
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            {"You're done. It's in History and Recently logged below."}
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

      <QuickPickTemplates
        templates={quickPickTemplates}
        loading={templatesLoading}
        disabled={hasActive || Boolean(startingTemplateId)}
        startingTemplateId={startingTemplateId}
        onStartTemplate={(id) => void onStartFromTemplate(id)}
      />

      <SecondaryActions currentBlock={currentProgramRef?.kind === "block" ? currentProgramRef : null} />

      <p className="workout-tab__community muted small" style={{ margin: 0 }}>
        <Link to="/templates?area=community" className="workout-tab__community-link">
          Community programs (beta)
        </Link>
      </p>

      <section className="card stack workout-tab-history" aria-labelledby="workout-history-heading">
        <div className="row">
          <h2 id="workout-history-heading" className="workout-tab-history__title">
            Recently logged
          </h2>
          <Link className="btn btn-ghost btn--compact btn--quiet-history" to="/sessions">
            History
          </Link>
        </div>
        {sessionsLoading && completedRecent.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            Loading…
          </p>
        ) : completedRecent.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            Completed workouts show up here.
          </p>
        ) : (
          <ul className="recent-activity-list workout-tab-history__list">
            {completedRecent.map((s) => {
              const when = formatLoggedWhen(s.completedAt);
              const title = sessionDisplayTitle(s);
              return (
                <li key={s.id}>
                  <Link to={`/sessions/${s.id}`} className="recent-activity-row">
                    <div className="recent-activity-row__main">
                      <span className="recent-activity-row__title">{title}</span>
                      <span className="muted small recent-activity-row__when">{when}</span>
                    </div>
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
