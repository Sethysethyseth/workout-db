import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card } from "../ui/Card.jsx";
import { Chip } from "../ui/Chip.jsx";
import { ExerciseRx } from "../ui/ExerciseRx.jsx";
import { NumField } from "../ui/NumField.jsx";
import { Segmented } from "../ui/Segmented.jsx";
import { Stepper } from "../ui/Stepper.jsx";
import { formatRest } from "../ui/rxFormat.js";
import {
  exerciseRxSummary,
  slotBadge,
} from "./blockBuilderState.js";
import { exerciseNameImpliesPerSide } from "../log/perSideMode.js";
import { BuilderSheet, useOverlayFocus } from "./BuilderSheet.jsx";
import { ExerciseSettingSheet } from "./ExerciseSettingSheet.jsx";

const REST_PRESETS = [
  { sec: 0, label: "None" },
  { sec: 60, label: "1:00" },
  { sec: 90, label: "1:30" },
  { sec: 120, label: "2:00" },
  { sec: 180, label: "3:00" },
];

function fieldValue(v) {
  return v == null || v === "" ? "" : String(v);
}

function parseNum(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function firstNotesLine(notes) {
  const t = String(notes || "").trim();
  if (!t) return null;
  return t.split(/\r?\n/)[0];
}

function truncateNote(notes, max = 18) {
  const t = String(notes || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1))}…`;
}

function restFormat(sec) {
  if (sec == null || sec === 0) return { text: "None", ariaLabel: "No rest" };
  const t = formatRest(sec);
  if (!t) return { text: "None", ariaLabel: "No rest" };
  return typeof t === "string" ? { text: t, ariaLabel: `Rest ${t}` } : t;
}

function modeChipText(sets, timed, rangeOn) {
  if (timed) return "Time";
  if (!rangeOn) return "Reps";
  const withRange = sets.find(
    (s) => s.reps != null && s.reps !== "" && s.repsMax != null && s.repsMax !== ""
  );
  if (withRange) return `Reps ${withRange.reps}-${withRange.repsMax}`;
  const anyMax = sets.find((s) => s.repsMax != null && s.repsMax !== "");
  if (anyMax && anyMax.reps != null && anyMax.reps !== "") {
    return `Reps ${anyMax.reps}-${anyMax.repsMax}`;
  }
  return "Reps";
}

function setGridLineClassName(kind, { rangeOn, showEffort }) {
  const parts = [`bk-set-grid__${kind}`];
  if (rangeOn) parts.push(`bk-set-grid__${kind}--range`);
  if (showEffort) parts.push(`bk-set-grid__${kind}--effort`);
  return parts.join(" ");
}

function ClockIcon() {
  return (
    <svg className="bk-ex-card__chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="bk-ex-card__chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="bk-ex-card__chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const REORDER_SKIP =
  "input, textarea, select, .bk-sheet, .bk-builder-confirm, .bk-ex-card__menu-btn, .bk-ex-card__chip, .bk-ex-card__ctrl";

function bindReorderPointer(pointer) {
  if (!pointer?.onPointerDown) return pointer || {};
  return {
    ...pointer,
    onPointerDown: (e) => {
      const target = e.target;
      if (target instanceof Element && target.closest(REORDER_SKIP)) return;
      pointer.onPointerDown(e);
    },
  };
}

function ActionIcon({ children }) {
  return (
    <svg
      className="bk-ex-actions__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Collapsed / expanded exercise card.
 * `readOnly` — no edit affordances, never expands into editors (BK6 preview).
 */
export function ExerciseCard({
  exercise,
  index,
  effort = "none",
  unit = "lb",
  expanded = false,
  readOnly = false,
  invalid = false,
  canMoveUp = true,
  canMoveDown = true,
  onToggle,
  onChange,
  onAddSet,
  onDeleteSet,
  onFillAll,
  onToggleTimed,
  onToggleRange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onReplace,
  onDelete,
  onAddToLibrary,
  compact = false,
  cardRef,
  reorderClassName,
  reorderStyle,
  reorderPointer,
}) {
  const gridRef = useRef(null);
  const cancelRemoveRef = useRef(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [settingSheet, setSettingSheet] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useOverlayFocus({
    open: confirmRemove,
    onClose: () => setConfirmRemove(false),
    focusRef: cancelRemoveRef,
  });

  const cardNodeRef = useRef(null);
  const fullHeightRef = useRef(null);
  const wasCompactRef = useRef(false);
  const compactRef = useRef(compact);
  compactRef.current = compact;
  const [holdBox, setHoldBox] = useState(null);

  function assignCard(el) {
    cardNodeRef.current = el;
    cardRef?.(el);
  }

  useLayoutEffect(() => {
    const el = cardNodeRef.current;
    if (!el || compact || holdBox) return;
    fullHeightRef.current = el.getBoundingClientRect().height;
  });

  useLayoutEffect(() => {
    const el = cardNodeRef.current;
    if (!el) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    if (compact) {
      wasCompactRef.current = true;
      if (reduce) {
        setHoldBox({ height: 48, animate: false });
        return undefined;
      }
      const from = fullHeightRef.current || el.getBoundingClientRect().height;
      setHoldBox({ height: from, animate: false });
      const id = requestAnimationFrame(() => {
        if (compactRef.current) setHoldBox({ height: 48, animate: true });
      });
      return () => cancelAnimationFrame(id);
    }
    if (!wasCompactRef.current) return undefined;
    wasCompactRef.current = false;
    if (reduce) {
      setHoldBox(null);
      return undefined;
    }
    const previousHeight = el.style.height;
    el.style.height = "auto";
    const target = Math.round(el.getBoundingClientRect().height);
    el.style.height = previousHeight || "48px";
    setHoldBox({ height: 48, animate: false });
    const id = requestAnimationFrame(() => {
      if (!compactRef.current) setHoldBox({ height: target, animate: true });
    });
    return () => cancelAnimationFrame(id);
  }, [compact]);

  useEffect(() => {
    if (compact || !holdBox?.animate) return undefined;
    const el = cardNodeRef.current;
    if (!el) return undefined;
    let cleared = false;
    function clear() {
      if (cleared || compactRef.current) return;
      cleared = true;
      setHoldBox(null);
    }
    function onEnd(e) {
      if (e.propertyName === "height" && e.target === el) clear();
    }
    el.addEventListener("transitionend", onEnd);
    const timer = window.setTimeout(clear, 260);
    return () => {
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
    };
  }, [compact, holdBox]);

  const summary = exerciseRxSummary(exercise, { effort, unit });
  const notesLine = firstNotesLine(exercise?.notes);
  const sets = exercise?.sets || [];
  const timed = sets.length > 0 && sets.every((s) => s.durationSec != null && s.durationSec !== "");
  const rangeOn = sets.some((s) => s.repsMax != null && s.repsMax !== "");
  const restSec = exercise?.restSec == null ? 0 : Number(exercise.restSec);
  const showEffort = effort === "rpe" || effort === "rir";
  const effortLabel = effort === "rir" ? "RIR" : "RPE";
  const lineMods = { rangeOn: rangeOn && !timed, showEffort };
  const headClass = setGridLineClassName("head", lineMods);
  const rowClass = setGridLineClassName("row", lineMods);
  const noteText = truncateNote(exercise?.notes);
  const restChipText =
    restSec > 0 ? `Rest ${formatRest(restSec) || restSec}` : "Rest";
  const modeText = modeChipText(sets, timed, rangeOn);
  const effortCap = Boolean(exercise?.effortCap);
  const effortChipText = effortCap
    ? `${effortLabel} cap`
    : `${effortLabel} target`;
  const nameImpliesPerSide = exerciseNameImpliesPerSide(exercise?.exerciseName);
  const perSideShown =
    exercise?.perSide === true || exercise?.perSide === false
      ? exercise.perSide
      : nameImpliesPerSide;
  const showPerSideChip = exercise?.perSide === true || nameImpliesPerSide;

  function onFieldKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const root = gridRef.current;
    if (!root) return;
    const fields = [...root.querySelectorAll("input.bk-num-field")];
    const idx = fields.indexOf(e.target);
    if (idx >= 0 && idx < fields.length - 1) {
      fields[idx + 1].focus();
      fields[idx + 1].select?.();
    }
  }

  function patchSet(setIdx, patch) {
    onChange?.({
      sets: sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)),
    });
  }

  function closeActions() {
    setActionsOpen(false);
  }

  function runAction(fn) {
    fn?.();
    closeActions();
  }

  function setRest(sec) {
    onChange?.({ restSec: sec === 0 ? null : sec });
  }

  const setCount = sets.length;
  const holdSetsLabel = `${setCount} ${setCount === 1 ? "set" : "sets"}`;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const lifting = (reorderClassName || "").includes("bk-pill--lifting");
  const shellStyle = { ...(reorderStyle || {}) };
  if (holdBox) {
    shellStyle.height = `${holdBox.height}px`;
    shellStyle.overflow = "hidden";
    shellStyle.transition =
      reduceMotion || !holdBox.animate
        ? "none"
        : lifting
          ? "height 200ms ease-out, padding 200ms ease-out, box-shadow 150ms ease-out, scale 150ms ease-out"
          : "height 200ms ease-out, padding 200ms ease-out, transform 150ms ease-out, box-shadow 160ms ease-out, border-color 160ms ease-out";
  }
  const shellPointer = bindReorderPointer(reorderPointer);

  function cardClass(fallback) {
    const base = reorderClassName || fallback;
    return compact ? `${base} bk-ex-card--hold` : base;
  }

  if (compact) {
    return (
      <Card
        ref={assignCard}
        className={cardClass(
          `bk-ex-card${invalid ? " bk-ex-card--invalid" : ""}${readOnly ? " bk-ex-card--readonly" : ""}`
        )}
        style={Object.keys(shellStyle).length ? shellStyle : undefined}
        {...shellPointer}
      >
        <div className="bk-ex-card__hold-row">
          <h3 className="bk-ex-card__name">{exercise?.exerciseName || "Untitled"}</h3>
          <span className="bk-ex-card__hold-sets">{holdSetsLabel}</span>
        </div>
      </Card>
    );
  }

  if (!expanded || readOnly) {
    return (
      <Card
        ref={assignCard}
        className={cardClass(
          `bk-ex-card${invalid ? " bk-ex-card--invalid" : ""}${readOnly ? " bk-ex-card--readonly" : ""}`
        )}
        style={Object.keys(shellStyle).length ? shellStyle : undefined}
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly ? undefined : 0}
        aria-expanded={readOnly ? undefined : false}
        onClick={readOnly ? undefined : onToggle}
        onKeyDown={
          readOnly
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle?.();
                }
              }
        }
        {...shellPointer}
      >
        <div className="bk-ex-card__top">
          <span className="bk-ex-card__slot">{slotBadge(index)}</span>
          <h3 className="bk-ex-card__name">{exercise?.exerciseName || "Untitled"}</h3>
          {readOnly ? null : (
            <span className="bk-ex-card__chev" aria-hidden="true">
              ▾
            </span>
          )}
        </div>
        <div className="bk-ex-card__summary-line">
          {summary.uniform ? (
            <ExerciseRx rx={summary.rx} suffix={perSideShown ? "each side" : null} />
          ) : (
            <p className="bk-rx bk-rx--summary">
              {summary.summary}
              {perSideShown ? " · each side" : ""}
            </p>
          )}
          {exercise?.notInLibrary ? <Chip tone="warn">Not in library</Chip> : null}
        </div>
        {notesLine ? <p className="bk-ex-card__notes">{notesLine}</p> : null}
      </Card>
    );
  }

  const exerciseName = exercise?.exerciseName || "Untitled";

  return (
    <Card
      ref={assignCard}
      className={cardClass(
        `bk-ex-card bk-ex-card--expanded${invalid ? " bk-ex-card--invalid" : ""}`
      )}
      style={Object.keys(shellStyle).length ? shellStyle : undefined}
      data-ex-id={exercise?.id}
      {...shellPointer}
    >
      <div className="bk-ex-card__head">
        <button
          type="button"
          className="bk-ex-card__collapse"
          onClick={onToggle}
          aria-expanded="true"
        >
          <span className="bk-ex-card__slot">{slotBadge(index)}</span>
          <h3 className="bk-ex-card__name">{exerciseName}</h3>
        </button>
        <button
          type="button"
          className="bk-ex-card__menu-btn"
          aria-label="Exercise actions"
          aria-haspopup="dialog"
          aria-expanded={actionsOpen}
          onClick={() => setActionsOpen(true)}
        >
          …
        </button>
      </div>

      {exercise?.notInLibrary ? (
        <div className="bk-ex-card__summary-line">
          <Chip tone="warn">Not in library</Chip>
        </div>
      ) : null}

      <div className="bk-ex-card__chips">
        <button
          type="button"
          className="bk-ex-card__chip"
          onClick={() => setSettingSheet("rest")}
        >
          <ClockIcon />
          <span>{restChipText}</span>
        </button>
        <button
          type="button"
          className="bk-ex-card__chip"
          onClick={() => setSettingSheet("mode")}
        >
          <span>{modeText}</span>
        </button>
        {showPerSideChip ? (
          <button
            type="button"
            className={`bk-ex-card__chip${perSideShown ? "" : " bk-ex-card__chip--muted"}`}
            aria-pressed={perSideShown}
            aria-label="Per side"
            onClick={() => onChange?.({ perSide: !perSideShown })}
          >
            {perSideShown ? <CheckIcon /> : null}
            <span>Per side</span>
          </button>
        ) : null}
        {showEffort ? (
          <button
            type="button"
            className="bk-ex-card__chip"
            onClick={() => setSettingSheet("effort")}
          >
            <span>{effortChipText}</span>
          </button>
        ) : null}
        <button
          type="button"
          className={`bk-ex-card__chip${noteText ? "" : " bk-ex-card__chip--muted"}`}
          onClick={() => setSettingSheet("notes")}
        >
          <PencilIcon />
          <span>{noteText || "+ Note"}</span>
        </button>
      </div>

      <div className="bk-set-grid" ref={gridRef}>
        <div className={headClass} aria-hidden="true">
          <span className="bk-set-grid__h bk-set-grid__h--set">SET</span>
          <span className="bk-set-grid__h">{timed ? "SEC" : "REPS"}</span>
          {rangeOn && !timed ? <span className="bk-set-grid__h">TO</span> : null}
          <span className="bk-set-grid__h">LOAD</span>
          {showEffort ? <span className="bk-set-grid__h">{effortLabel}</span> : null}
          <span className="bk-set-grid__h bk-set-grid__h--spacer" />
        </div>
        {sets.map((s, si) => (
          <div className="bk-set-grid__set" key={s.id || si}>
            <div className={rowClass}>
              <span className="bk-set-grid__num" aria-label={`Set ${si + 1}`}>
                {si + 1}
              </span>
              {timed ? (
                <NumField
                  placeholder="sec"
                  inputMode="numeric"
                  value={fieldValue(s.durationSec)}
                  onChange={(e) => patchSet(si, { durationSec: parseNum(e.target.value) })}
                  onKeyDown={onFieldKeyDown}
                  aria-label={`Set ${si + 1} seconds`}
                />
              ) : (
                <NumField
                  placeholder="reps"
                  inputMode="numeric"
                  value={fieldValue(s.reps)}
                  onChange={(e) => patchSet(si, { reps: parseNum(e.target.value) })}
                  onKeyDown={onFieldKeyDown}
                  aria-label={`Set ${si + 1} reps`}
                />
              )}
              {rangeOn && !timed ? (
                <NumField
                  placeholder="max"
                  inputMode="numeric"
                  value={fieldValue(s.repsMax)}
                  onChange={(e) => patchSet(si, { repsMax: parseNum(e.target.value) })}
                  onKeyDown={onFieldKeyDown}
                  aria-label={`Set ${si + 1} reps max`}
                />
              ) : null}
              <NumField
                placeholder={unit}
                inputMode="decimal"
                value={fieldValue(s.weight)}
                onChange={(e) => patchSet(si, { weight: parseNum(e.target.value) })}
                onKeyDown={onFieldKeyDown}
                aria-label={`Set ${si + 1} load`}
              />
              {showEffort ? (
                <label className="bk-set-grid__effort">
                  <span className="bk-set-grid__effort-label">{effortLabel}</span>
                  <NumField
                    placeholder={effortLabel}
                    inputMode="decimal"
                    value={fieldValue(effort === "rir" ? s.rir : s.rpe)}
                    onChange={(e) =>
                      patchSet(
                        si,
                        effort === "rir"
                          ? { rir: parseNum(e.target.value) }
                          : { rpe: parseNum(e.target.value) }
                      )
                    }
                    onKeyDown={onFieldKeyDown}
                    aria-label={`Set ${si + 1} ${effortLabel}`}
                  />
                </label>
              ) : null}
              <button
                type="button"
                className="bk-set-grid__remove"
                aria-label={`Remove set ${si + 1}`}
                disabled={sets.length <= 1}
                onClick={() => onDeleteSet?.(si)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bk-ex-card__controls">
        <button type="button" className="bk-ex-card__ctrl" onClick={onAddSet}>
          + Set
        </button>
      </div>

      <BuilderSheet
        open={actionsOpen}
        title={exerciseName}
        onClose={closeActions}
        className="bk-sheet--ex-actions"
      >
        <div className="bk-ex-actions">
          <button
            type="button"
            className="bk-ex-actions__row"
            disabled={!canMoveUp}
            onClick={() => runAction(onMoveUp)}
          >
            <ActionIcon>
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Move up</span>
          </button>
          <button
            type="button"
            className="bk-ex-actions__row"
            disabled={!canMoveDown}
            onClick={() => runAction(onMoveDown)}
          >
            <ActionIcon>
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Move down</span>
          </button>
          <button
            type="button"
            className="bk-ex-actions__row"
            onClick={() => runAction(onDuplicate)}
          >
            <ActionIcon>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Duplicate</span>
          </button>
          <button
            type="button"
            className="bk-ex-actions__row"
            onClick={() => runAction(onReplace)}
          >
            <ActionIcon>
              <path d="M16 3h5v5" />
              <path d="M8 21H3v-5" />
              <path d="M21 3 14 10" />
              <path d="m3 21 7-7" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Replace exercise</span>
          </button>
          <button
            type="button"
            className="bk-ex-actions__row"
            onClick={() => runAction(onFillAll)}
          >
            <ActionIcon>
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Copy set 1 to every set</span>
          </button>
          {exercise?.notInLibrary && typeof onAddToLibrary === "function" ? (
            <button
              type="button"
              className="bk-ex-actions__row"
              onClick={() => runAction(onAddToLibrary)}
            >
              <ActionIcon>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </ActionIcon>
              <span className="bk-ex-actions__label">Add to library</span>
            </button>
          ) : null}
          <div className="bk-ex-actions__divider" role="separator" />
          <button
            type="button"
            className="bk-ex-actions__row bk-ex-actions__row--danger"
            onClick={() => {
              closeActions();
              setConfirmRemove(true);
            }}
          >
            <ActionIcon>
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </ActionIcon>
            <span className="bk-ex-actions__label">Remove exercise</span>
          </button>
        </div>
      </BuilderSheet>

      <ExerciseSettingSheet
        open={settingSheet === "rest"}
        title="Rest"
        onClose={() => setSettingSheet(null)}
      >
        <Stepper
          value={restSec}
          min={0}
          max={600}
          step={15}
          label="Rest"
          format={restFormat}
          onChange={setRest}
        />
        <div className="bk-rest-presets" role="group" aria-label="Rest presets">
          {REST_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`bk-rest-presets__btn${restSec === p.sec ? " bk-rest-presets__btn--active" : ""}`}
              onClick={() => setRest(p.sec)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </ExerciseSettingSheet>

      <ExerciseSettingSheet
        open={settingSheet === "mode"}
        title="Reps / Time"
        onClose={() => setSettingSheet(null)}
      >
        <Segmented
          label="Reps or time"
          options={[
            { value: "reps", label: "Reps" },
            { value: "time", label: "Time" },
          ]}
          value={timed ? "time" : "reps"}
          onChange={(v) => onToggleTimed?.(v === "time")}
        />
        {!timed ? (
          <label className="bk-ex-card__setting-check">
            <input
              type="checkbox"
              checked={rangeOn}
              onChange={(e) => onToggleRange?.(e.target.checked)}
            />
            <span>Rep range</span>
          </label>
        ) : null}
        <label className="bk-ex-card__setting-check">
          <input
            type="checkbox"
            checked={perSideShown}
            onChange={(e) => onChange?.({ perSide: e.target.checked })}
          />
          <span>Per side (left and right)</span>
        </label>
      </ExerciseSettingSheet>

      <ExerciseSettingSheet
        open={settingSheet === "effort"}
        title={effortLabel}
        onClose={() => setSettingSheet(null)}
      >
        <Segmented
          label="Effort mode"
          options={[
            { value: "target", label: "Target" },
            { value: "cap", label: "Cap" },
          ]}
          value={effortCap ? "cap" : "target"}
          onChange={(v) => onChange?.({ effortCap: v === "cap" })}
        />
      </ExerciseSettingSheet>

      <ExerciseSettingSheet
        open={settingSheet === "notes"}
        title="Notes"
        onClose={() => setSettingSheet(null)}
      >
        <label className="bk-settings__field">
          <span className="bk-settings__label">Notes</span>
          <textarea
            className="bk-settings__textarea"
            value={exercise?.notes ?? ""}
            onChange={(e) => onChange?.({ notes: e.target.value })}
            rows={4}
            maxLength={1000}
            placeholder="Setup, cues, tempo, lead side..."
          />
        </label>
      </ExerciseSettingSheet>

      {confirmRemove ? (
        <div className="bk-builder-confirm" role="presentation">
          <button
            type="button"
            className="bk-sheet__backdrop"
            aria-label="Cancel"
            onClick={() => setConfirmRemove(false)}
          />
          <div
            className="stack session-discard-confirm bk-builder-confirm__panel"
            role="alertdialog"
            aria-labelledby={`ex-remove-title-${exercise?.id || index}`}
          >
            <p
              id={`ex-remove-title-${exercise?.id || index}`}
              className="session-discard-confirm__title"
            >
              Remove &ldquo;{exerciseName}&rdquo;?
            </p>
            <p className="muted small session-discard-confirm__body">
              This exercise and its sets will be removed from this day.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                onClick={() => {
                  setConfirmRemove(false);
                  onDelete?.();
                }}
              >
                Remove exercise
              </button>
              <button
                ref={cancelRemoveRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
