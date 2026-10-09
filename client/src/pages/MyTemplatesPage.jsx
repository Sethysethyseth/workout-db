import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import * as blockRunApi from "../api/blockRunApi.js";
import * as sessionApi from "../api/sessionApi.js";
import * as exerciseApi from "../api/exerciseApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { Card, DisplayTitle, Segmented } from "../components/blocks/ui/index.js";
import {
  LibraryBlockCard,
  LibraryCommunitySection,
  LibraryExerciseCard,
  LibraryRunningStrip,
  LibraryWorkoutCard,
} from "../components/library/index.js";
import { pickLatestActiveSession } from "../lib/activeSession.js";
import { readCurrentProgram, writeCurrentProgram } from "../lib/currentProgramStorage.js";
import { sessionDisplayTitle } from "../lib/sessionDisplay.js";
import "../styles/blocks/bk-library.css";

function libraryBlockSortRank(block, activeTemplateId, leftOffByBlockId) {
  if (activeTemplateId != null && block.id === activeTemplateId) return 0;
  if (leftOffByBlockId[block.id] && !block.isDraft) return 1;
  return 2;
}

function sortLibraryBlocks(list, activeRun, leftOffByBlockId) {
  const activeTemplateId = activeRun?.blockTemplateId ?? null;
  return list
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const rankA = libraryBlockSortRank(a.block, activeTemplateId, leftOffByBlockId);
      const rankB = libraryBlockSortRank(b.block, activeTemplateId, leftOffByBlockId);
      if (rankA !== rankB) return rankA - rankB;
      if (rankA === 1) {
        const endedA = Date.parse(leftOffByBlockId[a.block.id]?.endedAt ?? "") || 0;
        const endedB = Date.parse(leftOffByBlockId[b.block.id]?.endedAt ?? "") || 0;
        if (endedA !== endedB) return endedB - endedA;
      }
      return a.index - b.index;
    })
    .map((row) => row.block);
}

export function MyTemplatesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const area = searchParams.get("area") === "community" ? "community" : "yours";

  const [workouts, setWorkouts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  // Default tab is Blocks (bks3) - no query-string initializer needed.
  const [tab, setTab] = useState("blocks");
  const [visibility, setVisibility] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actingKey, setActingKey] = useState(null);
  const [actingAction, setActingAction] = useState(null);
  const [workoutsStatus, setWorkoutsStatus] = useState("loading");
  const [blocksStatus, setBlocksStatus] = useState("loading");
  const [exercisesStatus, setExercisesStatus] = useState("loading");
  const [activeRun, setActiveRun] = useState(null);
  const [leftOffByBlockId, setLeftOffByBlockId] = useState({});
  const [confirmStartBlock, setConfirmStartBlock] = useState(null);

  const rawItems =
    tab === "workouts" ? workouts : tab === "blocks" ? blocks : customExercises;
  const items = useMemo(() => {
    if (tab === "exercises") return rawItems;
    let list = rawItems;
    if (visibility === "private") list = rawItems.filter((t) => !t.isPublic);
    else if (visibility === "public") list = rawItems.filter((t) => t.isPublic);
    if (tab === "blocks") return sortLibraryBlocks(list, activeRun, leftOffByBlockId);
    return list;
  }, [rawItems, visibility, tab, activeRun, leftOffByBlockId]);
  const tabStatus =
    tab === "workouts" ? workoutsStatus : tab === "blocks" ? blocksStatus : exercisesStatus;
  const tabLoading = tabStatus === "loading";
  const emptyTab = useMemo(
    () => tabStatus === "ready" && items.length === 0,
    [tabStatus, items.length]
  );
  const emptyRawTab = useMemo(
    () => tabStatus === "ready" && rawItems.length === 0,
    [tabStatus, rawItems.length]
  );

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

  function applyRunPayload(runData, leftOffData) {
    if (runData?.run) {
      const progressWeeks = Array.isArray(runData.progress?.weeks)
        ? runData.progress.weeks.length
        : null;
      const blockWeeks = Array.isArray(runData.block?.weeks) ? runData.block.weeks.length : null;
      const duration =
        runData.block?.durationWeeks != null ? Number(runData.block.durationWeeks) : null;
      setActiveRun({
        id: runData.run.id,
        blockTemplateId: runData.run.blockTemplateId,
        name: runData.block?.name || "",
        currentWeek:
          runData.progress?.currentWeekOrder != null
            ? Number(runData.progress.currentWeekOrder)
            : null,
        totalWeeks: progressWeeks || duration || blockWeeks || null,
      });
    } else {
      setActiveRun(null);
    }
    const leftOffMap = {};
    for (const row of Array.isArray(leftOffData?.runs) ? leftOffData.runs : []) {
      if (row?.blockTemplateId != null) leftOffMap[row.blockTemplateId] = row;
    }
    setLeftOffByBlockId(leftOffMap);
  }

  function loadLibrary({ includeRuns }) {
    const jobs = [
      templateApi
        .getMyTemplates()
        .then((wData) => {
          setWorkouts(Array.isArray(wData.templates) ? wData.templates : []);
          setWorkoutsStatus("ready");
        })
        .catch((err) => {
          setError(err);
          setWorkoutsStatus("error");
        }),
      blockTemplateApi
        .getMyBlockTemplates()
        .then((bData) => {
          setBlocks(Array.isArray(bData.blockTemplates) ? bData.blockTemplates : []);
          setBlocksStatus("ready");
        })
        .catch((err) => {
          setError(err);
          setBlocksStatus("error");
        }),
      exerciseApi
        .listCustomExercises()
        .then((eData) => {
          setCustomExercises(Array.isArray(eData.userExercises) ? eData.userExercises : []);
          setExercisesStatus("ready");
        })
        .catch((err) => {
          setError(err);
          setExercisesStatus("error");
        }),
    ];
    if (includeRuns) {
      jobs.push(
        Promise.all([
          blockRunApi.getActiveBlockRun().catch(() => ({ run: null })),
          blockRunApi.getLeftOffRuns().catch(() => ({ runs: [] })),
        ]).then(([runData, leftOffData]) => applyRunPayload(runData, leftOffData))
      );
    }
    return Promise.all(jobs);
  }

  async function load() {
    setError(null);
    try {
      await loadLibrary({ includeRuns: area !== "community" });
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    let cancelled = false;
    templateApi.getMyTemplates().then((wData) => {
      if (cancelled) return;
      setWorkouts(Array.isArray(wData.templates) ? wData.templates : []);
      setWorkoutsStatus("ready");
    }).catch((err) => {
      if (cancelled) return;
      setError(err);
      setWorkoutsStatus("error");
    });
    blockTemplateApi.getMyBlockTemplates().then((bData) => {
      if (cancelled) return;
      setBlocks(Array.isArray(bData.blockTemplates) ? bData.blockTemplates : []);
      setBlocksStatus("ready");
    }).catch((err) => {
      if (cancelled) return;
      setError(err);
      setBlocksStatus("error");
    });
    exerciseApi.listCustomExercises().then((eData) => {
      if (cancelled) return;
      setCustomExercises(Array.isArray(eData.userExercises) ? eData.userExercises : []);
      setExercisesStatus("ready");
    }).catch((err) => {
      if (cancelled) return;
      setError(err);
      setExercisesStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (area === "community") return undefined;
    let cancelled = false;
    Promise.all([
      blockRunApi.getActiveBlockRun().catch(() => ({ run: null })),
      blockRunApi.getLeftOffRuns().catch(() => ({ runs: [] })),
    ]).then(([runData, leftOffData]) => {
      if (cancelled) return;
      applyRunPayload(runData, leftOffData);
    });
    return () => {
      cancelled = true;
    };
  }, [area]);

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
    // Making public is not implemented yet (community list not launched).
    if (!t.isPublic) {
      setSuccess("this hasnt been implemented yet bro stop prying");
      clearFeedbackSoon();
      return;
    }
    setActingKey(keyFor("block", t.id));
    setActingAction("toggle");
    try {
      await blockTemplateApi.updateBlockTemplate(t.id, { isPublic: false });
      setSuccess("Block is now private.");
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
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("workout", t.id));
    setActingAction("delete");
    try {
      await templateApi.deleteTemplate(t.id);
      const cur = readCurrentProgram();
      if (cur?.kind === "workout" && cur.id === t.id) writeCurrentProgram(null);
      setSuccess("Workout deleted.");
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
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("block", t.id));
    setActingAction("delete");
    try {
      await blockTemplateApi.deleteBlockTemplate(t.id);
      setSuccess("Block deleted.");
      clearFeedbackSoon();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  async function onDeleteExercise(x) {
    setError(null);
    setSuccess(null);
    setActingKey(keyFor("exercise", x.id));
    setActingAction("delete");
    try {
      await exerciseApi.deleteCustomExercise(x.id);
      setCustomExercises((prev) => prev.filter((e) => e.id !== x.id));
      setSuccess("Custom exercise deleted.");
      clearFeedbackSoon();
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  function onUpdateExercise(updated) {
    if (!updated || updated.id == null) return;
    setCustomExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  const busy = Boolean(actingKey);
  const currentProgram = readCurrentProgram();

  function onSetCurrentWorkout(t) {
    writeCurrentProgram({ kind: "workout", id: t.id, name: t.name || "" });
    setError(null);
    setSuccess("This workout is now your current program on Workout.");
    clearFeedbackSoon();
  }

  async function onStartBlock(t) {
    if (t.isDraft) return;
    setError(null);
    setSuccess(null);

    const leftOff = leftOffByBlockId[t.id] || null;
    if (leftOff) {
      setConfirmStartBlock({ block: t, leftOff });
      return;
    }

    if (activeRun && activeRun.blockTemplateId !== t.id) {
      setConfirmStartBlock({ block: t, leftOff: null });
      return;
    }

    await doStartBlock(t);
  }

  async function doStartBlock(t, { resumeRunId } = {}) {
    setConfirmStartBlock(null);
    setActingKey(keyFor("block", t.id));
    setActingAction("start-block");
    try {
      await blockRunApi.startBlockRun(
        t.id,
        resumeRunId != null ? { resumeRunId } : {}
      );
      navigate("/blocks/current");
    } catch (err) {
      setError(err);
    } finally {
      setActingKey(null);
      setActingAction(null);
    }
  }

  const filterLabel =
    visibility === "private" ? "Private" : visibility === "public" ? "Public" : "All";

  return (
    <div className="bk bk-lib">
      <div className="bk-lib__header">
        <DisplayTitle>Library</DisplayTitle>
      </div>

      <div className="bk-lib__actions">
        <Link className="bk-lib-btn bk-lib-btn--primary" to="/create-template?type=block">
          New block
        </Link>
        <Link className="bk-lib-btn bk-lib-btn--secondary" to="/blocks/import">
          Import
        </Link>
        <span
          className="bk-lib-btn bk-lib-btn--parked"
          role="button"
          aria-disabled="true"
          title="Create workout is parked"
          aria-label="Create workout (parked)"
        >
          Create workout
          <span className="bk-lib-parked-tag">Parked</span>
        </span>
      </div>

      {activeRun ? (
        <LibraryRunningStrip
          name={activeRun.name}
          currentWeek={activeRun.currentWeek}
          totalWeeks={activeRun.totalWeeks}
        />
      ) : null}

      <div className="bk-lib-nav-row">
        <Segmented
          className="bk-lib-scope"
          label="Library scope"
          value={area}
          onChange={setArea}
          options={[
            { value: "yours", label: "Yours" },
            { value: "community", label: "Community" },
          ]}
        />
        {area === "yours" && tab !== "exercises" ? (
          <div className="bk-lib-filter-wrap">
            <button
              type="button"
              className={`bk-lib-filter-toggle${visibility !== "all" || filterOpen ? " bk-lib-filter-toggle--active" : ""}`}
              aria-expanded={filterOpen}
              aria-controls="bk-lib-filter-panel"
              onClick={() => setFilterOpen((open) => !open)}
            >
              Filter{visibility !== "all" ? `: ${filterLabel}` : ""}
            </button>
          </div>
        ) : null}
      </div>

      {area === "yours" && tab !== "exercises" && filterOpen ? (
        <div
          id="bk-lib-filter-panel"
          className="bk-lib-filters"
          role="group"
          aria-label="Filter by visibility"
        >
          <button
            type="button"
            className={`bk-lib-filter-chip${visibility === "all" ? " bk-lib-filter-chip--active" : ""}`}
            onClick={() => setVisibility("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`bk-lib-filter-chip${visibility === "private" ? " bk-lib-filter-chip--active" : ""}`}
            onClick={() => setVisibility("private")}
          >
            Private
          </button>
          <button
            type="button"
            className={`bk-lib-filter-chip${visibility === "public" ? " bk-lib-filter-chip--active" : ""}`}
            onClick={() => setVisibility("public")}
          >
            Public
          </button>
        </div>
      ) : null}

      {area === "community" ? (
        <LibraryCommunitySection />
      ) : (
        <>
          <div className="bk-lib-type-tabs" role="tablist" aria-label="Your library type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "blocks"}
              className={`bk-lib-type-tab${tab === "blocks" ? " bk-lib-type-tab--active" : ""}`}
              onClick={() => setTab("blocks")}
            >
              <span className="bk-lib-type-tab__title">Blocks</span>
              <span className="bk-lib-type-tab__count">{blocks.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "workouts"}
              className={`bk-lib-type-tab${tab === "workouts" ? " bk-lib-type-tab--active" : ""}`}
              onClick={() => setTab("workouts")}
            >
              <span className="bk-lib-type-tab__title">Workouts</span>
              <span className="bk-lib-type-tab__count">{workouts.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "exercises"}
              className={`bk-lib-type-tab${tab === "exercises" ? " bk-lib-type-tab--active" : ""}`}
              onClick={() => setTab("exercises")}
            >
              <span className="bk-lib-type-tab__title">Exercises</span>
              <span className="bk-lib-type-tab__count">{customExercises.length}</span>
            </button>
          </div>

          <ErrorMessage error={error} />
          {success ? (
            <Card className="bk-lib-feedback">
              <p className="bk-lib-feedback__title">Done</p>
              <p className="bk-lib-feedback__body">{success}</p>
            </Card>
          ) : null}

          {tabLoading ? (
            <LoadingState tone="skeleton" variant="list" rows={3} slowLabel="Taking longer than usual…" />
          ) : null}

          {tab === "blocks" && emptyRawTab ? (
            <Card className="bk-lib-empty">
              <p className="bk-lib-empty__title">No blocks yet</p>
              <p className="bk-lib-empty__body">
                Blocks are multi-week plans. Create one or import from a sheet.
              </p>
              <div className="bk-lib-empty__actions">
                <Link className="bk-lib-btn bk-lib-btn--primary" to="/create-template?type=block">
                  New block
                </Link>
                <Link className="bk-lib-btn bk-lib-btn--secondary" to="/blocks/import">
                  Import
                </Link>
              </div>
            </Card>
          ) : null}

          {tab === "workouts" && emptyRawTab ? (
            <Card className="bk-lib-empty">
              <p className="bk-lib-empty__title">No saved workouts</p>
              <p className="bk-lib-empty__body">
                Saved workouts still work here. Create workout is parked - start from a block, or
                save a live session afterwards.
              </p>
              <div className="bk-lib-empty__actions">
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--secondary"
                  onClick={() => setTab("blocks")}
                >
                  View blocks
                </button>
              </div>
            </Card>
          ) : null}

          {tab === "exercises" && exercisesStatus === "ready" && customExercises.length === 0 ? (
            <Card className="bk-lib-empty">
              <p className="bk-lib-empty__title">No custom exercises</p>
              <p className="bk-lib-empty__body">
                Add one with &quot;Add to your library&quot; from the block builder&apos;s exercise
                search, or from an imported sheet&apos;s &quot;Not in your library&quot; rows. On a
                live workout, tap the &quot;Not tracked - add?&quot; pill.
              </p>
            </Card>
          ) : null}

          {tab !== "exercises" && tabStatus === "ready" && !emptyRawTab && emptyTab ? (
            <Card className="bk-lib-empty">
              <p className="bk-lib-empty__body">
                No {tab === "workouts" ? "workouts" : "blocks"} match this filter.
              </p>
              <div className="bk-lib-empty__actions">
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--ghost"
                  onClick={() => setVisibility("all")}
                >
                  Show all
                </button>
              </div>
            </Card>
          ) : null}

          <div
            className="bk-lib-list"
            role="tabpanel"
            aria-label={
              tab === "workouts" ? "Workouts" : tab === "blocks" ? "Blocks" : "Custom exercises"
            }
          >
            {tabLoading
              ? null
              : tab === "exercises"
              ? items.map((x) => {
                  const k = keyFor("exercise", x.id);
                  return (
                    <LibraryExerciseCard
                      key={k}
                      exercise={x}
                      busy={busy}
                      isActing={actingKey === k}
                      actingAction={actingAction}
                      onDelete={onDeleteExercise}
                      onUpdated={onUpdateExercise}
                    />
                  );
                })
              : tab === "workouts"
                ? items.map((t) => {
                    const k = keyFor("workout", t.id);
                    return (
                      <LibraryWorkoutCard
                        key={k}
                        workout={t}
                        isCurrent={
                          currentProgram?.kind === "workout" && currentProgram.id === t.id
                        }
                        busy={busy}
                        isActing={actingKey === k}
                        actingAction={actingAction}
                        onStart={onStartWorkout}
                        onSetCurrent={onSetCurrentWorkout}
                        onTogglePublic={onTogglePublicWorkout}
                        onDelete={onDeleteWorkout}
                      />
                    );
                  })
                : items.map((t) => {
                    const k = keyFor("block", t.id);
                    return (
                      <LibraryBlockCard
                        key={k}
                        block={t}
                        isActive={activeRun != null && activeRun.blockTemplateId === t.id}
                        leftOff={leftOffByBlockId[t.id] || null}
                        busy={busy}
                        isActing={actingKey === k}
                        actingAction={actingAction}
                        onStart={onStartBlock}
                        onTogglePublic={onTogglePublicBlock}
                        onDelete={onDeleteBlock}
                        confirmStartBlock={confirmStartBlock}
                        activeRun={activeRun}
                        onConfirmResume={() => {
                          if (!confirmStartBlock?.leftOff) return;
                          void doStartBlock(confirmStartBlock.block, {
                            resumeRunId: confirmStartBlock.leftOff.runId,
                          });
                        }}
                        onConfirmStartOver={() => {
                          if (!confirmStartBlock) return;
                          void doStartBlock(confirmStartBlock.block);
                        }}
                        onConfirmCancel={() => setConfirmStartBlock(null)}
                      />
                    );
                  })}
          </div>
        </>
      )}
    </div>
  );
}
