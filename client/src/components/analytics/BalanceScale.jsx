/**
 * Centered balance scale for a ratio around 1:1. Position is log2(ratio)
 * clamped to [-1, 1] (i.e. 0.5:1 .. 2:1), so 1:1 sits exactly at the center
 * hairline and equal imbalances read symmetrically. The exact ratio is
 * always printed beside the scale - the marker is the picture, not the value.
 */
export function BalanceScale({ label, value, leftCaption, rightCaption, unavailable = false }) {
  if (unavailable || value === null) {
    return (
      <div className="row analytics-balance-row">
        <span>{label}</span>
        <span className="muted small">
          {unavailable ? "not available" : "— not enough data"}
        </span>
      </div>
    );
  }

  const clamped = Math.max(-1, Math.min(1, Math.log2(value)));
  const pct = 50 + clamped * 50;
  const fillLeft = Math.min(50, pct);
  const fillWidth = Math.abs(pct - 50);
  const tip = `${label}: ${value.toFixed(2)} : 1`;

  return (
    <div className="balance-block stack">
      <div className="row analytics-balance-row">
        <span>{label}</span>
        <span className="balance-value">{value.toFixed(2)} : 1</span>
      </div>
      <div className="balance-scale chart-tip-host" tabIndex={0} aria-label={tip} data-tip={tip}>
        <span className="balance-track" />
        <span
          className="balance-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <span className="balance-center" />
        <span className="balance-marker" style={{ left: `${pct}%` }} />
      </div>
      <div className="row balance-captions" aria-hidden="true">
        <span className="muted small">{leftCaption}</span>
        <span className="muted small">balanced</span>
        <span className="muted small">{rightCaption}</span>
      </div>
    </div>
  );
}
