import { useMemo, useState } from "react";
import { Chip } from "../ui/Chip.jsx";
import { DayPicker } from "../ui/DayPicker.jsx";
import { Disclosure } from "../ui/Disclosure.jsx";
import { SectionRule } from "../ui/SectionRule.jsx";
import { WeekStrip } from "../ui/WeekStrip.jsx";
import { ExerciseCard } from "../builder/ExerciseCard.jsx";
import { ExercisePicker } from "../builder/ExercisePicker.jsx";
import { formatExerciseForCard } from "./formatExerciseForCard.js";

/**
 * Step 2 — preview stats, warnings, matching, browse, create.
 */
export function ImportPreviewStep({
  preview,
  renames,
  onRename,
  includeWarmups,
  onIncludeWarmupsChange,
  blockName,
  onBlockNameChange,
  onBack,
  onCreate,
  creating,
  unit = "lb",
}) {
  const block = preview?.block || null;
  const stats = preview?.stats || {};
  const warnings = Array.isArray(preview?.warnings) ? preview.warnings : [];
  const exercises = Array.isArray(preview?.exercises) ? preview.exercises : [];
  const notices = preview?.notices || {};
  const warmupRows = Number(notices.warmupRows) || 0;
  const effort = block?.effort === "rpe" || block?.effort === "rir" ? block.effort : "none";

  const [weekIdx, setWeekIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [matchFrom, setMatchFrom] = useState(null);

  const weeks = useMemo(() => (Array.isArray(block?.weeks) ? block.weeks : []), [block]);
  const safeWeekIdx = Math.min(weekIdx, Math.max(0, weeks.length - 1));
  const currentWeek = weeks[safeWeekIdx] || null;
  const days = useMemo(
    () => (Array.isArray(currentWeek?.days) ? currentWeek.days : []),
    [currentWeek]
  );
  const safeDayIdx = Math.min(dayIdx, Math.max(0, days.length - 1));
  const currentDay = days[safeDayIdx] || null;

  const weekStripItems = useMemo(
    () =>
      weeks.map((w, i) => ({
        key: String(i),
        short: `W${i + 1}`,
        progress: 0,
        ariaLabel: w?.label ? `Week ${i + 1}, ${w.label}` : `Week ${i + 1}`,
      })),
    [weeks]
  );

  const dayPickerItems = useMemo(
    () =>
      days.map((d, i) => ({
        key: String(i),
        top: `Day ${i + 1}`,
        name: d?.name || `Day ${i + 1}`,
        progress: null,
      })),
    [days]
  );

  const dayExercises = useMemo(() => {
    const list = Array.isArray(currentDay?.exercises) ? currentDay.exercises : [];
    return list.map((ex) => {
      const card = formatExerciseForCard(ex);
      const from = ex?.name;
      const renamed = from && renames?.[from] ? renames[from] : null;
      if (renamed) card.exerciseName = renamed;
      return card;
    });
  }, [currentDay, renames]);

  const statsLine = [
    `${stats.weeks ?? 0} WEEKS`,
    `${stats.days ?? 0} DAYS`,
    `${stats.exercises ?? 0} EXERCISES`,
    `${stats.sets ?? 0} SETS`,
  ].join(" · ");

  const timedSets = Number(stats.timedSets) || 0;

  return (
    <div className="bk-import-preview">
      <p className="bk-import-stats">{statsLine}</p>
      <div className="bk-import-chips">
        {timedSets > 0 ? <Chip tone="accent">{timedSets} TIMED SETS</Chip> : null}
        {warnings.length === 0 ? <Chip tone="good">Nothing skipped</Chip> : null}
      </div>

      {warnings.length > 0 ? (
        <Disclosure summary={`${warnings.length} things we changed or skipped`}>
          <ul className="bk-import-warnings">
            {warnings.map((w, i) => {
              const row = w?.row != null ? `Row ${w.row}: ` : "";
              const message = w?.message != null ? String(w.message) : "Changed or skipped";
              return <li key={i}>{row}{message}</li>;
            })}
          </ul>
        </Disclosure>
      ) : null}

      {warmupRows > 0 ? (
        <label className="bk-import-toggle">
          <input
            type="checkbox"
            checked={includeWarmups}
            onChange={(e) => onIncludeWarmupsChange?.(e.target.checked)}
          />
          <span>Include warm-up rows ({warmupRows})</span>
        </label>
      ) : null}

      <SectionRule label="EXERCISES" />
      <p className="bk-import-hint">
        Names are kept exactly as written - two spellings are two exercises.
      </p>
      <ul className="bk-import-match-list">
        {exercises.map((ex) => {
          const from = ex.name;
          const renameTo = renames?.[from];
          const kept = !renameTo;
          if (ex.resolved && kept) {
            return (
              <li key={from} className="bk-import-match">
                <span className="bk-import-match__check" aria-hidden="true">
                  ✓
                </span>
                <span className="bk-import-match__name">{from}</span>
                {ex.matchedName ? (
                  <span className="bk-import-match__meta">Matches {ex.matchedName}</span>
                ) : null}
              </li>
            );
          }
          if (renameTo) {
            return (
              <li key={from} className="bk-import-match">
                <span className="bk-import-match__check" aria-hidden="true">
                  ✓
                </span>
                <span className="bk-import-match__name">{from}</span>
                <span className="bk-import-match__meta">Matches {renameTo}</span>
                <button
                  type="button"
                  className="bk-import-match__link"
                  onClick={() => onRename?.(from, null)}
                >
                  Keep as typed
                </button>
              </li>
            );
          }
          return (
            <li key={from} className="bk-import-match bk-import-match--unmatched">
              <span className="bk-import-match__name">{from}</span>
              <span className="bk-import-match__meta">Not in your library</span>
              <button
                type="button"
                className="btn btn-secondary bk-import-match__btn"
                onClick={() => setMatchFrom(from)}
              >
                Match…
              </button>
              <span className="bk-import-match__default">Keep as typed</span>
            </li>
          );
        })}
      </ul>

      <SectionRule label="BROWSE" />
      <WeekStrip
        weeks={weekStripItems}
        selectedKey={String(safeWeekIdx)}
        onSelect={(key) => {
          setWeekIdx(Number(key));
          setDayIdx(0);
        }}
      />
      <DayPicker
        days={dayPickerItems}
        selectedKey={String(safeDayIdx)}
        onSelect={(key) => setDayIdx(Number(key))}
      />
      <div className="bk-import-browse-ex">
        {dayExercises.length === 0 ? (
          <p className="bk-import-hint">No exercises on this day.</p>
        ) : (
          dayExercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              effort={effort}
              unit={unit}
              readOnly
            />
          ))
        )}
      </div>

      <label className="bk-import-label" htmlFor="bk-import-name">
        Block name
      </label>
      <input
        id="bk-import-name"
        className="bk-import-name"
        value={blockName}
        onChange={(e) => onBlockNameChange?.(e.target.value)}
        maxLength={120}
        placeholder="Name this block"
      />

      <div className="bk-import-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={creating}>
          Back
        </button>
        <button type="button" className="btn" onClick={onCreate} disabled={creating || !blockName.trim()}>
          {creating ? "Creating…" : "Create block"}
        </button>
      </div>

      <ExercisePicker
        open={matchFrom != null}
        title="Match exercise"
        onClose={() => setMatchFrom(null)}
        onPick={(picked) => {
          if (matchFrom && picked?.exerciseName) {
            onRename?.(matchFrom, picked.exerciseName);
          }
          setMatchFrom(null);
        }}
      />
    </div>
  );
}
