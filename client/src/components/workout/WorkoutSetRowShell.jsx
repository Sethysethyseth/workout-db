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
}) {
  return (
    <div className="card set-row">
      <div className="row set-row-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div className="row" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong className="muted small">{label}</strong>
          {headerExtra}
        </div>
        {canRemove && !disabled ? (
          <button type="button" className="btn btn-ghost" onClick={onRemove}>
            Remove set
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
