/**
 * Static empty-state ghost previews for analytics surfaces (FP4).
 * Tokens-only muted washes; aria-hidden; zero interactivity; no motion.
 */

const MUSCLE_BAR_WIDTHS = ["78%", "62%", "48%", "34%"];
const EXERCISE_NAME_WIDTHS = ["58%", "72%", "44%"];
const EXERCISE_STAT_WIDTHS = ["36%", "42%", "28%"];
const STRENGTH_NAME_WIDTHS = ["52%", "64%"];

/** Fixed silhouette points in a 100x40 viewBox - reads as a gentle uptrend. */
const SPARKLINE_POINTS = "4,28 22,24 40,26 58,18 76,14 96,10";

export function MusclesEmptyGhost() {
  return (
    <div className="analytics-ghost analytics-ghost--muscles" aria-hidden="true">
      <div className="mv-rows analytics-ghost-mv-rows">
        {MUSCLE_BAR_WIDTHS.map((width) => (
          <div key={width} className="mv-row analytics-ghost-mv-row">
            <span className="analytics-ghost-label-bar" />
            <div className="mv-track">
              <span className="analytics-ghost-mv-bar" style={{ width }} />
            </div>
          </div>
        ))}
      </div>
      <div className="balance-scale balance-scale--ghost">
        <span className="balance-track" />
        <span className="balance-center" />
      </div>
    </div>
  );
}

export function StrengthEmptyGhost() {
  return (
    <div className="analytics-ghost analytics-ghost--strength" aria-hidden="true">
      <div className="analytics-ghost-sparkline">
        <svg
          className="analytics-ghost-sparkline-svg"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          focusable="false"
        >
          <polyline className="analytics-ghost-sparkline-line" points={SPARKLINE_POINTS} />
        </svg>
      </div>
      <div className="st-rows analytics-ghost-st-rows">
        {STRENGTH_NAME_WIDTHS.map((width) => (
          <div key={width} className="st-row analytics-ghost-st-row">
            <span className="analytics-ghost-label-bar" style={{ width }} />
            <span className="analytics-ghost-stat-bar" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExercisesEmptyGhost() {
  return (
    <div className="analytics-ghost analytics-ghost--exercises" aria-hidden="true">
      <ul className="analytics-ghost-roster">
        {EXERCISE_NAME_WIDTHS.map((width, i) => (
          <li key={width} className="analytics-ghost-roster-row">
            <span className="analytics-ghost-label-bar" style={{ width }} />
            <span
              className="analytics-ghost-stat-bar"
              style={{ width: EXERCISE_STAT_WIDTHS[i] }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Planned-vs-logged as an outline drawing: dashed "planned" bars with a
    thinner "actual" bar beside each, so it reads as a diagram of what will
    appear, never as content still loading. */
export function ExecutionEmptyGhost() {
  const rows = [
    [82, 74],
    [64, 66],
    [48, 40],
  ];
  return (
    <div className="analytics-ghost analytics-ghost--execution" aria-hidden="true">
      <svg viewBox="0 0 200 84" className="analytics-ghost-diagram" preserveAspectRatio="none">
        {rows.map(([planned, actual], i) => {
          const y = 8 + i * 26;
          return (
            <g key={i}>
              <rect x="0" y={y} width={planned * 2} height="10" rx="3" className="analytics-ghost-diagram__planned" />
              <rect x="0" y={y + 13} width={actual * 2} height="6" rx="3" className="analytics-ghost-diagram__actual" />
            </g>
          );
        })}
      </svg>
      <div className="analytics-ghost-diagram__legend">
        <span><i className="analytics-ghost-diagram__key analytics-ghost-diagram__key--planned" /> planned</span>
        <span><i className="analytics-ghost-diagram__key analytics-ghost-diagram__key--actual" /> logged</span>
      </div>
    </div>
  );
}
