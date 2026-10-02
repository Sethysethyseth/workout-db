import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as sessionApi from "../../../api/sessionApi.js";
import { Card } from "../ui/Card.jsx";
import { Disclosure } from "../ui/Disclosure.jsx";
import { ExerciseRx } from "../ui/ExerciseRx.jsx";
import {
  isTimedPlanExercise,
  isTimedPlanSet,
  planSetAt,
  planToRx,
} from "./planHelpers.js";
import {
  BlockSetRow,
  blankRowDraft,
  blockSetIsLogged,
} from "./BlockSetRow.jsx";
import {
  loadHiddenPlannedIndices,
  saveHiddenPlannedIndices,
} from "./hiddenPlannedRows.js";
import { nextLoggableSlotIndex } from "./nextLoggableSlot.js";
import { parseLeadSide, splitPlanNotes } from "./splitPlanNotes.js";
import { derivePerSideMode } from "./perSideMode.js";
import "../../../styles/blocks/bk-ui.css";
import "../../../styles/blocks/bk-log.css";

/**
 * Build visible slot list for a planned exercise (one side, or bilateral).
 * Planned slots (minus hidden) first; logged sets bind in order; extras
 * cover overflow logged sets and in-session "+ Add set" drafts.
 * @param {number[]} extraIds stable ids for in-session extra draft slots
 */
function buildSlots(plan, sets, hiddenIndices, extraIds) {
  const planSets = Array.isArray(plan?.sets) ? plan.sets : [];
  const planCount = planSets.length;
  const hidden = new Set(hiddenIndices);
  const sorted = [...(sets || [])].sort((a, b) => a.order - b.order);
  const extras = Array.isArray(extraIds) ? extraIds : [];

  const plannedSlots = [];
  for (let i = 0; i < planCount; i += 1) {
    if (hidden.has(i)) continue;
    plannedSlots.push({
      key: `plan-${i}`,
      planIndex: i,
      kind: "planned",
    });
  }

  // If the plan has zero sets, still show one draft slot.
  if (plannedSlots.length === 0 && planCount === 0) {
    plannedSlots.push({ key: "plan-0", planIndex: 0, kind: "planned" });
  }

  const bound = [];
  let setCursor = 0;

  for (const slot of plannedSlots) {
    const set = sorted[setCursor] ?? null;
    if (set) {
      bound.push({ ...slot, set, isDraft: false });
      setCursor += 1;
    } else {
      bound.push({ ...slot, set: null, isDraft: true });
    }
  }

  while (setCursor < sorted.length) {
    const set = sorted[setCursor];
    bound.push({
      key: `overflow-${set.id}`,
      planIndex: Math.max(0, planCount - 1),
      kind: "overflow",
      set,
      isDraft: false,
    });
    setCursor += 1;
  }

  for (const extraId of extras) {
    bound.push({
      key: `extra-${extraId}`,
      planIndex: Math.max(0, planCount - 1),
      kind: "extra",
      extraId,
      set: null,
      isDraft: true,
    });
  }

  return bound;
}

/** Parent-owned draft key: side + planned index (or stable extra id). */
function rowDraftKey(sideKey, slot) {
  if (slot.kind === "extra") return `${sideKey}:extra:${slot.extraId ?? slot.key}`;
  return `${sideKey}:plan:${slot.planIndex}`;
}

function planHasNotesKey(plan) {
  return plan != null && Object.prototype.hasOwnProperty.call(plan, "notes");
}

/** Author cue/coach source: plan.notes when present; else sessionExercise.notes. */
function authorNotesFrom(se, plan) {
  if (planHasNotesKey(plan)) return plan.notes;
  return se?.notes;
}

/**
 * Lifter draft for "+ Note": empty when se.notes equals the plan copy
 * (or when there is no separate plan.notes key yet).
 */
function lifterNotesDraftFrom(se, plan) {
  const seTrim = String(se?.notes ?? "").trim();
  if (!planHasNotesKey(plan)) return "";
  const planTrim = String(plan.notes ?? "").trim();
  if (seTrim === "" || seTrim === planTrim) return "";
  return se?.notes ?? "";
}

function hasDistinctLifterNote(se, plan) {
  if (!planHasNotesKey(plan)) return false;
  const seTrim = String(se?.notes ?? "").trim();
  const planTrim = String(plan.notes ?? "").trim();
  return seTrim !== "" && seTrim !== planTrim;
}

function sideLabel(side) {
  if (side === "L") return "Left";
  if (side === "R") return "Right";
  return "";
}

/**
 * One planned-set grid (bilateral, or a single L/R side).
 */
function PlannedSetGrid({
  side,
  slots,
  plan,
  timedExercise,
  effortLabel,
  effortSignal,
  weightUnit,
  disabled,
  editingSets,
  isCompleted,
  draftsByKey,
  onDraftChange,
  onDraftClear,
  onPromoteDraftSet,
  onUpdateSet,
  onRemoveSlot,
  onActivateExercise,
  onAddSet,
  seId,
  writesFrozenRef,
}) {
  const gridKey = side == null ? "bilat" : side;
  const nextIdx = nextLoggableSlotIndex(slots);
  return (
    <div className="bk-log-side">
      {side === "L" || side === "R" ? (
        <div className="bk-log-side-h">
          <span className="bk-log-side-h__lr" aria-hidden="true">
            {side}
          </span>
          <span>{sideLabel(side)}</span>
        </div>
      ) : null}

      <div
        className="bk-log-grid"
        onFocusCapture={() => onActivateExercise?.(seId)}
      >
        <div
          className="bk-log-grid__head"
          style={{
            gridTemplateColumns: effortLabel
              ? "40px repeat(3, minmax(0, 1fr)) 34px"
              : "40px repeat(2, minmax(0, 1fr)) 34px",
          }}
          aria-hidden="true"
        >
          <span>Set</span>
          <span>{timedExercise ? "Sec" : "Reps"}</span>
          <span>Weight</span>
          {effortLabel ? <span>{effortLabel}</span> : null}
          <span />
        </div>

        {slots.map((slot, idx) => {
          const planIndex = slot.planIndex;
          const rowPlanSet = plan != null ? planSetAt(plan, planIndex) : null;
          const rowTimed =
            plan != null && (isTimedPlanSet(plan, planIndex) || timedExercise);
          const dKey = rowDraftKey(gridKey, slot);
          return (
            <BlockSetRow
              key={`${gridKey}-${slot.key}`}
              setNumber={idx + 1}
              isDraft={slot.isDraft}
              set={slot.set}
              plan={plan}
              planSet={rowPlanSet}
              timedMode={rowTimed}
              effortSignal={effortSignal}
              weightUnit={weightUnit}
              disabled={disabled}
              editingSets={editingSets && !isCompleted}
              canLogAsPlanned={idx === nextIdx}
              ownedDraft={
                slot.isDraft
                  ? draftsByKey[dKey] ?? blankRowDraft()
                  : null
              }
              onOwnedDraftChange={
                slot.isDraft
                  ? (next) => onDraftChange?.(dKey, next)
                  : null
              }
              onPromoteDraft={async (d) => {
                const payload =
                  side === "L" || side === "R" ? { ...d, side } : d;
                const created = await onPromoteDraftSet(seId, payload);
                if (created) {
                  onDraftClear?.(dKey);
                  if (slot.kind === "extra") {
                    onRemoveSlot?.(slot, { demoteExtraOnly: true });
                  }
                }
                return created;
              }}
              onUpdateSet={onUpdateSet}
              onRemove={() => onRemoveSlot?.(slot)}
              onInteractStart={() => onActivateExercise?.(seId)}
              writesFrozenRef={writesFrozenRef}
            />
          );
        })}
      </div>

      {!isCompleted ? (
        <button
          type="button"
          className="bk-log-ex__add"
          onClick={() => onAddSet?.(side)}
          disabled={disabled}
        >
          + Add set
        </button>
      ) : null}
    </div>
  );
}

/**
 * Block-day exercise card: count, name, rx, cue, planned set grid(s), coach note.
 */
export function BlockExerciseCard({
  se,
  sets,
  sessionId,
  isCompleted = false,
  effortSignal = null,
  weightUnit = "lb",
  onPromoteDraftSet,
  onUpdateSet,
  onDeleteSet,
  onActivateExercise,
  onExerciseNotesSaved,
  writesFrozen = false,
  writesFrozenRef,
  onStatsChange,
}) {
  const plan = se.plan != null && typeof se.plan === "object" ? se.plan : null;
  const timedExercise = plan != null && isTimedPlanExercise(plan);

  const [perSideOverride, setPerSideOverride] = useState(null);
  const [hiddenBySide, setHiddenBySide] = useState(() => ({
    bilat: loadHiddenPlannedIndices(sessionId, se.id),
    L: loadHiddenPlannedIndices(sessionId, se.id, "L"),
    R: loadHiddenPlannedIndices(sessionId, se.id, "R"),
  }));
  const [extraIdsBySide, setExtraIdsBySide] = useState({
    bilat: [],
    L: [],
    R: [],
  });
  const extraIdSeqRef = useRef(0);
  const [draftsByKey, setDraftsByKey] = useState({});
  const [editingSets, setEditingSets] = useState(false);
  const [lifterNoteOpen, setLifterNoteOpen] = useState(false);
  const [lifterNotes, setLifterNotes] = useState(() =>
    lifterNotesDraftFrom(se, plan)
  );
  const [noteError, setNoteError] = useState(null);
  const [perSideConfirm, setPerSideConfirm] = useState(null);

  const perSideMode = derivePerSideMode(
    perSideOverride,
    se.exerciseName ?? "",
    sets
  );

  useEffect(() => {
    setPerSideOverride(null);
    setHiddenBySide({
      bilat: loadHiddenPlannedIndices(sessionId, se.id),
      L: loadHiddenPlannedIndices(sessionId, se.id, "L"),
      R: loadHiddenPlannedIndices(sessionId, se.id, "R"),
    });
    setExtraIdsBySide({ bilat: [], L: [], R: [] });
    setDraftsByKey({});
    extraIdSeqRef.current = 0;
    setEditingSets(false);
    setLifterNoteOpen(false);
    setLifterNotes(lifterNotesDraftFrom(se, se.plan));
  }, [se.id, sessionId]);

  useEffect(() => {
    setLifterNotes(lifterNotesDraftFrom(se, plan));
  }, [se.notes, plan]);

  const authorNotes = authorNotesFrom(se, plan);
  const { cue, coach } = splitPlanNotes(authorNotes);
  const leadSide = parseLeadSide(authorNotes);
  const lifterHasNote = hasDistinctLifterNote(se, plan);

  const sideOrder = useMemo(() => {
    if (!perSideMode) return [null];
    if (leadSide === "R") return ["R", "L"];
    return ["L", "R"];
  }, [perSideMode, leadSide]);

  const grids = useMemo(() => {
    return sideOrder.map((side) => {
      const key = side == null ? "bilat" : side;
      const sideSets =
        side == null
          ? sets || []
          : (sets || []).filter((s) => s.side === side);
      const slots = buildSlots(
        plan,
        sideSets,
        hiddenBySide[key] || [],
        extraIdsBySide[key] || []
      );
      return { side, key, slots };
    });
  }, [sideOrder, sets, plan, hiddenBySide, extraIdsBySide]);

  const handleDraftChange = useCallback((key, next) => {
    setDraftsByKey((prev) => ({ ...prev, [key]: next }));
  }, []);

  const handleDraftClear = useCallback((key) => {
    setDraftsByKey((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const loggedCount = useMemo(
    () => (sets || []).filter((s) => blockSetIsLogged(s)).length,
    [sets]
  );
  const totalCount = useMemo(
    () => grids.reduce((acc, g) => acc + g.slots.length, 0),
    [grids]
  );
  const complete =
    totalCount > 0 &&
    loggedCount >= totalCount &&
    grids.every((g) => g.slots.every((s) => !s.isDraft));

  useEffect(() => {
    onStatsChange?.(se.id, { logged: loggedCount, total: totalCount });
  }, [se.id, loggedCount, totalCount, onStatsChange]);

  const rx = planToRx(plan, weightUnit);
  const namePart =
    se.exerciseName && String(se.exerciseName).trim()
      ? String(se.exerciseName).trim()
      : `Exercise ${se.order}`;

  const useRIR = effortSignal === "rir";
  const useRPE = effortSignal === "rpe";
  const effortLabel = useRIR ? "RIR" : useRPE ? "RPE" : "";

  const persistHidden = useCallback(
    (side, next) => {
      const key = side == null ? "bilat" : side;
      setHiddenBySide((prev) => ({ ...prev, [key]: next }));
      saveHiddenPlannedIndices(sessionId, se.id, next, side);
    },
    [sessionId, se.id]
  );

  const handleRemoveSlot = useCallback(
    async (side, slot, opts) => {
      if (writesFrozen) return;
      const key = side == null ? "bilat" : side;
      const dKey = rowDraftKey(key, slot);
      if (opts?.demoteExtraOnly) {
        setExtraIdsBySide((prev) => ({
          ...prev,
          [key]: (prev[key] || []).filter((id) => id !== slot.extraId),
        }));
        handleDraftClear(dKey);
        return;
      }
      // Logged (or any persisted) set: delete the server row AND drop the
      // planned slot so the card does not leave a blanked row behind.
      if (slot.set && !slot.isDraft) {
        await onDeleteSet?.(slot.set.id, { skipConfirm: true });
        handleDraftClear(dKey);
        if (slot.kind === "planned" && Number.isInteger(slot.planIndex)) {
          const cur = hiddenBySide[key] || [];
          const next = [...new Set([...cur, slot.planIndex])].sort(
            (a, b) => a - b
          );
          persistHidden(side, next);
        } else if (slot.kind === "extra") {
          setExtraIdsBySide((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((id) => id !== slot.extraId),
          }));
        }
        return;
      }
      if (slot.kind === "extra") {
        setExtraIdsBySide((prev) => ({
          ...prev,
          [key]: (prev[key] || []).filter((id) => id !== slot.extraId),
        }));
        handleDraftClear(dKey);
        return;
      }
      if (slot.kind === "planned" && Number.isInteger(slot.planIndex)) {
        const cur = hiddenBySide[key] || [];
        const next = [...new Set([...cur, slot.planIndex])].sort(
          (a, b) => a - b
        );
        persistHidden(side, next);
        handleDraftClear(dKey);
      }
    },
    [writesFrozen, onDeleteSet, hiddenBySide, persistHidden, handleDraftClear]
  );

  function requestPerSideToggle() {
    if (disabled) return;
    const nextOn = !perSideMode;
    if (loggedCount > 0) {
      setPerSideConfirm(nextOn ? "on" : "off");
      return;
    }
    setPerSideOverride(nextOn);
  }

  function confirmPerSideToggle() {
    if (perSideConfirm === "on") setPerSideOverride(true);
    else if (perSideConfirm === "off") setPerSideOverride(false);
    setPerSideConfirm(null);
  }

  const handleAddSet = useCallback(
    (side) => {
      if (writesFrozen || isCompleted) return;
      onActivateExercise?.(se.id);
      const key = side == null ? "bilat" : side;
      extraIdSeqRef.current += 1;
      const id = extraIdSeqRef.current;
      setExtraIdsBySide((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), id],
      }));
    },
    [writesFrozen, isCompleted, onActivateExercise, se.id]
  );

  async function commitLifterNotes() {
    if (writesFrozen || isCompleted) return;
    const draftTrim = lifterNotes.trim();
    const seTrim = String(se.notes ?? "").trim();
    const planTrim = planHasNotesKey(plan)
      ? String(plan.notes ?? "").trim()
      : null;
    const logicalCurrent =
      planTrim != null && seTrim === planTrim ? "" : seTrim;
    if (draftTrim === logicalCurrent) return;
    setNoteError(null);
    try {
      const data = await sessionApi.updateSessionExercise(sessionId, se.id, {
        notes: draftTrim ? draftTrim : null,
      });
      const row = data?.sessionExercise;
      if (row) {
        if (Object.prototype.hasOwnProperty.call(row, "notes")) {
          setLifterNotes(lifterNotesDraftFrom(row, plan));
        }
        onExerciseNotesSaved?.(row);
      }
    } catch (err) {
      setNoteError(err);
      setLifterNotes(lifterNotesDraftFrom(se, plan));
    }
  }

  const disabled = isCompleted || writesFrozen;

  return (
    <Card className="bk-ex bk-log-ex">
      <div className="bk-ex__top">
        <span
          className={`bk-ex__count${complete ? " bk-ex__count--full" : ""}`}
        >
          {`${loggedCount}/${totalCount}`}
        </span>
      </div>

      <h3 className="bk-ex__name">{namePart}</h3>

      {rx ? <ExerciseRx rx={rx} className="bk-log-ex__rx" /> : null}

      {cue ? <p className="bk-ex__notes bk-log-ex__cue">{cue}</p> : null}

      {grids.map(({ side, key, slots }) => (
        <PlannedSetGrid
          key={key}
          side={side}
          slots={slots}
          plan={plan}
          timedExercise={timedExercise}
          effortLabel={effortLabel}
          effortSignal={effortSignal}
          weightUnit={weightUnit}
          disabled={disabled}
          editingSets={editingSets}
          isCompleted={isCompleted}
          draftsByKey={draftsByKey}
          onDraftChange={handleDraftChange}
          onDraftClear={handleDraftClear}
          onPromoteDraftSet={onPromoteDraftSet}
          onUpdateSet={onUpdateSet}
          onRemoveSlot={(slot, opts) => void handleRemoveSlot(side, slot, opts)}
          onActivateExercise={onActivateExercise}
          onAddSet={handleAddSet}
          seId={se.id}
          writesFrozenRef={writesFrozenRef}
        />
      ))}

      {!isCompleted ? (
        <div className="bk-log-ex__actions">
          <button
            type="button"
            className={`bk-log-ex__edit${editingSets ? " bk-log-ex__edit--on" : ""}`}
            aria-pressed={editingSets}
            onClick={() => {
              setEditingSets((v) => !v);
              setPerSideConfirm(null);
            }}
            disabled={disabled}
          >
            {editingSets ? "Done" : "Edit sets"}
          </button>
          {perSideConfirm ? (
            <div
              className="bk-log-side-confirm"
              role="group"
              aria-label="Confirm per-side logging change"
            >
              <p className="bk-log-side-confirm__q">
                {perSideConfirm === "on"
                  ? "Log each side separately? Existing logged sets stay; the grid splits into Left and Right."
                  : "Turn off per-side logging? Existing logged sets stay on the combined grid."}
              </p>
              <button
                type="button"
                className="bk-log-side-confirm__btn bk-log-side-confirm__btn--go"
                onClick={confirmPerSideToggle}
                disabled={disabled}
              >
                Switch
              </button>
              <button
                type="button"
                className="bk-log-side-confirm__btn"
                onClick={() => setPerSideConfirm(null)}
                disabled={disabled}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`bk-log-side-chip${perSideMode ? " bk-log-side-chip--on" : ""}`}
              title="Log left and right sides separately"
              aria-label="Per side"
              aria-pressed={perSideMode}
              onClick={requestPerSideToggle}
              disabled={disabled}
            >
              Per side
            </button>
          )}
          <button
            type="button"
            className="bk-log-ex__note-link"
            onClick={() => {
              setLifterNoteOpen((v) => {
                const next = !v;
                if (next) {
                  setLifterNotes(lifterNotesDraftFrom(se, plan));
                }
                return next;
              });
            }}
            disabled={disabled}
          >
            {lifterNoteOpen
              ? "Hide note"
              : lifterHasNote
                ? "Edit note"
                : "+ Note"}
          </button>
        </div>
      ) : null}

      {lifterHasNote && !lifterNoteOpen && !isCompleted ? (
        <p className="bk-log-ex__lifter-shown">{String(se.notes).trim()}</p>
      ) : null}

      {lifterNoteOpen && !isCompleted ? (
        <label className="bk-log-ex__lifter-note">
          <span className="bk-log-ex__lifter-note-label">Your note</span>
          <textarea
            rows={2}
            value={lifterNotes}
            onChange={(e) => setLifterNotes(e.target.value)}
            onBlur={() => void commitLifterNotes()}
            placeholder="Stance, injury caution, equipment…"
            disabled={disabled}
          />
          {noteError ? (
            <span className="bk-log-ex__note-err" role="status">
              Couldn't save note
            </span>
          ) : null}
        </label>
      ) : null}

      {coach ? (
        <Disclosure summary="Coach note" className="bk-log-ex__coach">
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{coach}</p>
        </Disclosure>
      ) : null}
    </Card>
  );
}
