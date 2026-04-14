/** Upper range for the set-count select: always includes current length; headroom up to a soft cap. */
function maxSetCountOption(currentLen) {
  const bumped = Math.max(20, currentLen + 10);
  return Math.max(currentLen, Math.min(150, bumped));
}

/**
 * Shared “Sets” count `<select>` for planning-style builders (block weeks, templates, live session).
 * Kept compact so it does not stretch across the full toolbar width on small screens.
 */
export function PlanningSetCountControl({ value, onChange, disabled = false }) {
  function handleChange(next) {
    const n = Number(next);
    if (!Number.isInteger(n) || n < 1) return;
    onChange(n);
  }

  const maxOpt = maxSetCountOption(value);

  return (
    <label className="exercise-editor-set-count-label">
      <span className="muted small" style={{ fontWeight: 600 }}>
        Sets
      </span>
      <select
        className="exercise-editor-set-count-select"
        aria-label="Number of sets"
        value={value}
        disabled={disabled}
        onChange={(e) => handleChange(Number(e.target.value))}
      >
        {Array.from({ length: maxOpt }, (_, i) => i + 1).map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </label>
  );
}
