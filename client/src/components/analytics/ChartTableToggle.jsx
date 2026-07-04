const DEFAULT_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
];

/** Chart | Table segmented chips for an analytics card head. */
export function ChartTableToggle({ value, onChange, cardName, options = DEFAULT_OPTIONS }) {
  return (
    <div
      className="chart-table-toggle"
      role="group"
      aria-label={`${cardName} view mode`}
    >
      {options.map(({ value: mode, label }) => (
        <button
          key={mode}
          type="button"
          className={`range-chip view-chip${value === mode ? " is-active" : ""}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
