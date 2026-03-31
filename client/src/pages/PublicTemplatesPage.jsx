import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { formatBlockTemplateSummary } from "../components/templates/workoutBuilderState.js";

function mergeByCreatedAt(workouts, blocks) {
  const w = (workouts || []).map((t) => ({ kind: "workout", item: t }));
  const b = (blocks || []).map((t) => ({ kind: "block", item: t }));
  return [...w, ...b].sort(
    (a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt)
  );
}

export function PublicTemplatesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingKey, setActingKey] = useState(null);
  const [actingAction, setActingAction] = useState(null);

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [wData, bData] = await Promise.all([
        templateApi.getPublicTemplates(),
        blockTemplateApi.getPublicBlockTemplates(),
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

  const busy = Boolean(actingKey);

  function keyFor(kind, id) {
    return `${kind}:${id}`;
  }

  async function onCloneWorkout(id) {
    setError(null);
    setActingKey(keyFor("workout", id));
    setActingAction("clone");
    try {
      await templateApi.cloneTemplate(id);
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onCloneBlock(id) {
    setError(null);
    setActingKey(keyFor("block", id));
    setActingAction("clone");
    try {
      await blockTemplateApi.cloneBlockTemplate(id);
      navigate("/templates");
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onStart(templateId) {
    setError(null);
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

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Public programs</h1>
          <p className="muted">
            Clone workouts or blocks to your library. Starting a live session is only available from
            single workouts.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading || busy}>
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />
      {loading ? <LoadingState /> : null}

      {empty ? (
        <div className="card">No public programs found.</div>
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
                  <h2>{t.name}</h2>
                  {t.description ? <p className="muted">{t.description}</p> : null}
                  <div className="row">
                    <span className="pill">{isBlock ? "Block" : "Workout"}</span>
                    <span className="pill">By {t.user?.email || "Unknown"}</span>
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
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => (isBlock ? onCloneBlock(t.id) : onCloneWorkout(t.id))}
                    disabled={busy}
                  >
                    {isActing && actingAction === "clone" ? "Cloning…" : "Clone"}
                  </button>
                  {!isBlock ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onStart(t.id)}
                      disabled={busy}
                    >
                      {isActing && actingAction === "start" ? "Starting…" : "Start session"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
