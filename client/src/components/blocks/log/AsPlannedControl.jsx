import "../../../styles/blocks/bk-log.css";

/**
 * One-tap fill of reps/seconds + load from the plan. Never fills effort.
 * Mount only when a plan set is available.
 */
export function AsPlannedControl({
  onFill,
  disabled = false,
  className = "",
  setNumber = null,
}) {
  if (!onFill) return null;
  if (setNumber != null) {
    const cls = className ? `bk-set-num ${className}` : "bk-set-num";
    return (
      <button
        type="button"
        className={cls}
        onClick={onFill}
        disabled={disabled}
        aria-label={`Log set ${setNumber} as last time`}
        title="Log as last time"
      >
        {setNumber}
      </button>
    );
  }
  const cls = className ? `bk-log-as-planned ${className}` : "bk-log-as-planned";
  return (
    <button
      type="button"
      className={cls}
      onClick={onFill}
      disabled={disabled}
      title="Fill weight and reps/seconds from the plan"
    >
      As planned
    </button>
  );
}
