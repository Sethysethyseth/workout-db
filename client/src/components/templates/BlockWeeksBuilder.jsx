import { useEffect, useState } from "react";
import { WorkoutBuilder } from "./WorkoutBuilder.jsx";
/**
 * Collapsible week panels + jump nav for block create/edit. Parent owns blockWeeks state.
 */
export function BlockWeeksBuilder({
  blockWeeks,
  useRIR,
  useRPE,
  onRemoveWeek,
  onUpdateBlockWorkout,
  onAddBlockWorkout,
  onRemoveBlockWorkout,
  onCopyPreviousWeek,
}) {
  const [expandedWeekIdx, setExpandedWeekIdx] = useState(0);

  useEffect(() => {
    if (blockWeeks.length === 0) return;
    setExpandedWeekIdx((cur) => {
      if (cur === null) return cur;
      if (cur >= blockWeeks.length) return blockWeeks.length - 1;
      return cur;
    });
  }, [blockWeeks.length]);

  function toggleWeek(weekIdx) {
    setExpandedWeekIdx((cur) => (cur === weekIdx ? null : weekIdx));
  }

  function focusWeek(weekIdx) {
    setExpandedWeekIdx(weekIdx);
  }

  function handleRemoveWeek(weekIdx) {
    setExpandedWeekIdx((cur) => {
      if (cur === null) return cur;
      const nextLen = blockWeeks.length - 1;
      if (weekIdx < cur) return cur - 1;
      if (weekIdx === cur) {
        if (nextLen <= 0) return 0;
        return Math.min(weekIdx, nextLen - 1);
      }
      return cur;
    });
    onRemoveWeek(weekIdx);
  }

  return (
    <div className="stack block-weeks-builder">
      <div
        className="block-week-nav row"
        role="tablist"
        aria-label="Jump to week"
        style={{ flexWrap: "wrap", justifyContent: "flex-start", gap: "8px" }}
      >
        {blockWeeks.map((week, weekIdx) => {
          const isActive = expandedWeekIdx === weekIdx;
          return (
            <button
              key={week.id}
              type="button"
              className={`btn btn-secondary block-week-nav-btn${isActive ? " is-active" : ""}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => focusWeek(weekIdx)}
            >
              Week {weekIdx + 1}
            </button>
          );
        })}
      </div>

      {blockWeeks.map((week, weekIdx) => {
        const isOpen = expandedWeekIdx === weekIdx;
        return (
          <div
            key={week.id}
            className={`card stack block-week-panel${isOpen ? " block-week-panel--open" : ""}`}
          >
            <div className="block-week-header-row row" style={{ alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className="block-week-header-toggle"
                aria-expanded={isOpen}
                id={`block-week-h-${week.id}`}
                aria-controls={`block-week-c-${week.id}`}
                onClick={() => toggleWeek(weekIdx)}
              >
                <span className="block-week-chevron" aria-hidden>
                  {isOpen ? "▼" : "▶"}
                </span>
                <span className="block-week-header-title">Week {weekIdx + 1}</span>
                {!isOpen ? (
                  <span className="muted small" style={{ fontWeight: 500 }}>
                    {week.workouts.length} workout{week.workouts.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </button>
              <div className="row" style={{ flexWrap: "wrap", justifyContent: "flex-end", flex: 1 }}>
                {weekIdx > 0 ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyPreviousWeek(weekIdx);
                    }}
                  >
                    Copy previous week
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBlockWorkout(weekIdx);
                  }}
                >
                  Add workout
                </button>
                {blockWeeks.length > 1 ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWeek(weekIdx);
                    }}
                  >
                    Remove week
                  </button>
                ) : null}
              </div>
            </div>

            {isOpen ? (
              <div
                className="stack block-week-body"
                id={`block-week-c-${week.id}`}
                role="region"
                aria-labelledby={`block-week-h-${week.id}`}
              >
                {week.workouts.map((w, workoutIdx) => (
                  <div key={w.id} className="card stack" style={{ margin: 0 }}>
                    <div className="row">
                      <label style={{ flex: 1, margin: 0 }}>
                        Workout label
                        <input
                          value={w.title}
                          onChange={(e) =>
                            onUpdateBlockWorkout(weekIdx, workoutIdx, { title: e.target.value })
                          }
                          placeholder={`Workout ${workoutIdx + 1}`}
                        />
                      </label>
                      {week.workouts.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => onRemoveBlockWorkout(weekIdx, workoutIdx)}
                        >
                          Remove workout
                        </button>
                      ) : null}
                    </div>
                    <WorkoutBuilder
                      exercises={w.exercises}
                      onExercisesChange={(next) => {
                        onUpdateBlockWorkout(weekIdx, workoutIdx, { exercises: next });
                      }}
                      useRIR={useRIR}
                      useRPE={useRPE}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
