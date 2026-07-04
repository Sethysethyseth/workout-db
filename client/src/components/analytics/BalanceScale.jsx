/**
 * Centered balance scale for a ratio around 1:1. Position is log2(ratio)
 * clamped to [-1, 1] (i.e. 0.5:1 .. 2:1), so 1:1 sits exactly at the center
 * hairline and equal imbalances read symmetrically. The exact ratio is
 * always printed beside the scale - the marker is the picture, not the value.
 */

const ZONE_MIN = 0.8;
const ZONE_MAX = 1.25;

function isOutsideZone(value) {
  return value < ZONE_MIN || value > ZONE_MAX;
}

function GhostTrack() {
  return (
    <div className="balance-scale balance-scale--ghost" aria-hidden="true">
      <span className="balance-track" />
      <span className="balance-center" />
    </div>
  );
}

export function BalanceScale({ label, value, leftCaption, rightCaption, unavailable = false }) {
  if (unavailable || value === null) {
    return (
      <div className="balance-block stack">
        <div className="row analytics-balance-row">
          <span>{label}</span>
          <span className="muted small">
            {unavailable ? "not available" : "— not enough data"}
          </span>
        </div>
        <GhostTrack />
      </div>
    );
  }

  const outside = isOutsideZone(value);
  const clamped = Math.max(-1, Math.min(1, Math.log2(value)));
  const pct = 50 + clamped * 50;
  const fillLeft = Math.min(50, pct);
  const fillWidth = Math.abs(pct - 50);
  const tip = `${label}: ${value.toFixed(2)} : 1`;

  return (
    <div className="balance-block stack">
      <div className="row analytics-balance-row">
        <span>{label}</span>
        <div className="balance-value-wrap stack">
          <span className={`balance-value${outside ? " is-outside-zone" : ""}`}>
            {value.toFixed(2)} : 1
          </span>
          {outside ? (
            <span className="balance-outside-caption muted small">outside the balanced zone</span>
          ) : null}
        </div>
      </div>
      <div className="balance-scale chart-tip-host" tabIndex={0} aria-label={tip} data-tip={tip}>
        <span className="balance-track" />
        <span className="balance-zone" aria-hidden="true" />
        <span
          className="balance-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <span className="balance-center" />
        <span
          className={`balance-marker${outside ? " is-outside-zone" : ""}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="row balance-captions" aria-hidden="true">
        <span className="muted small">{leftCaption}</span>
        <span className="muted small">balanced</span>
        <span className="muted small">{rightCaption}</span>
      </div>
    </div>
  );
}
