import { useMemo, useState } from "react";
import { Chip } from "../ui/Chip.jsx";
import { DayPicker } from "../ui/DayPicker.jsx";
import { Disclosure } from "../ui/Disclosure.jsx";
import { SectionRule } from "../ui/SectionRule.jsx";
import { WeekStrip } from "../ui/WeekStrip.jsx";
import { ExerciseCard } from "../builder/ExerciseCard.jsx";
import { ExercisePicker } from "../builder/ExercisePicker.jsx";
import { formatExerciseForCard } from "./formatExerciseForCard.js";
import { formatImportStats } from "./formatImportStats.js";
import {
  formatUnmatchedHeading,
  UNMATCHED_ANALYTICS_NOTE,
  UNMATCHED_KEEP_LINE,
} from "./formatUnmatchedSection.js";
import { splitMatchedExercises } from "./splitMatchedExercises.js";

/**
 * Step 2 — preview stats, warnings, browse, matching, create.
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

  const { line: statsLine, timedSets: timedSetsLabel } = formatImportStats(stats);
  const timedSets = Number(stats.timedSets) || 0;

  const { matched, unmatched } = useMemo(
    () =>
      splitMatchedExercises(
        Array.isArray(preview?.exercises) ? preview.exercises : []
      ),
    [preview]
  );

  const dayHeading =
    currentDay?.name && String(currentDay.name).trim()
      ? String(currentDay.name).trim()
      : `Day ${safeDayIdx + 1}`;

  const nameSummary = blockName.trim() || "Name this block";

  return (
    <div className="bk-import-preview">
      <p className="bk-import-stats">{statsLine}</p>
      <div className="bk-import-chips">
        {timedSets > 0 ? <Chip tone="accent">{timedSetsLabel}</Chip> : null}
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
      {currentDay ? (
        <h2 className="bk-import-day-heading">{dayHeading}</h2>
      ) : null}
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

      <SectionRule label="EXERCISES" />
      <p className="bk-import-hint">
        Names are kept exactly as written - two spellings are two exercises.
      </p>
      {matched.length > 0 ? (
        <Disclosure summary={`${matched.length} match your library`}>
          <ul className="bk-import-match-list bk-import-match-list--matched">
            {matched.map((ex) => {
              const from = ex.name;
              return (
                <li key={from} className="bk-import-match bk-import-match--matched">
                  <span className="bk-import-match__check" aria-hidden="true">
                    ✓
                  </span>
                  <span className="bk-import-match__name">{from}</span>
                  {ex.matchedName && ex.matchedName !== from ? (
                    <span className="bk-import-match__meta">Matches {ex.matchedName}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Disclosure>
      ) : null}
      {unmatched.length > 0 ? (
        <div className="bk-import-match-section">
          <h3 className="bk-import-match-section__heading">
            {formatUnmatchedHeading(unmatched.length)}
          </h3>
          <p className="bk-import-match-section__keep">{UNMATCHED_KEEP_LINE}</p>
          <p className="bk-import-match-section__note">{UNMATCHED_ANALYTICS_NOTE}</p>
        </div>
      ) : null}
      <ul className="bk-import-match-list bk-import-match-list--unmatched">
        {unmatched.map((ex) => {
          const from = ex.name;
          const renameTo = renames?.[from];
          if (renameTo) {
            return (
              <li key={from} className="bk-import-match bk-import-match--compact">
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
            <li key={from} className="bk-import-match bk-import-match--compact">
              <span className="bk-import-match__name">{from}</span>
              <button
                type="button"
                className="bk-import-match__link bk-import-match__match-btn"
                onClick={() => setMatchFrom(from)}
              >
                Match...
              </button>
            </li>
          );
        })}
      </ul>

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
        <button
          type="button"
          className="btn"
          onClick={onCreate}
          disabled={creating || !blockName.trim()}
        >
          {creating ? "Creating..." : "Create block"}
        </button>
      </div>

      <div className="bk-import-sticky-create" aria-label="Create block">
        <div className="bk-import-sticky-create__inner">
          <span className="bk-import-sticky-create__name" title={nameSummary}>
            {nameSummary}
          </span>
          <button
            type="button"
            className="btn"
            onClick={onCreate}
            disabled={creating || !blockName.trim()}
          >
            {creating ? "Creating..." : "Create block"}
          </button>
        </div>
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
