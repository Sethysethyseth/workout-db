/** Labels must match product copy: "Builder View" | "Table View". */
export function ViewModeToggle({ value, onChange }) {
  return (
    <div className="view-mode-toggle row" role="group" aria-label="Template view mode">
      <span className="muted small" style={{ fontWeight: 600 }}>
        View
      </span>
      <div className="view-mode-toggle-buttons row">
        <button
          type="button"
          className={value === "builder" ? "btn" : "btn btn-secondary"}
          aria-pressed={value === "builder"}
          onClick={() => onChange("builder")}
        >
          Builder View
        </button>
        <button
          type="button"
          className={value === "table" ? "btn" : "btn btn-secondary"}
          aria-pressed={value === "table"}
          onClick={() => onChange("table")}
        >
          Table View
        </button>
      </div>
    </div>
  );
}
