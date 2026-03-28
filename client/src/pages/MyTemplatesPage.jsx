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

function mergeByCreatedAt(workouts, blocks) {
  const w = (workouts || []).map((t) => ({ kind: "workout", item: t }));
  const b = (blocks || []).map((t) => ({ kind: "block", item: t }));
  return [...w, ...b].sort(
    (a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt)
  );
}

export function MyTemplatesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actingKey, setActingKey] = useState(null);
  const [actingAction, setActingAction] = useState(null);

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [wData, bData] = await Promise.all([
        templateApi.getMyTemplates(),
        blockTemplateApi.getMyBlockTemplates(),
      ]);
      setItems(mergeByCreatedAt(wData.templates, bData.blockTemplates));
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
          <h1>My Templates</h1>
          <p className="muted">
            Workout templates start a single session. Block templates are multi-workout plans (clone or
            edit — no session start yet).
          </p>
        </div>
        <div className="row">
          <button className="btn btn-secondary" onClick={load} disabled={loading || busy}>
            Refresh
          </button>
          <Link className="btn" to="/create-template">
            New template
          </Link>
        </div>
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

      {empty ? (
        <div className="card stack">
          <p className="muted" style={{ margin: 0 }}>
            No templates yet. Create a workout template or a multi-workout block.
          </p>
          <Link className="btn" to="/create-template">
            Create your first template
          </Link>
        </div>
      ) : null}

      <div className="stack">
        {items.map(({ kind, item: t }) => {
          const k = keyFor(kind, t.id);
          const isActing = actingKey === k;
          const isBlock = kind === "block";

          return (
            <div
              key={k}
              className="card stack"
              style={
                isBlock
                  ? { borderLeft: "4px solid var(--accent, #6366f1)" }
                  : undefined
              }
            >
              <div className="row">
                <div>
                  <h2 style={{ marginBottom: "0.35rem" }}>{t.name}</h2>
                  {t.description ? <p className="muted">{t.description}</p> : null}
                  <div className="row">
                    <span className="pill">{isBlock ? "Block" : "Workout"}</span>
                    <span className="pill">{t.isPublic ? "Public" : "Private"}</span>
                    {isBlock ? (
                      <span className="pill muted">{formatBlockTemplateSummary(t)}</span>
                    ) : (
                      <span className="pill">
                        Exercises: {Array.isArray(t.exercises) ? t.exercises.length : 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                  {!isBlock ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => onStartWorkout(t.id)}
                      disabled={busy}
                    >
                      {isActing && actingAction === "start" ? "Starting…" : "Start session"}
                    </button>
                  ) : null}
                  <Link
                    className="btn btn-secondary"
                    to={isBlock ? `/blocks/${t.id}/edit` : `/templates/${t.id}/edit`}
                    tabIndex={busy ? -1 : undefined}
                    aria-disabled={busy}
                    style={busy ? { pointerEvents: "none", opacity: 0.65 } : undefined}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      isBlock ? onTogglePublicBlock(t) : onTogglePublicWorkout(t)
                    }
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
                    onClick={() => (isBlock ? onDeleteBlock(t) : onDeleteWorkout(t))}
                    disabled={busy}
                  >
                    {isActing && actingAction === "delete" ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>

              {!isBlock &&
              Array.isArray(t.exercises) &&
              t.exercises.length > 0 ? (
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

              {isBlock && Array.isArray(t.weeks) && t.weeks.length > 0 ? (
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
