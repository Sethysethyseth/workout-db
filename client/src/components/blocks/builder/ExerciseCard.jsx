import { useRef } from "react";
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

function restFormat(sec) {
  if (sec == null || sec === 0) return "No rest";
  return formatRest(sec) || "No rest";
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
}) {
  const gridRef = useRef(null);
  const summary = exerciseRxSummary(exercise, { effort, unit });
  const notesLine = firstNotesLine(exercise?.notes);
  const sets = exercise?.sets || [];
  const timed = sets.length > 0 && sets.every((s) => s.durationSec != null && s.durationSec !== "");
  const rangeOn = sets.some((s) => s.repsMax != null && s.repsMax !== "");
  const restSec = exercise?.restSec == null ? 0 : Number(exercise.restSec);
  const showEffort = effort === "rpe" || effort === "rir";
  const effortLabel = effort === "rir" ? "RIR" : "RPE";

  const midCols =
    1 + // reps or sec
    (rangeOn && !timed ? 1 : 0) +
    1 + // load
    (showEffort ? 1 : 0);
  const gridStyle = {
    gridTemplateColumns: readOnly
      ? `40px repeat(${midCols}, minmax(0,1fr))`
      : `40px repeat(${midCols}, minmax(0,1fr)) 34px`,
  };

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

  if (!expanded || readOnly) {
    return (
      <Card
        className={`bk-ex-card${invalid ? " bk-ex-card--invalid" : ""}${readOnly ? " bk-ex-card--readonly" : ""}`}
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
      >
        <div className="bk-ex-card__top">
          <span className="bk-ex-card__slot">{slotBadge(index)}</span>
          {exercise?.notInLibrary ? (
            <Chip tone="warn">Not in library</Chip>
          ) : null}
          {readOnly ? null : (
            <span className="bk-ex-card__chev" aria-hidden="true">
              ▾
            </span>
          )}
        </div>
        <h3 className="bk-ex-card__name">{exercise?.exerciseName || "Untitled"}</h3>
        {summary.uniform ? (
          <ExerciseRx rx={summary.rx} />
        ) : (
          <p className="bk-rx bk-rx--summary">{summary.summary}</p>
        )}
        {notesLine ? <p className="bk-ex-card__notes">{notesLine}</p> : null}
      </Card>
    );
  }

  return (
    <Card
      className={`bk-ex-card bk-ex-card--expanded${invalid ? " bk-ex-card--invalid" : ""}`}
      data-ex-id={exercise?.id}
    >
      <button
        type="button"
        className="bk-ex-card__collapse"
        onClick={onToggle}
        aria-expanded="true"
      >
        <span className="bk-ex-card__slot">{slotBadge(index)}</span>
        <h3 className="bk-ex-card__name">{exercise?.exerciseName || "Untitled"}</h3>
        {exercise?.notInLibrary ? (
          <Chip tone="warn">Not in library</Chip>
        ) : null}
        <span className="bk-ex-card__chev bk-ex-card__chev--up" aria-hidden="true">
          ▴
        </span>
      </button>

      <div className="bk-set-grid" ref={gridRef}>
        <div className="bk-set-grid__head" style={gridStyle} aria-hidden="true">
          <span className="bk-set-grid__h bk-set-grid__h--set">SET</span>
          <span className="bk-set-grid__h">{timed ? "SEC" : "REPS"}</span>
          {rangeOn && !timed ? <span className="bk-set-grid__h">TO</span> : null}
          <span className="bk-set-grid__h">LOAD</span>
          {showEffort ? <span className="bk-set-grid__h">{effortLabel}</span> : null}
          {readOnly ? null : <span className="bk-set-grid__h bk-set-grid__h--spacer" />}
        </div>
        {sets.map((s, si) => (
          <div className="bk-set-grid__row" style={gridStyle} key={s.id || si}>
            <span className="bk-set-grid__num" aria-label={`Set ${si + 1}`}>
              {si + 1}
            </span>
            {timed ? (
              <NumField
                placeholder="sec"
                value={fieldValue(s.durationSec)}
                onChange={(e) => patchSet(si, { durationSec: parseNum(e.target.value) })}
                onKeyDown={onFieldKeyDown}
                aria-label={`Set ${si + 1} seconds`}
              />
            ) : (
              <NumField
                placeholder="reps"
                value={fieldValue(s.reps)}
                onChange={(e) => patchSet(si, { reps: parseNum(e.target.value) })}
                onKeyDown={onFieldKeyDown}
                aria-label={`Set ${si + 1} reps`}
              />
            )}
            {rangeOn && !timed ? (
              <NumField
                placeholder="max"
                value={fieldValue(s.repsMax)}
                onChange={(e) => patchSet(si, { repsMax: parseNum(e.target.value) })}
                onKeyDown={onFieldKeyDown}
                aria-label={`Set ${si + 1} reps max`}
              />
            ) : null}
            <NumField
              placeholder={unit}
              value={fieldValue(s.weight)}
              onChange={(e) => patchSet(si, { weight: parseNum(e.target.value) })}
              onKeyDown={onFieldKeyDown}
              aria-label={`Set ${si + 1} load`}
            />
            {showEffort ? (
              <NumField
                placeholder={effortLabel}
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
        ))}
      </div>

      <div className="bk-ex-card__controls">
        <button type="button" className="bk-ex-card__ctrl" onClick={onAddSet}>
          + Set
        </button>
        <button type="button" className="bk-ex-card__ctrl" onClick={onFillAll}>
          Fill all from set 1
        </button>
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
          <label className="bk-ex-card__range">
            <input
              type="checkbox"
              checked={rangeOn}
              onChange={(e) => onToggleRange?.(e.target.checked)}
            />
            <span>Range</span>
          </label>
        ) : null}
        <div className="bk-ex-card__rest">
          <span className="bk-settings__label">Rest</span>
          <Stepper
            value={restSec}
            min={0}
            max={600}
            step={15}
            label="Rest"
            format={restFormat}
            onChange={(v) => onChange?.({ restSec: v === 0 ? null : v })}
          />
        </div>
        {showEffort ? (
          <Segmented
            label="Effort mode"
            options={[
              { value: "target", label: "Target" },
              { value: "cap", label: "Cap" },
            ]}
            value={exercise?.effortCap ? "cap" : "target"}
            onChange={(v) => onChange?.({ effortCap: v === "cap" })}
          />
        ) : null}
      </div>

      <label className="bk-ex-card__notes-field">
        <span className="bk-visually-hidden">Notes</span>
        <textarea
          className="bk-settings__textarea"
          value={exercise?.notes ?? ""}
          onChange={(e) => onChange?.({ notes: e.target.value })}
          rows={2}
          maxLength={1000}
          placeholder="Setup, cues, tempo, lead side..."
        />
      </label>

      <div className="bk-ex-card__footer">
        <button type="button" className="bk-ex-card__ctrl" onClick={onMoveUp}>
          Move up
        </button>
        <button type="button" className="bk-ex-card__ctrl" onClick={onMoveDown}>
          Move down
        </button>
        <button type="button" className="bk-ex-card__ctrl" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="bk-ex-card__ctrl" onClick={onReplace}>
          Replace
        </button>
        <button
          type="button"
          className="bk-ex-card__ctrl bk-ex-card__ctrl--danger"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
