/**
 * Inline typeahead listbox for live-session exercise naming.
 * Rendered inside #root (never portaled).
 */
export function ExercisePickerSuggestions({
  id,
  open,
  results,
  activeIndex,
  onSelect,
}) {
  if (!open || !Array.isArray(results) || results.length === 0) {
    return null;
  }

  return (
    <ul
      id={id}
      className="exercise-picker-suggestions"
      role="listbox"
      aria-label="Exercise suggestions"
    >
      {results.map((row, index) => {
        const isActive = index === activeIndex;
        return (
          <li key={`${row.source}-${row.exerciseId ?? row.userExerciseId}`} role="presentation">
            <button
              type="button"
              className={`exercise-picker-suggestion-btn${isActive ? " exercise-picker-suggestion-btn--active" : ""}`}
              role="option"
              aria-selected={isActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(row)}
            >
              <span className="exercise-picker-suggestion-name">{row.name}</span>
              {row.source === "userExercise" ? (
                <span className="exercise-picker-suggestion-tag">Custom</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
