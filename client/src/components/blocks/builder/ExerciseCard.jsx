import { useEffect, useRef, useState } from "react";
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
  if (sec == null || sec === 0) return { text: "None", ariaLabel: "No rest" };
  const t = formatRest(sec);
  if (!t) return { text: "None", ariaLabel: "No rest" };
  return typeof t === "string" ? { text: t, ariaLabel: `Rest ${t}` } : t;
}

/** Collapsed meta line: rest / target-or-cap / note count when set. */
function buildMetaSummary(exercise, effort) {
  const parts = [];
  const restSec = exercise?.restSec == null ? null : Number(exercise.restSec);
  if (restSec != null && restSec > 0) {
    const rest = formatRest(restSec);
    if (rest) parts.push(`Rest ${rest}`);
  }

  const showEffort = effort === "rpe" || effort === "rir";
  if (showEffort) {
    const sets = exercise?.sets || [];
    let effortVal = null;
    for (const s of sets) {
      const raw = effort === "rir" ? s.rir : s.rpe;
      if (raw != null && raw !== "") {
        effortVal = Number(raw);
        break;
      }
    }
    if (effortVal != null && Number.isFinite(effortVal)) {
      if (effort === "rir") {
        parts.push(exercise?.effortCap ? `RIR ≥ ${effortVal}` : `RIR ${effortVal}`);
      } else {
        parts.push(exercise?.effortCap ? `RPE ≤ ${effortVal}` : `RPE ${effortVal}`);
      }
    }
  }

  const notes = String(exercise?.notes || "").trim();
  if (notes) {
    const n = notes.split(/\r?\n/).filter((line) => line.trim()).length;
    parts.push(n === 1 ? "1 note" : `${n} notes`);
  }

  return parts.length ? parts.join(" · ") : null;
}

function setGridLineClassName(kind, { rangeOn, showEffort }) {
  const parts = [`bk-set-grid__${kind}`];
  if (rangeOn) parts.push(`bk-set-grid__${kind}--range`);
  if (showEffort) parts.push(`bk-set-grid__${kind}--effort`);
  return parts.join(" ");
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
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const summary = exerciseRxSummary(exercise, { effort, unit });
  const notesLine = firstNotesLine(exercise?.notes);
  const metaSummary = buildMetaSummary(exercise, effort);
  const sets = exercise?.sets || [];
  const timed = sets.length > 0 && sets.every((s) => s.durationSec != null && s.durationSec !== "");
  const rangeOn = sets.some((s) => s.repsMax != null && s.repsMax !== "");
  const restSec = exercise?.restSec == null ? 0 : Number(exercise.restSec);
  const showEffort = effort === "rpe" || effort === "rir";
  const effortLabel = effort === "rir" ? "RIR" : "RPE";
  const lineMods = { rangeOn: rangeOn && !timed, showEffort };
  const headClass = setGridLineClassName("head", lineMods);
  const rowClass = setGridLineClassName("row", lineMods);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  function openMetaEditor(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!expanded) onToggle?.();
    setMenuOpen(true);
  }

  const menuPanel = menuOpen ? (
    <div className="bk-ex-card__menu-panel" role="menu">
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item"
        onClick={() => {
          onMoveUp?.();
          closeMenu();
        }}
      >
        Move up
      </button>
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item"
        onClick={() => {
          onMoveDown?.();
          closeMenu();
        }}
      >
        Move down
      </button>
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item"
        onClick={() => {
          onDuplicate?.();
          closeMenu();
        }}
      >
        Duplicate
      </button>
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item"
        onClick={() => {
          onReplace?.();
          closeMenu();
        }}
      >
        Replace
      </button>
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item"
        onClick={() => {
          onFillAll?.();
          closeMenu();
        }}
      >
        Fill all from set 1
      </button>
      <div className="bk-ex-card__menu-section">
        <Segmented
          label="Reps or time"
          options={[
            { value: "reps", label: "Reps" },
            { value: "time", label: "Time" },
          ]}
          value={timed ? "time" : "reps"}
          onChange={(v) => onToggleTimed?.(v === "time")}
        />
      </div>
      {!timed ? (
        <label className="bk-ex-card__menu-item bk-ex-card__menu-check">
          <input
            type="checkbox"
            checked={rangeOn}
            onChange={(e) => onToggleRange?.(e.target.checked)}
          />
          <span>Rep range</span>
        </label>
      ) : null}
      <div className="bk-ex-card__menu-rest">
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
        <div className="bk-ex-card__menu-section">
          <Segmented
            label="Effort mode"
            options={[
              { value: "target", label: "Target" },
              { value: "cap", label: "Cap" },
            ]}
            value={exercise?.effortCap ? "cap" : "target"}
            onChange={(v) => onChange?.({ effortCap: v === "cap" })}
          />
        </div>
      ) : null}
      <label className="bk-ex-card__menu-notes">
        <span className="bk-settings__label">Notes</span>
        <textarea
          className="bk-settings__textarea"
          value={exercise?.notes ?? ""}
          onChange={(e) => onChange?.({ notes: e.target.value })}
          rows={2}
          maxLength={1000}
          placeholder="Setup, cues, tempo, lead side..."
        />
      </label>
      <button
        type="button"
        role="menuitem"
        className="bk-ex-card__menu-item bk-ex-card__menu-item--danger"
        onClick={() => {
          onDelete?.();
          closeMenu();
        }}
      >
        Delete
      </button>
    </div>
  ) : null;

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
      <div className="bk-ex-card__head">
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
        <div className="bk-ex-card__menu" ref={menuRef}>
          <button
            type="button"
            className="bk-ex-card__menu-btn"
            aria-label="Exercise actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            …
          </button>
          {menuPanel}
        </div>
      </div>

      {/* The collapsed card's rx line already says this; the expanded card
          is where rest / cap / notes otherwise vanish into the ... menu. */}
      {metaSummary ? (
        <button type="button" className="bk-ex-card__meta" onClick={openMetaEditor}>
          {metaSummary}
        </button>
      ) : null}

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
    </Card>
  );
}
