import "../../../styles/blocks/bk-ui.css";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  format,
  label,
  className = "",
  ...rest
}) {
  const n = Number(value);
  const atMin = n <= min;
  const atMax = n >= max;
  const display = typeof format === "function" ? format(n) : String(n);
  const cls = className ? `bk-stepper ${className}` : "bk-stepper";

  function bump(delta) {
    const next = n + delta;
    if (next < min || next > max) return;
    onChange?.(next);
  }

  return (
    <div className={cls} {...rest}>
      <button
        type="button"
        className="bk-stepper__btn"
        aria-label={label ? `Decrease ${label}` : "Decrease"}
        disabled={atMin}
        onClick={() => bump(-step)}
      >
        −
      </button>
      <output className="bk-stepper__value" aria-live="polite" aria-label={label}>
        {display}
      </output>
      <button
        type="button"
        className="bk-stepper__btn"
        aria-label={label ? `Increase ${label}` : "Increase"}
        disabled={atMax}
        onClick={() => bump(step)}
      >
        +
      </button>
    </div>
  );
}
