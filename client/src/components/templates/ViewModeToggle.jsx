/** Labels must match product copy: "Builder view" | "Table view". */
export function ViewModeToggle({ value, onChange, ariaGroupLabel = "Template view mode" }) {
  return (
    <div className="view-mode-toggle row" role="group" aria-label={ariaGroupLabel}>
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
          Builder view
        </button>
        <button
          type="button"
          className={value === "table" ? "btn" : "btn btn-secondary"}
          aria-pressed={value === "table"}
          onClick={() => onChange("table")}
        >
          Table view
        </button>
      </div>
    </div>
  );
}
