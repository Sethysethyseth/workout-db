import { useMemo, useState } from "react";
import { Chip } from "../ui/Chip.jsx";
import { DayPicker } from "../ui/DayPicker.jsx";
import { Disclosure } from "../ui/Disclosure.jsx";
import { SectionRule } from "../ui/SectionRule.jsx";
import { WeekStrip } from "../ui/WeekStrip.jsx";
import { ExerciseCard } from "../builder/ExerciseCard.jsx";
import { ExercisePicker } from "../builder/ExercisePicker.jsx";
import { AddExerciseToLibrarySheet } from "../../workout/AddExerciseToLibrarySheet.jsx";
import { aiFixChanges } from "./aiFixChanges.js";
import { formatExerciseForCard } from "./formatExerciseForCard.js";
import {
  formatAiReadCompareStats,
  formatImportStats,
  pluralize,
} from "./formatImportStats.js";
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
  aiLayoutOffer = null,
  aiReadCompare = null,
  onUseOriginalRead = null,
  aiFixCost = null,
  originalPreview = null,
  onLibraryMatched = null,
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
  const [libraryFrom, setLibraryFrom] = useState(null);

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

  const changeLines = useMemo(() => {
    if (!aiReadCompare || aiReadCompare.origin !== "preview" || !originalPreview) {
      return [];
    }
    return aiFixChanges(originalPreview, preview);
  }, [aiReadCompare, originalPreview, preview]);

  const dayHeading =
    currentDay?.name && String(currentDay.name).trim()
      ? String(currentDay.name).trim()
      : `Day ${safeDayIdx + 1}`;

  const nameSummary = blockName.trim() || "Name this block";
  const afterAiFix = Boolean(aiReadCompare || (typeof aiFixCost === "number" && aiFixCost > 0));

  const aiCompareWarn = Boolean(
    aiReadCompare &&
      aiReadCompare.origin !== "error" &&
      ((Number(aiReadCompare.current?.days) || 0) <
        (Number(aiReadCompare.prior?.days) || 0) ||
        (Number(aiReadCompare.current?.sets) || 0) <
          (Number(aiReadCompare.prior?.sets) || 0))
  );

  let aiCompareLine = null;
  if (aiReadCompare) {
    const currentLine = formatAiReadCompareStats(aiReadCompare.current);
    if (aiReadCompare.origin === "error") {
      aiCompareLine = `AI read: ${currentLine} (the standard reader couldn't read this sheet)`;
    } else {
      aiCompareLine = `AI read: ${currentLine} (was ${formatAiReadCompareStats(aiReadCompare.prior)})`;
    }
  }

  function warningText(w) {
    const row = w?.row != null ? `Row ${w.row}: ` : "";
    const message = w?.message != null ? String(w.message) : "Changed or skipped";
    return `${row}${message}`;
  }

  return (
    <div className="bk-import-preview">
      <p className="bk-import-stats">{statsLine}</p>
      <div className="bk-import-chips">
        {timedSets > 0 ? <Chip tone="accent">{timedSetsLabel}</Chip> : null}
        {warnings.length === 0 ? <Chip tone="good">Nothing skipped</Chip> : null}
      </div>

      {aiCompareLine ? (
        <div
          className={
            aiCompareWarn
              ? "bk-import-ai-compare bk-import-ai-compare--warn"
              : "bk-import-ai-compare"
          }
          role="status"
        >
          <p className="bk-import-ai-compare__line">{aiCompareLine}</p>
          {changeLines.length > 0 ? (
            <div className="bk-import-ai-changed">
              <p className="bk-import-ai-changed__heading">AI changed</p>
              <ul className="bk-import-ai-changed__list">
                {changeLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {typeof onUseOriginalRead === "function" ? (
            <button
              type="button"
              className="btn btn-ghost bk-import-ai-compare__undo"
              onClick={onUseOriginalRead}
              disabled={creating}
            >
              Use the original read
            </button>
          ) : null}
        </div>
      ) : null}

      {typeof aiFixCost === "number" && aiFixCost > 0 ? (
        <p className="bk-import-hint" role="status">
          AI fix used {aiFixCost} coach {aiFixCost === 1 ? "use" : "uses"}.
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <div className="bk-import-problems">
          <ul className="bk-import-warnings">
            {warnings.map((w, i) => (
              <li key={i}>
                {warningText(w)}
                {afterAiFix ? (
                  <span className="bk-import-problems__tag"> still needs you</span>
                ) : null}
              </li>
            ))}
          </ul>
          {aiLayoutOffer}
        </div>
      ) : (
        aiLayoutOffer
      )}

      {warmupRows > 0 ? (
        <label className="bk-import-toggle">
          <input
            type="checkbox"
            checked={includeWarmups}
            onChange={(e) => onIncludeWarmupsChange?.(e.target.checked)}
          />
          <span>
            Include {pluralize(warmupRows, "warm-up row", "warm-up rows")}
          </span>
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
        <Disclosure
          summary={`${pluralize(matched.length, "matches", "match")} your library`}
        >
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
              <div className="bk-import-match__actions">
                <button
                  type="button"
                  className="bk-import-match__link"
                  onClick={() => setLibraryFrom(from)}
                >
                  Add to library
                </button>
                <button
                  type="button"
                  className="bk-import-match__link bk-import-match__match-btn"
                  onClick={() => setMatchFrom(from)}
                >
                  Match...
                </button>
              </div>
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

      <AddExerciseToLibrarySheet
        open={libraryFrom != null}
        initialName={libraryFrom ?? ""}
        context="library"
        onClose={() => setLibraryFrom(null)}
        onLink={async ({ name }) => {
          const from = libraryFrom;
          if (!from || !name) return;
          onLibraryMatched?.(from, name);
        }}
        onCreateCommitted={async ({ name }) => {
          const from = libraryFrom;
          if (!from || !name) return;
          onLibraryMatched?.(from, name);
        }}
      />
    </div>
  );
}
