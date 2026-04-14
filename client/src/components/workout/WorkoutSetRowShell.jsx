/**
 * Shared chrome for set rows in template/block editing and session logging.
 * Keeps card, header, and remove-set control consistent across flows.
 */
export function WorkoutSetRowShell({
  label,
  headerExtra = null,
  canRemove,
  onRemove,
  disabled,
  children,
  /** Extra classes on the outer card (e.g. session logging variants). */
  className = "",
  /** Session logging: compact icon remove to reduce row chrome. */
  removeButtonMode = "default",
}) {
  const rootClass = ["card", "set-row", className].filter(Boolean).join(" ");
  return (
    <div className={rootClass}>
      <div className="row set-row-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div className="row" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong className="muted small">{label}</strong>
          {headerExtra}
        </div>
        {canRemove && !disabled ? (
          <button
            type="button"
            className={`btn btn-ghost${removeButtonMode === "icon" ? " set-row-remove--icon" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            {...(removeButtonMode === "icon" ? { "aria-label": "Remove set" } : {})}
          >
            {removeButtonMode === "icon" ? (
              <span aria-hidden="true" className="set-row-remove-icon">
                ×
              </span>
            ) : (
              "Remove set"
            )}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
