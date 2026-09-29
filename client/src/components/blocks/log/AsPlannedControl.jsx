import "../../../styles/blocks/bk-log.css";

/**
 * One-tap fill of reps/seconds + load from the plan. Never fills effort.
 * Mount only when a plan set is available.
 */
export function AsPlannedControl({ onFill, disabled = false, className = "" }) {
  if (!onFill) return null;
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
