import "../../../styles/blocks/bk-log.css";

/**
 * Seconds field for a timed plan set. Accepts bare seconds or mm:ss.
 * Mount only when the row is in timed mode (plan set has durationSec).
 */
export function TimedSecInput({
  id,
  value,
  onChange,
  onBlur,
  onKeyDown,
  enterKeyHint,
  disabled = false,
  placeholder = "e.g. 45",
  invalid = false,
  className = "",
}) {
  const labelCls = [
    "session-set-field session-set-field--primary bk-log-timed",
    className,
    invalid ? "session-set-field--needs-value" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <label className={labelCls}>
      <span className="session-set-field-label">Seconds</span>
      <input
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        enterKeyHint={enterKeyHint}
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid ? true : undefined}
        autoComplete="off"
      />
    </label>
  );
}
