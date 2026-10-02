import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NumField } from "../ui/NumField.jsx";
import { EffortCapWarn } from "./EffortCapWarn.jsx";
import { parseSeconds } from "./parseSeconds.js";
import { isOverEffortCap } from "./planHelpers.js";
import {
  doseGhostFromPlan,
  effortGhostFromPlan,
  fillDraftFromPlanExceptEffort,
  weightGhostFromPlan,
} from "./ghostPlaceholders.js";
import "../../../styles/blocks/bk-ui.css";
import "../../../styles/blocks/bk-log.css";

export function blankRowDraft() {
  return { reps: "", weight: "", rpe: "", rir: "", notes: "", durationSec: "" };
}

function draftFromSet(set) {
  return {
    reps: set?.reps ?? "",
    weight: set?.weight ?? "",
    rpe: set?.rpe ?? "",
    rir: set?.rir ?? "",
    notes: set?.notes ?? "",
    durationSec: set?.durationSec != null ? String(set.durationSec) : "",
  };
}

function isBlankDraft(d) {
  const t = (v) => (v == null ? "" : String(v)).trim();
  return (
    t(d.weight) === "" &&
    t(d.reps) === "" &&
    t(d.durationSec) === "" &&
    t(d.rir) === "" &&
    t(d.rpe) === "" &&
    t(d.notes) === ""
  );
}

/** Block-day: a row is LOGGED only when it has reps or seconds (not weight/effort alone). */
export function blockDraftHasDose(d, timedMode) {
  if (!d) return false;
  if (timedMode) return parseSeconds(d.durationSec) != null;
  return String(d.reps ?? "").trim() !== "";
}

/** Persisted set counts as logged iff it has reps or seconds. */
export function blockSetIsLogged(set) {
  if (!set || typeof set !== "object") return false;
  const t = (v) => (v == null ? "" : String(v)).trim();
  if (t(set.durationSec) !== "") return true;
  return t(set.reps) !== "";
}

function isNonIntegerRir(v) {
  const t = String(v ?? "").trim();
  if (t === "") return false;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return true;
  const n = Number(t);
  return Number.isFinite(n) && !Number.isInteger(n);
}

/** POST body fields from draft (omit blanks). Never invents effort. */
function promotionPayloadFromDraft(d) {
  const payload = {};
  const t = (v) => (v == null ? "" : String(v)).trim();
  const dur = parseSeconds(d.durationSec);
  if (dur != null) {
    payload.durationSec = dur;
  } else if (t(d.reps) !== "") {
    payload.reps = Number(String(d.reps).trim());
  }
  if (t(d.weight) !== "") payload.weight = Number(String(d.weight).trim());
  if (t(d.rpe) !== "") payload.rpe = Number(String(d.rpe).trim());
  if (t(d.rir) !== "") payload.rir = Number(String(d.rir).trim());
  const n = t(d.notes);
  if (n) payload.notes = n;
  return payload;
}

function payloadKey(p) {
  return JSON.stringify(p);
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/**
 * One planned / logged set row for the block-day logger.
 * Ghosts are placeholders only; chk tap fills from plan except effort.
 * Draft values may be owned by the parent (keyed by planned row identity).
 */
export const BlockSetRow = memo(function BlockSetRow({
  setNumber,
  isDraft = false,
  set = null,
  plan = null,
  planSet = null,
  timedMode = false,
  effortSignal = null,
  weightUnit = "lb",
  disabled = false,
  editingSets = false,
  /** When false, set number is not a control and promote/chk never create a set. */
  canLogAsPlanned = true,
  ownedDraft = null,
  onOwnedDraftChange = null,
  onPromoteDraft,
  onUpdateSet,
  onRemove,
  onInteractStart,
  writesFrozenRef,
}) {
  const rootRef = useRef(null);
  const noteInputRef = useRef(null);
  const managedDraft = isDraft && typeof onOwnedDraftChange === "function";
  const [localDraft, setLocalDraft] = useState(() =>
    isDraft ? blankRowDraft() : draftFromSet(set)
  );
  const draft = managedDraft ? ownedDraft ?? blankRowDraft() : localDraft;
  const draftRef = useRef(draft);
  const canLogRef = useRef(canLogAsPlanned);
  const promotingRef = useRef(false);
  const lastSentKeyRef = useRef(null);
  // A row that just stopped being a parent-owned draft (its set was created)
  // has a stale blank localDraft; it must adopt the saved set even while
  // focus sits inside the row (the tapped set number), or the autosave
  // PATCHes blanks over the new set (bksf3b landing fix).
  const wasManagedRef = useRef(managedDraft);
  const [noteOpen, setNoteOpen] = useState(() =>
    Boolean(set?.notes && String(set.notes).trim())
  );
  const [rirHint, setRirHint] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const useRIR = effortSignal === "rir";
  const useRPE = effortSignal === "rpe";

  canLogRef.current = canLogAsPlanned;

  const setDraft = useCallback(
    (updater) => {
      if (managedDraft) {
        const cur = ownedDraft ?? blankRowDraft();
        const next = typeof updater === "function" ? updater(cur) : updater;
        onOwnedDraftChange(next);
        return;
      }
      setLocalDraft(updater);
    },
    [managedDraft, ownedDraft, onOwnedDraftChange]
  );

  useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const justLeftManaged = wasManagedRef.current && !managedDraft;
    wasManagedRef.current = managedDraft;
    // Parent-owned drafts must never be wiped or reassigned here.
    if (managedDraft) return;
    if (isDraft) {
      const empty = blankRowDraft();
      setLocalDraft(empty);
      draftRef.current = empty;
      lastSentKeyRef.current = null;
      setRirHint(null);
      setConfirmRemove(false);
      return;
    }
    const next = draftFromSet(set);
    const echoedKey = payloadKey(promotionPayloadFromDraft(next));
    if (echoedKey === payloadKey(promotionPayloadFromDraft(draftRef.current))) {
      lastSentKeyRef.current = echoedKey;
      return;
    }
    if (!justLeftManaged && rootRef.current?.contains(document.activeElement)) {
      lastSentKeyRef.current = echoedKey;
      return;
    }
    setLocalDraft(next);
    draftRef.current = next;
    lastSentKeyRef.current = echoedKey;
    if (next.notes && String(next.notes).trim()) setNoteOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    managedDraft,
    isDraft,
    set?.id,
    set?.reps,
    set?.weight,
    set?.rpe,
    set?.rir,
    set?.notes,
    set?.durationSec,
  ]);

  useEffect(() => {
    if (!confirmRemove) return;
    const t = setTimeout(() => setConfirmRemove(false), 5000);
    return () => clearTimeout(t);
  }, [confirmRemove]);

  const tryPromote = useCallback(async () => {
    if (!isDraft) return;
    if (!canLogRef.current) return;
    if (writesFrozenRef?.current) return;
    if (promotingRef.current) return;
    const cur = draftRef.current;
    if (isBlankDraft(cur)) return;
    // Gate: weight/effort alone stays a local draft - never create server-side.
    if (!blockDraftHasDose(cur, timedMode)) return;
    if (isNonIntegerRir(cur.rir)) {
      setRirHint("Whole numbers only");
      return;
    }
    const k = payloadKey(promotionPayloadFromDraft(cur));
    if (k === lastSentKeyRef.current) return;
    promotingRef.current = true;
    try {
      const created = await onPromoteDraft(cur);
      if (writesFrozenRef?.current) return;
      lastSentKeyRef.current = k;
      if (created && created.id != null && onUpdateSet) {
        const latest = draftRef.current;
        if (isNonIntegerRir(latest.rir)) {
          setRirHint("Whole numbers only");
          return;
        }
        const latestKey = payloadKey(promotionPayloadFromDraft(latest));
        if (latestKey !== k) {
          lastSentKeyRef.current = latestKey;
          const patch = {
            order: created.order,
            weight: latest.weight === "" ? "" : Number(latest.weight),
            rpe: latest.rpe === "" ? "" : Number(latest.rpe),
            rir: latest.rir === "" ? "" : Number(latest.rir),
            notes: latest.notes === "" ? "" : latest.notes,
          };
          if (timedMode) {
            const sec = parseSeconds(latest.durationSec);
            patch.durationSec = sec == null ? "" : sec;
            patch.reps = "";
          } else {
            patch.reps = latest.reps === "" ? "" : Number(latest.reps);
          }
          onUpdateSet(created.id, patch);
        }
      }
    } catch {
      lastSentKeyRef.current = null;
    } finally {
      promotingRef.current = false;
    }
  }, [isDraft, onPromoteDraft, onUpdateSet, timedMode, writesFrozenRef]);

  function flushNow() {
    if (isDraft || disabled || writesFrozenRef?.current) return;
    if (isNonIntegerRir(draftRef.current.rir)) {
      setRirHint("Whole numbers only");
      return;
    }
    const latest = (() => {
      const d = draftRef.current;
      const payload = { order: Number(set.order) };
      if (timedMode) {
        const sec = parseSeconds(d.durationSec);
        payload.durationSec = sec == null ? "" : sec;
        payload.reps = "";
      } else {
        payload.reps = d.reps === "" ? "" : Number(d.reps);
      }
      payload.weight = d.weight === "" ? "" : Number(d.weight);
      payload.rpe = d.rpe === "" ? "" : Number(d.rpe);
      payload.rir =
        d.rir === "" || isNonIntegerRir(d.rir) ? "" : Number(d.rir);
      payload.notes = d.notes === "" ? "" : d.notes;
      return payload;
    })();
    const k = payloadKey(latest);
    if (k === lastSentKeyRef.current) return;
    lastSentKeyRef.current = k;
    onUpdateSet(set.id, latest);
  }

  function onFieldBlur() {
    if (isDraft) void tryPromote();
    else flushNow();
  }

  useEffect(() => {
    if (writesFrozenRef?.current) return;
    if (isDraft) {
      if (!canLogRef.current) return;
      const cur = draftRef.current;
      if (isBlankDraft(cur)) return;
      if (!blockDraftHasDose(cur, timedMode)) return;
      if (isNonIntegerRir(cur.rir)) return;
      const k = payloadKey(promotionPayloadFromDraft(cur));
      if (k === lastSentKeyRef.current) return;
      const t = setTimeout(() => {
        if (writesFrozenRef?.current) return;
        if (!canLogRef.current) return;
        void tryPromote();
      }, 900);
      return () => clearTimeout(t);
    }
    if (disabled) return;
    if (isNonIntegerRir(draft.rir)) return;
    const t = setTimeout(() => flushNow(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, disabled, isDraft, tryPromote, timedMode]);

  async function onChkTap() {
    if (!canLogRef.current) return;
    if (disabled || writesFrozenRef?.current) return;
    onInteractStart?.();
    const filled = fillDraftFromPlanExceptEffort(draftRef.current, planSet, timedMode);
    setDraft(filled);
    draftRef.current = filled;
    if (isBlankDraft(filled)) return;
    if (isDraft) {
      await tryPromote();
      return;
    }
    // Incomplete persisted row (should be rare after the dose gate): patch blanks from plan.
    if (!blockSetIsLogged(set) && onUpdateSet && set?.id != null) {
      const patch = { order: Number(set.order) };
      if (timedMode) {
        const sec = parseSeconds(filled.durationSec);
        patch.durationSec = sec == null ? "" : sec;
        patch.reps = "";
      } else {
        patch.reps = filled.reps === "" ? "" : Number(filled.reps);
      }
      patch.weight = filled.weight === "" ? "" : Number(filled.weight);
      // Never invent effort from the plan on chk tap.
      patch.rpe = filled.rpe === "" ? "" : Number(filled.rpe);
      patch.rir = filled.rir === "" ? "" : Number(filled.rir);
      patch.notes = filled.notes === "" ? "" : filled.notes;
      onUpdateSet(set.id, patch);
    }
  }

  function onFocusField(e) {
    onInteractStart?.();
    const el = e.currentTarget;
    requestAnimationFrame(() => {
      el.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    });
  }

  function openNote() {
    onInteractStart?.();
    setNoteOpen(true);
    requestAnimationFrame(() => {
      noteInputRef.current?.focus?.();
      noteInputRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    });
  }

  function requestRemove() {
    if (disabled || !onRemove) return;
    onInteractStart?.();
    const counted = isDraft ? false : blockSetIsLogged(set);
    if (counted) {
      setConfirmRemove(true);
      return;
    }
    onRemove();
  }

  function confirmRemoveYes() {
    setConfirmRemove(false);
    onRemove?.();
  }

  const dosePh = doseGhostFromPlan(planSet, timedMode);
  const weightPh = weightGhostFromPlan(planSet, weightUnit);
  const effortPh = effortSignal
    ? effortGhostFromPlan(plan, planSet, effortSignal)
    : "—";

  const overCap = isOverEffortCap(plan, planSet, draft.rpe, draft.rir);
  const hasNote = Boolean(String(draft.notes ?? "").trim());
  // Check mark iff the row is counted (reps/seconds present) - matches counters.
  const done = isDraft
    ? false
    : blockSetIsLogged(set) || blockDraftHasDose(draft, timedMode);

  const fieldIds = useMemo(() => {
    const base = isDraft
      ? `bk-draft-${setNumber}`
      : `bk-set-${set?.id ?? setNumber}`;
    return {
      dose: `${base}-dose`,
      weight: `${base}-weight`,
      effort: `${base}-effort`,
      notes: `${base}-notes`,
    };
  }, [isDraft, set?.id, setNumber]);

  const showLogControl = done || canLogAsPlanned;

  return (
    <div
      ref={rootRef}
      className={`bk-log-set${done ? " bk-log-set--done" : ""}`}
      data-session-set-id={set?.id ?? undefined}
      data-bk-set-num={setNumber}
    >
      <div
        className="bk-log-set__main"
        style={{
          gridTemplateColumns: useRPE || useRIR
            ? "40px repeat(3, minmax(0, 1fr)) 34px"
            : "40px repeat(2, minmax(0, 1fr)) 34px",
        }}
      >
        {showLogControl ? (
          <button
            type="button"
            className={`bk-set-num${done ? " bk-set-num--done" : ""}`}
            onClick={() => void onChkTap()}
            disabled={disabled}
            aria-label={done ? `Set ${setNumber} logged` : `Log set ${setNumber} as planned`}
            title={done ? "Logged" : "Log as planned"}
          >
            {done ? "✓" : setNumber}
          </button>
        ) : (
          <span className="bk-set-num bk-set-num--idle" aria-hidden="true">
            {setNumber}
          </span>
        )}

        <NumField
          id={fieldIds.dose}
          className="bk-log-field"
          value={timedMode ? draft.durationSec : draft.reps}
          placeholder={dosePh}
          inputMode="numeric"
          disabled={disabled}
          onFocus={onFocusField}
          onChange={(e) =>
            setDraft((d) =>
              timedMode
                ? { ...d, durationSec: e.target.value }
                : { ...d, reps: e.target.value }
            )
          }
          onBlur={onFieldBlur}
          aria-label={timedMode ? "Seconds" : "Reps"}
        />

        <NumField
          id={fieldIds.weight}
          className="bk-log-field"
          value={draft.weight}
          placeholder={weightPh}
          inputMode="decimal"
          disabled={disabled}
          onFocus={onFocusField}
          onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
          onBlur={onFieldBlur}
          aria-label="Weight"
        />

        {useRPE || useRIR ? (
          <div className="bk-log-effort-wrap">
            <NumField
              id={fieldIds.effort}
              className={`bk-log-field${overCap ? " bk-log-field--over-cap" : ""}`}
              value={useRIR ? draft.rir : draft.rpe}
              placeholder={effortPh}
              inputMode="decimal"
              disabled={disabled}
              onFocus={onFocusField}
              onChange={(e) => {
                if (useRIR) {
                  const v = e.target.value;
                  if (v === "" || /^\d*$/.test(v)) {
                    setRirHint(null);
                    setDraft((d) => ({ ...d, rir: v }));
                  } else {
                    setRirHint("Whole numbers only");
                  }
                } else {
                  setDraft((d) => ({ ...d, rpe: e.target.value }));
                }
              }}
              onBlur={onFieldBlur}
              aria-label={useRIR ? "RIR" : "RPE"}
            />
            {overCap ? <EffortCapWarn show /> : null}
            {rirHint ? <span className="bk-log-rir-hint">{rirHint}</span> : null}
          </div>
        ) : null}

        {editingSets && onRemove ? (
          <button
            type="button"
            className="bk-log-remove"
            onClick={requestRemove}
            disabled={disabled}
            aria-label={`Remove set ${setNumber}`}
            title="Remove"
          >
            ×
          </button>
        ) : (
          <button
            type="button"
            className={`bk-log-nb${hasNote ? " bk-log-nb--has" : ""}`}
            onClick={() => {
              if (noteOpen) {
                setNoteOpen(false);
                return;
              }
              openNote();
            }}
            disabled={disabled}
            aria-label={
              noteOpen
                ? "Close set note"
                : hasNote
                  ? "Edit set note"
                  : "Add set note"
            }
            aria-pressed={noteOpen}
            title="Set note"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {confirmRemove ? (
        <div className="bk-log-remove-confirm" role="group" aria-label={`Confirm remove set ${setNumber}`}>
          <p className="bk-log-remove-confirm__q">Remove this logged set?</p>
          <button
            type="button"
            className="bk-log-remove-confirm__btn bk-log-remove-confirm__btn--go"
            onClick={confirmRemoveYes}
            disabled={disabled}
          >
            Remove
          </button>
          <button
            type="button"
            className="bk-log-remove-confirm__btn"
            onClick={() => setConfirmRemove(false)}
            disabled={disabled}
          >
            Keep
          </button>
        </div>
      ) : null}

      {noteOpen ? (
        <div className="bk-log-felt">
          <input
            ref={noteInputRef}
            id={fieldIds.notes}
            type="text"
            className="bk-log-felt__input"
            value={draft.notes}
            placeholder="How that set felt"
            disabled={disabled}
            onFocus={onFocusField}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            onBlur={onFieldBlur}
            aria-label="Set note"
          />
        </div>
      ) : hasNote ? (
        <p className="bk-log-felt-text">{`"${String(draft.notes).trim()}"`}</p>
      ) : null}
    </div>
  );
});

BlockSetRow.displayName = "BlockSetRow";
