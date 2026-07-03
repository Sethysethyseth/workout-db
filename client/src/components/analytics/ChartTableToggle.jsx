/** Chart | Table segmented chips for an analytics card head. */
export function ChartTableToggle({ value, onChange, cardName }) {
  return (
    <div
      className="chart-table-toggle"
      role="group"
      aria-label={`${cardName} view mode`}
    >
      {["chart", "table"].map((mode) => (
        <button
          key={mode}
          type="button"
          className={`range-chip view-chip${value === mode ? " is-active" : ""}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {mode === "chart" ? "Chart" : "Table"}
        </button>
      ))}
    </div>
  );
}
