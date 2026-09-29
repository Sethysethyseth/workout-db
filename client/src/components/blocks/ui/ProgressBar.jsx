import "../../../styles/blocks/bk-ui.css";

export function ProgressBar({ value = 0, label, className = "", ...rest }) {
  const clamped = Math.max(0, Math.min(1, Number(value) || 0));
  const pct = `${clamped * 100}%`;
  const cls = className ? `bk-progress-bar ${className}` : "bk-progress-bar";
  return (
    <div
      className={cls}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
      {...rest}
    >
      <span className="bk-progress-bar__fill" style={{ width: pct }} />
    </div>
  );
}
