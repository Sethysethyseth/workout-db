import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { CommunityProgramsSection } from "../components/programs/CommunityProgramsSection.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import {
  formatBlockTemplateSummary,
  summarizeExerciseTargets,
} from "../components/templates/workoutBuilderState.js";
import { pickLatestActiveSession } from "../lib/activeSession.js";
import { readCurrentProgram, writeCurrentProgram } from "../lib/currentProgramStorage.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";

export function MyTemplatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const area = searchParams.get("area") === "community" ? "community" : "yours";

  const [workouts, setWorkouts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [tab, setTab] = useState("workouts");
  const [visibility, setVisibility] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actingKey, setActingKey] = useState(null);
  const [actingAction, setActingAction] = useState(null);

  const rawItems = tab === "workouts" ? workouts : blocks;
  const items = useMemo(() => {
    if (visibility === "all") return rawItems;
    if (visibility === "private") return rawItems.filter((t) => !t.isPublic);
    return rawItems.filter((t) => t.isPublic);
  }, [rawItems, visibility]);
  const emptyAll = useMemo(
    () => !loading && workouts.length === 0 && blocks.length === 0,
    [loading, workouts.length, blocks.length]
  );
  const emptyTab = useMemo(() => !loading && items.length === 0, [loading, items.length]);
  const emptyRawTab = useMemo(() => !loading && rawItems.length === 0, [loading, rawItems.length]);

  function setArea(next) {
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        if (next === "community") nextParams.set("area", "community");
        else nextParams.delete("area");
        return nextParams;
      },
      { replace: true }
    );
  }

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
      const cur = readCurrentProgram();
      if (cur?.kind === "workout" && cur.id === t.id) writeCurrentProgram(null);
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
      const cur = readCurrentProgram();
      if (cur?.kind === "block" && cur.id === t.id) writeCurrentProgram(null);
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
  const currentProgram = readCurrentProgram();

  function onSetCurrentWorkout(t) {
    writeCurrentProgram({ kind: "workout", id: t.id, name: t.name || "" });
    setError(null);
    setSuccess("This workout is now your current program on Workout.");
    clearFeedbackSoon();
  }

  function onSetCurrentBlock(t) {
    writeCurrentProgram({ kind: "block", id: t.id, name: t.name || "" });
    setError(null);
    setSuccess("This block is now your current program on Workout.");
    clearFeedbackSoon();
  }

  return (
    <div className="stack programs-page">
      <div className="row">
        <div>
          <h1>Programs</h1>
          <p className="muted programs-intro">Your workouts, blocks, and community programs.</p>
        </div>
        <button
          className="btn btn-secondary btn--toolbar"
          type="button"
          onClick={load}
          disabled={loading || busy}
        >
          Refresh
        </button>
      </div>

      <div className="programs-scope-switch" role="tablist" aria-label="Programs scope">
        <button
          type="button"
          role="tab"
          aria-selected={area === "yours"}
          className={`programs-scope-tab${area === "yours" ? " programs-scope-tab--active" : ""}`}
          onClick={() => setArea("yours")}
        >
          Your library
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={area === "community"}
          className={`programs-scope-tab${area === "community" ? " programs-scope-tab--active" : ""}`}
          onClick={() => setArea("community")}
        >
          Community <span className="muted small" aria-hidden="true">(beta)</span>
        </button>
      </div>

      {area === "community" ? (
        <CommunityProgramsSection />
      ) : (
        <>
          <div className="card stack programs-create-card">
            <h2 className="programs-create-card__title" style={{ margin: 0 }}>
              Create programs
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              Blocks for multi-week plans; workouts for reusable sessions. Log live from Workout.
            </p>
            <div className="row programs-create-card__actions" style={{ flexWrap: "wrap", gap: "10px" }}>
              <Link className="btn programs-create-primary" to="/create-template?type=block">
                Create block
              </Link>
              <Link className="btn btn-secondary" to="/create-template?type=workout">
                Create workout
              </Link>
            </div>
          </div>

          <div className="programs-type-tablist" role="tablist" aria-label="Your program type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "workouts"}
              className={`programs-type-tab${tab === "workouts" ? " programs-type-tab--active" : ""}`}
              onClick={() => setTab("workouts")}
            >
              <span className="programs-type-tab__title">Saved workouts</span>
              <span className="programs-type-tab__meta muted small">{workouts.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "blocks"}
              className={`programs-type-tab${tab === "blocks" ? " programs-type-tab--active" : ""}`}
              onClick={() => setTab("blocks")}
            >
              <span className="programs-type-tab__title">Saved blocks</span>
              <span className="programs-type-tab__meta muted small">{blocks.length}</span>
            </button>
          </div>

          <div className="programs-filter-row" role="group" aria-label="Filter by visibility">
            <span className="programs-filter-row__label muted small">Show</span>
            <div className="programs-filter-chips">
              <button
                type="button"
                className={`programs-filter-chip${visibility === "all" ? " programs-filter-chip--active" : ""}`}
                onClick={() => setVisibility("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`programs-filter-chip${visibility === "private" ? " programs-filter-chip--active" : ""}`}
                onClick={() => setVisibility("private")}
              >
                Private
              </button>
              <button
                type="button"
                className={`programs-filter-chip${visibility === "public" ? " programs-filter-chip--active" : ""}`}
                onClick={() => setVisibility("public")}
              >
                Public
              </button>
            </div>
          </div>
        </>
      )}

      {area === "yours" ? (
        <>
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
                Nothing saved yet. Create a block or a workout to add to your library.
              </p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <Link className="btn programs-create-primary" to="/create-template?type=block">
                  Create block
                </Link>
                <Link className="btn btn-secondary" to="/create-template?type=workout">
                  Create workout
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && !emptyAll && !emptyRawTab && emptyTab ? (
            <div className="card stack">
              <p className="muted" style={{ margin: 0 }}>
                No {tab === "workouts" ? "workouts" : "blocks"} match this filter. Try{" "}
                <button type="button" className="btn btn-ghost" onClick={() => setVisibility("all")}>
                  Show all
                </button>
                .
              </p>
            </div>
          ) : null}

          {!loading && !emptyAll && emptyRawTab ? (
            <div className="card stack">
              <p className="muted" style={{ margin: 0 }}>
                {tab === "workouts"
                  ? "No saved workouts yet. Create one or switch to blocks."
                  : "No saved blocks yet. Create one or switch to workouts."}
              </p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <Link className="btn programs-create-primary" to="/create-template?type=block">
                  Create block
                </Link>
                <Link className="btn btn-secondary" to="/create-template?type=workout">
                  Create workout
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setTab(tab === "workouts" ? "blocks" : "workouts")}
                >
                  View {tab === "workouts" ? "blocks" : "workouts"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="stack" role="tabpanel" aria-label={tab === "workouts" ? "Workouts" : "Blocks"}>
            {tab === "workouts"
              ? items.map((t) => {
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
                        {currentProgram?.kind === "workout" && currentProgram.id === t.id ? (
                          <span className="pill programs-current-pill">Current</span>
                        ) : null}
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
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => onSetCurrentWorkout(t)}
                      >
                        Set as current
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
              : items.map((t) => {
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
                        {currentProgram?.kind === "block" && currentProgram.id === t.id ? (
                          <span className="pill programs-current-pill">Current</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => onSetCurrentBlock(t)}
                      >
                        Set as current
                      </button>
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
        </>
      ) : null}
    </div>
  );
}
