import "../../../styles/blocks/bk-ui.css";

const SIZE = 14;
const STROKE = 2;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** Decorative 14px SVG progress ring. Omitted by callers when progress is null. */
export function ProgressRing({ value = 0, className = "", ...rest }) {
  const clamped = Math.max(0, Math.min(1, Number(value) || 0));
  const complete = clamped >= 1;
  const offset = C * (1 - clamped);
  const base = "bk-progress-ring" + (complete ? " bk-progress-ring--complete" : "");
  const cls = className ? `${base} ${className}` : base;

  return (
    <svg
      className={cls}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      {...rest}
    >
      <circle
        className="bk-progress-ring__track"
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
      />
      <circle
        className="bk-progress-ring__fill"
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        strokeDasharray={C}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
