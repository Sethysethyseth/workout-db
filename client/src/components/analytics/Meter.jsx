/**
 * Horizontal meter: accent fill on a lighter same-ramp track, optional
 * target hairline (execution adherence marks 100%). The numeric label next
 * to the meter is the value's dependable channel - the fill never carries
 * it alone. Fill is capped at `max`; the label always shows the true value.
 */
export function Meter({ value, max = 1, target = null }) {
  const fillFrac = Math.max(0, Math.min(value / max, 1));
  return (
    <span className="meter" role="presentation">
      <span className="meter-fill" style={{ width: `${(fillFrac * 100).toFixed(2)}%` }} />
      {target !== null ? (
        <span
          className="meter-target"
          style={{ left: `${((target / max) * 100).toFixed(2)}%` }}
        />
      ) : null}
    </span>
  );
}
