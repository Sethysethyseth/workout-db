import "../../../styles/blocks/bk-log.css";

/**
 * Warn-tone label when logged effort is beyond the plan cap. Nothing is blocked.
 */
export function EffortCapWarn({ show, className = "" }) {
  if (!show) return null;
  const cls = className ? `bk-log-cap-warn ${className}` : "bk-log-cap-warn";
  return (
    <span className={cls} role="status">
      over cap
    </span>
  );
}
