import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import {
  formatBlockTemplateSummary,
  summarizeExerciseTargets,
} from "../components/templates/workoutBuilderState.js";

export function MyTemplatesPage() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [tab, setTab] = useState("workouts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actingKey, setActingKey] = useState(null);
  const [actingAction, setActingAction] = useState(null);

  const items = tab === "workouts" ? workouts : blocks;
  const emptyAll = useMemo(
    () => !loading && workouts.length === 0 && blocks.length === 0,
    [loading, workouts.length, blocks.length]
  );
  const emptyTab = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [wData, bData] = await Promise.all([
        templateApi.getMyTemplates(),
        blockTemplateApi.getMyBlockTemplates(),
      ]);
      setWorkouts(Array.isArray(wData.templates) ? wData.templates : []);
      setBlocks(Array.isArray(bData.blockTemplates) ? bData.blockTemplates : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function clearFeedbackSoon() {
    setTimeout(() => setSuccess(null), 4000);
  }

  function keyFor(kind, id) {
    return `${kind}:${id}`;
  }

  async function onStartWorkout(templateId) {
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("workout", templateId));
    setActingAction("start");
    try {
      const data = await sessionApi.startSession(templateId);
      navigate(`/sessions/${data.session.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onTogglePublicWorkout(t) {
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("workout", t.id));
    setActingAction("toggle");
    try {
      await templateApi.updateTemplate(t.id, { isPublic: !t.isPublic });
      setSuccess(t.isPublic ? "Template is now private." : "Template is now public.");
      clearFeedbackSoon();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onTogglePublicBlock(t) {
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("block", t.id));
    setActingAction("toggle");
    try {
      await blockTemplateApi.updateBlockTemplate(t.id, { isPublic: !t.isPublic });
      setSuccess(t.isPublic ? "Block is now private." : "Block is now public.");
      clearFeedbackSoon();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onDeleteWorkout(t) {
    const ok = window.confirm(
      `Delete workout template "${t.name}"? This cannot be undone. Sessions that used it keep their history.`
    );
    if (!ok) return;

    setError(null);
    setSuccess(null);
    setActingKey(keyFor("workout", t.id));
    setActingAction("delete");
    try {
      await templateApi.deleteTemplate(t.id);
      setSuccess("Template deleted.");
      clearFeedbackSoon();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onDeleteBlock(t) {
    const ok = window.confirm(
      `Delete block template "${t.name}"? This cannot be undone.`
    );
    if (!ok) return;

    setError(null);
    setSuccess(null);
    setActingKey(keyFor("block", t.id));
    setActingAction("delete");
    try {
      await blockTemplateApi.deleteBlockTemplate(t.id);
      setSuccess("Block template deleted.");
      clearFeedbackSoon();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  const busy = Boolean(actingKey);

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>My programs</h1>
          <p className="muted">
            Saved plans you can reuse—workout templates and multi-week blocks. To log training now,
            use <strong>Start Workout</strong> on Home or <strong>Start session</strong> on a workout
            below. Nothing here is a past session; those are in History.
          </p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading || busy}>
            Refresh
          </button>
          <Link className="btn btn-secondary" to="/create-template?type=workout">
            Create Workout
          </Link>
          <Link className="btn btn-secondary" to="/create-template?type=block">
            Create Block
          </Link>
        </div>
      </div>

      <div
        className="programs-tablist row"
        role="tablist"
        aria-label="Program type"
        style={{ flexWrap: "wrap", gap: "8px" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "workouts"}
          className={`btn btn-secondary programs-tab${tab === "workouts" ? " programs-tab--active" : ""}`}
          onClick={() => setTab("workouts")}
        >
          Workouts ({workouts.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "blocks"}
          className={`btn btn-secondary programs-tab${tab === "blocks" ? " programs-tab--active" : ""}`}
          onClick={() => setTab("blocks")}
        >
          Blocks ({blocks.length})
        </button>
      </div>

      <ErrorMessage error={error} />
      {success ? (
        <div className="card">
          <strong>Done</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {success}
          </p>
        </div>
      ) : null}

      {loading ? <LoadingState /> : null}

      {emptyAll ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            Nothing saved yet. Create a workout or a block to add to your library.
          </p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Link className="btn" to="/create-template?type=workout">
              Create Workout
            </Link>
            <Link className="btn btn-secondary" to="/create-template?type=block">
              Create Block
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !emptyAll && emptyTab ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            {tab === "workouts"
              ? "No saved workouts yet. Create one or switch to Blocks."
              : "No saved blocks yet. Create one or switch to Workouts."}
          </p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Link
              className="btn btn-secondary"
              to={tab === "workouts" ? "/create-template?type=workout" : "/create-template?type=block"}
            >
              {tab === "workouts" ? "Create Workout" : "Create Block"}
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setTab(tab === "workouts" ? "blocks" : "workouts")}>
              View {tab === "workouts" ? "Blocks" : "Workouts"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="stack" role="tabpanel" aria-label={tab === "workouts" ? "Workouts" : "Blocks"}>
        {tab === "workouts"
          ? workouts.map((t) => {
              const k = keyFor("workout", t.id);
              const isActing = actingKey === k;
              return (
                <div key={k} className="card stack">
                  <div className="row">
                    <div>
                      <h2 style={{ marginBottom: "0.35rem" }}>{t.name}</h2>
                      {t.description ? <p className="muted">{t.description}</p> : null}
                      <div className="row">
                        <span className="pill">Workout</span>
                        <span className="pill">{t.isPublic ? "Public" : "Private"}</span>
                        <span className="pill">
                          Exercises: {Array.isArray(t.exercises) ? t.exercises.length : 0}
                        </span>
                      </div>
                    </div>
                    <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => onStartWorkout(t.id)}
                        disabled={busy}
                      >
                        {isActing && actingAction === "start" ? "Starting…" : "Start session"}
                      </button>
                      <Link
                        className="btn btn-secondary"
                        to={`/templates/${t.id}/edit`}
                        tabIndex={busy ? -1 : undefined}
                        aria-disabled={busy}
                        style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onTogglePublicWorkout(t)}
                        disabled={busy}
                      >
                        {isActing && actingAction === "toggle"
                          ? "Updating…"
                          : t.isPublic
                            ? "Make private"
                            : "Make public"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => onDeleteWorkout(t)}
                        disabled={busy}
                      >
                        {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {Array.isArray(t.exercises) && t.exercises.length > 0 ? (
                    <div className="card">
                      <strong>Exercises</strong>
                      <div className="mt-2 stack">
                        {t.exercises.map((e) => (
                          <div key={e.id} className="row">
                            <div>
                              <div>
                                {e.order}. {e.exerciseName}
                              </div>
                              <div className="muted small">{summarizeExerciseTargets(e)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          : blocks.map((t) => {
              const k = keyFor("block", t.id);
              const isActing = actingKey === k;
              return (
                <div
                  key={k}
                  className="card stack"
                  style={{ borderLeft: "4px solid var(--accent, #6366f1)" }}
                >
                  <div className="row">
                    <div>
                      <h2 style={{ marginBottom: "0.35rem" }}>{t.name}</h2>
                      {t.description ? <p className="muted">{t.description}</p> : null}
                      <div className="row">
                        <span className="pill">Block</span>
                        <span className="pill">{t.isPublic ? "Public" : "Private"}</span>
                        <span className="pill muted">{formatBlockTemplateSummary(t)}</span>
                      </div>
                    </div>
                    <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                      <Link
                        className="btn btn-secondary"
                        to={`/blocks/${t.id}/edit`}
                        tabIndex={busy ? -1 : undefined}
                        aria-disabled={busy}
                        style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onTogglePublicBlock(t)}
                        disabled={busy}
                      >
                        {isActing && actingAction === "toggle"
                          ? "Updating…"
                          : t.isPublic
                            ? "Make private"
                            : "Make public"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => onDeleteBlock(t)}
                        disabled={busy}
                      >
                        {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {Array.isArray(t.weeks) && t.weeks.length > 0 ? (
                    <div className="card">
                      <strong>Structure</strong>
                      <div className="mt-2 stack">
                        {[...t.weeks]
                          .sort((a, b) => a.order - b.order)
                          .map((week) => (
                            <div key={week.id} className="stack">
                              <div className="muted small" style={{ fontWeight: 600 }}>
                                Week {week.order}
                              </div>
                              <div className="stack" style={{ paddingLeft: "0.5rem" }}>
                                {[...(week.workouts || [])]
                                  .sort((a, b) => a.order - b.order)
                                  .map((w) => (
                                    <div key={w.id} className="row">
                                      <div>
                                        <div>
                                          {w.order}. {w.name}
                                        </div>
                                        <div className="muted small">
                                          {Array.isArray(w.exercises) ? w.exercises.length : 0}{" "}
                                          exercises
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
      </div>
    </div>
  );
}
