const VIEW_OPTIONS = [
  { value: "muscles", label: "Muscles" },
  { value: "strength", label: "Strength" },
  { value: "exercises", label: "Exercises" },
  { value: "execution", label: "Execution" },
];

/** Page-level Muscles | Strength | Exercises | Execution lens control. */
export function AnalyticsViewTabs({ value, onChange }) {
  return (
    <div className="analytics-view-tabs" role="group" aria-label="Analytics view">
      {VIEW_OPTIONS.map(({ value: mode, label }) => (
        <button
          key={mode}
          type="button"
          className={`analytics-view-tab${value === mode ? " is-active" : ""}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
