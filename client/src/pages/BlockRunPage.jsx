import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as blockRunApi from "../api/blockRunApi.js";
import * as blockTemplateApi from "../api/blockTemplateApi.js";
import { useActiveSession } from "../context/ActiveSessionContext.jsx";
import { loadWeightUnit } from "../lib/weightUnitPref.js";
import { DayPicker } from "../components/blocks/ui/DayPicker.jsx";
import { StickyHeader } from "../components/blocks/ui/StickyHeader.jsx";
import { WeekStrip } from "../components/blocks/ui/WeekStrip.jsx";
import {
  EditBlockLink,
  RunDayCard,
  RunEmptyState,
  isRunFinished,
  mapProgressToTiles,
  resolveBlockEffort,
} from "../components/blocks/run/index.js";
import { LoadingState } from "../components/LoadingState.jsx";
import "../styles/blocks/bk-run.css";
import "../styles/blocks/bk-library.css";

function findWorkout(block, weekOrder, workoutOrder) {
  const week = (block?.weeks || []).find((w) => w.order === weekOrder);
  if (!week) return null;
  return (week.workouts || []).find((w) => w.order === workoutOrder) || null;
}

export function BlockRunPage() {
  const navigate = useNavigate();
  const { refresh } = useActiveSession();
  const unit = loadWeightUnit();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [libraryBlocks, setLibraryBlocks] = useState([]);
  const [leftOffByBlockId, setLeftOffByBlockId] = useState({});
  const [selectedWeekOrder, setSelectedWeekOrder] = useState(null);
  const [selectedDayOrder, setSelectedDayOrder] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startingBlockId, setStartingBlockId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmStartBlock, setConfirmStartBlock] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await blockRunApi.getActiveBlockRun();
      if (data?.run) {
        setPayload(data);
        const tiles = mapProgressToTiles(data.progress);
        setSelectedWeekOrder(tiles.openWeekOrder);
        setSelectedDayOrder(tiles.openDayOrder);
        setLibraryBlocks([]);
        setLeftOffByBlockId({});
        setConfirmStartBlock(null);
      } else {
        setPayload(null);
        const [mine, leftOffData] = await Promise.all([
          blockTemplateApi.getMyBlockTemplates(),
          blockRunApi.getLeftOffRuns().catch(() => ({ runs: [] })),
        ]);
        setLibraryBlocks(Array.isArray(mine?.blockTemplates) ? mine.blockTemplates : []);
        const leftOffMap = {};
        for (const row of Array.isArray(leftOffData?.runs) ? leftOffData.runs : []) {
          if (row?.blockTemplateId != null) leftOffMap[row.blockTemplateId] = row;
        }
        setLeftOffByBlockId(leftOffMap);
      }
    } catch (err) {
      setError(err);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tiles = useMemo(
    () => (payload?.progress ? mapProgressToTiles(payload.progress) : null),
    [payload]
  );

  const weekDays =
    tiles && selectedWeekOrder != null
      ? tiles.daysByWeekOrder[selectedWeekOrder] || []
      : [];

  const selectedDay =
    weekDays.find((d) => d.order === selectedDayOrder) || weekDays[0] || null;

  const selectedWeekMeta =
    tiles?.weeks?.find((w) => w.order === selectedWeekOrder) || null;

  const workout =
    payload?.block && selectedWeekOrder != null && selectedDay
      ? findWorkout(payload.block, selectedWeekOrder, selectedDay.order)
      : null;

  const effort = resolveBlockEffort(payload?.block);
  const finished = isRunFinished(payload?.progress);

  async function startOrResumeDay() {
    if (!payload?.run || !selectedDay || selectedWeekOrder == null) return;
    setStarting(true);
    setError(null);
    try {
      const data = await blockRunApi.startFromBlock({
        blockRunId: payload.run.id,
        weekOrder: selectedWeekOrder,
        workoutOrder: selectedDay.order,
      });
      if (data?.session?.id != null) {
        await refresh();
        navigate(`/sessions/${data.session.id}`);
      }
    } catch (err) {
      setError(err);
    } finally {
      setStarting(false);
    }
  }

  function viewDay() {
    if (selectedDay?.sessionId != null) {
      navigate(`/sessions/${selectedDay.sessionId}`);
    }
  }

  function resumeLabel(leftOff) {
    if (!leftOff?.nextDay) return "Resume";
    const dayName = leftOff.dayName || `Day ${leftOff.nextDay.workoutOrder}`;
    return `Resume at W${leftOff.nextDay.weekOrder} · ${dayName}`;
  }

  function onStartBlock(block) {
    setError(null);
    const leftOff = leftOffByBlockId[block.id] || null;
    if (leftOff) {
      setConfirmStartBlock({ block, leftOff });
      return;
    }
    void doStartBlock(block);
  }

  async function doStartBlock(block, { resumeRunId } = {}) {
    setConfirmStartBlock(null);
    setStartingBlockId(block.id);
    setError(null);
    try {
      await blockRunApi.startBlockRun(
        block.id,
        resumeRunId != null ? { resumeRunId } : {}
      );
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setStartingBlockId(null);
    }
  }

  async function onEndBlock() {
    if (!payload?.run) return;
    setEnding(true);
    setConfirmEnd(false);
    setMenuOpen(false);
    setError(null);
    try {
      await blockRunApi.endBlockRun(payload.run.id);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setEnding(false);
    }
  }

  function requestEndBlock() {
    setMenuOpen(false);
    setConfirmEnd(true);
  }

  if (loading) {
    return (
      <div className="bk bk-run">
        <div className="bk-shell">
          <LoadingState
            tone="skeleton"
            variant="blockrun"
            caption={false}
            label="Loading block"
          />
        </div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="bk bk-run">
        <div className="bk-shell">
          <div className="bk-run-error" role="alert">
            <p>{error.message || "Could not load the current block."}</p>
            <button type="button" className="btn" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payload?.run) {
    return (
      <div className="bk bk-run">
        <div className="bk-shell">
          <StickyHeader title="CURRENT BLOCK" />
          {error ? (
            <div className="bk-run-error bk-run-error--inline" role="alert">
              <p>{error.message || "Something went wrong."}</p>
              <button type="button" className="btn btn-secondary" onClick={() => void load()}>
                Retry
              </button>
            </div>
          ) : null}
          {confirmStartBlock ? (
            <div className="bk-lib-confirm" role="alertdialog">
              <p className="bk-lib-confirm__title">
                Start &ldquo;{confirmStartBlock.block.name || "this block"}&rdquo;?
              </p>
              <div className="bk-lib-confirm__actions">
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--primary"
                  disabled={startingBlockId != null}
                  onClick={() =>
                    void doStartBlock(confirmStartBlock.block, {
                      resumeRunId: confirmStartBlock.leftOff.runId,
                    })
                  }
                >
                  {resumeLabel(confirmStartBlock.leftOff)}
                </button>
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--secondary"
                  disabled={startingBlockId != null}
                  onClick={() => void doStartBlock(confirmStartBlock.block)}
                >
                  Start over
                </button>
                <button
                  type="button"
                  className="bk-lib-btn bk-lib-btn--ghost"
                  disabled={startingBlockId != null}
                  onClick={() => setConfirmStartBlock(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          <RunEmptyState
            blocks={libraryBlocks}
            leftOffByBlockId={leftOffByBlockId}
            startingId={startingBlockId}
            onStart={onStartBlock}
          />
        </div>
      </div>
    );
  }

  const blockName = payload.block?.name || "Block";
  const weekCount =
    (Array.isArray(payload.block?.weeks) && payload.block.weeks.length) ||
    (Array.isArray(payload.progress?.weeks) && payload.progress.weeks.length) ||
    0;
  const weekOfLabel =
    selectedWeekOrder != null && weekCount > 0
      ? `Week ${selectedWeekOrder} of ${weekCount}`
      : selectedWeekOrder != null
        ? `Week ${selectedWeekOrder}`
        : selectedWeekMeta?.label || "Week";

  return (
    <div className="bk bk-run">
      <div className="bk-shell">
        <StickyHeader
          className="bk-run-sticky"
          title={
            <span className="bk-run-sticky__name" title={blockName}>
              {blockName}
            </span>
          }
          sub={weekOfLabel}
          right={
            <div className="bk-run-header-right">
              <EditBlockLink blockId={payload.block?.id} />
              <div className="bk-run-menu">
                <button
                  type="button"
                  className="bk-run-menu__btn"
                  aria-label="Block options"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  ···
                </button>
                {menuOpen ? (
                  <div className="bk-run-menu__panel" role="menu">
                    <button
                      type="button"
                      className="bk-run-menu__item"
                      role="menuitem"
                      disabled={ending}
                      onClick={requestEndBlock}
                    >
                      End block
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />

        <div className="bk-run__weeks">
          <WeekStrip
            weeks={tiles?.weeks || []}
            selectedKey={selectedWeekOrder != null ? String(selectedWeekOrder) : undefined}
            onSelect={(key) => {
              const order = Number(key);
              setSelectedWeekOrder(order);
              const days = tiles?.daysByWeekOrder?.[order] || [];
              const next = payload.progress?.nextDay;
              if (next && Number(next.weekOrder) === order) {
                setSelectedDayOrder(Number(next.workoutOrder));
              } else {
                setSelectedDayOrder(days[0]?.order ?? 1);
              }
            }}
          />
        </div>

        {error ? (
          <div className="bk-run-error bk-run-error--inline" role="alert">
            <p>{error.message || "Something went wrong."}</p>
            <button type="button" className="btn btn-secondary" onClick={() => void load()}>
              Retry
            </button>
          </div>
        ) : null}

        {confirmEnd ? (
          <div className="stack session-discard-confirm bk-run-confirm" role="alertdialog">
            <p className="muted small session-discard-confirm__title">
              End &ldquo;{payload.block?.name || "this block"}&rdquo;?
            </p>
            <p className="muted small session-discard-confirm__body">
              You can pick it up where you left off from your library.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                disabled={ending}
                aria-busy={ending || undefined}
                onClick={() => void onEndBlock()}
              >
                {ending ? "Ending…" : "End block"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={ending}
                onClick={() => setConfirmEnd(false)}
              >
                Keep running
              </button>
            </div>
          </div>
        ) : null}

        {finished ? (
          <p className="bk-run-finished muted small" role="status">
            Every day in this block is done. End the block when you are ready, or train a day
            again.
          </p>
        ) : null}

        <div className="bk-run__days">
          <DayPicker
            days={weekDays}
            selectedKey={selectedDay ? String(selectedDay.order) : undefined}
            onSelect={(key) => setSelectedDayOrder(Number(key))}
          />
        </div>

        {selectedDay ? (
          <RunDayCard
            weekOrder={selectedWeekOrder}
            day={selectedDay}
            exercises={workout?.exercises || []}
            effort={effort}
            unit={unit}
            starting={starting}
            onStart={() => void startOrResumeDay()}
            onResume={() => void startOrResumeDay()}
            onView={viewDay}
            onTrainAgain={() => void startOrResumeDay()}
          />
        ) : null}

        <p className="bk-run-library-link">
          <Link to="/templates">Library</Link>
        </p>
      </div>
    </div>
  );
}
