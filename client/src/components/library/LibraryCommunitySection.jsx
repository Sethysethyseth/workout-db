import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as templateApi from "../../api/templateApi.js";
import * as blockTemplateApi from "../../api/blockTemplateApi.js";
import * as sessionApi from "../../api/sessionApi.js";
import { ErrorMessage } from "../ErrorMessage.jsx";
import { LoadingState } from "../LoadingState.jsx";
import { Card, Chip } from "../blocks/ui/index.js";
import { blockMetaLine } from "./meta.js";
import { pickLatestActiveSession } from "../../lib/activeSession.js";
import { sessionDisplayTitle } from "../../lib/sessionDisplay.js";
import "../../styles/blocks/bk-library.css";

function mergeByCreatedAt(workouts, blocks) {
  const w = (workouts || []).map((t) => ({ kind: "workout", item: t }));
  const b = (blocks || []).map((t) => ({ kind: "block", item: t }));
  return [...w, ...b].sort(
    (a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt)
  );
}

/** Browse and clone public workouts and blocks - BK card language. */
export function LibraryCommunitySection() {
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
      const mine = await sessionApi.getMySessions();
      const sessions = Array.isArray(mine.sessions) ? mine.sessions : [];
      const active = pickLatestActiveSession(sessions);
      if (active) {
        setError(
          `You already have “${sessionDisplayTitle(active)}” in progress. Open it from Workout or History and finish or delete it before starting another workout.`
        );
        return;
      }
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
    <div className="bk-lib-list">
      <div className="bk-lib-community-intro">
        <p className="bk-lib-community-intro__text">
          Public programs from other users - clone to your library or start a workout session.
        </p>
        <button
          className="bk-lib__refresh"
          type="button"
          onClick={load}
          disabled={loading || busy}
        >
          Refresh
        </button>
      </div>

      <Card className="bk-lib-note" role="note">
        <p className="bk-lib-note__title">Beta</p>
        <p className="bk-lib-note__body">
          Community sharing is still in progress. You may see limited results while we build out
          public programs and discovery.
        </p>
      </Card>

      <ErrorMessage error={error} />
      {loading ? (
        <LoadingState tone="skeleton" variant="list" rows={3} slowLabel="Taking longer than usual…" />
      ) : null}

      {empty ? (
        <Card className="bk-lib-empty">
          <p className="bk-lib-empty__title">No public programs</p>
          <p className="bk-lib-empty__body">Nothing public to browse right now.</p>
        </Card>
      ) : null}

      {items.map(({ kind, item: t }) => {
        const k = keyFor(kind, t.id);
        const isActing = actingKey === k;
        const isBlock = kind === "block";
        const meta = isBlock
          ? blockMetaLine(t)
          : `${Array.isArray(t.exercises) ? t.exercises.length : 0} exercises`;

        return (
          <Card key={k} className="bk-lib-card">
            <div>
              <h2 className="bk-lib-card__title">{t.name}</h2>
              {meta ? <p className="bk-lib-card__meta">{meta}</p> : null}
              {t.description ? <p className="bk-lib-card__desc">{t.description}</p> : null}
              <div className="bk-lib-card__chips">
                <Chip>{isBlock ? "Block" : "Workout"}</Chip>
                <Chip tone="neutral">By {t.user?.email || "Unknown"}</Chip>
              </div>
            </div>
            <div className="bk-lib-card__primary">
              <button
                type="button"
                className="bk-lib-btn bk-lib-btn--secondary"
                onClick={() => (isBlock ? onCloneBlock(t.id) : onCloneWorkout(t.id))}
                disabled={busy}
              >
                {isActing && actingAction === "clone" ? "Cloning…" : "Clone to my library"}
              </button>
              {!isBlock ? (
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--primary"
                  onClick={() => onStart(t.id)}
                  disabled={busy}
                >
                  {isActing && actingAction === "start" ? "Starting…" : "Start"}
                </button>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
