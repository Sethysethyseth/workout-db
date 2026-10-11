import { niceScale } from "../../lib/chartScale.js";

/**
 * Horizontal bar chart: weekly volume per muscle. Emphasis form - the
 * effective-sets bar is a neutral context mark; the stimulating-sets bar
 * (the headline metric) wears the palette accent. Every bar carries a
 * direct value label, and the table view twin holds every number, so the
 * chart never gates a value behind color or hover.
 */

function fmt1(n) {
  return Number(n).toFixed(1);
}

/** Axis labels for the five ticks at 0, 1/4, 1/2, 3/4, max. Precision follows
    the step, then bumps until no two ticks share a label. */
export function muscleAxisLabels(max) {
  const values = [0, 1, 2, 3, 4].map((i) => (Number(max) * i) / 4);
  const step = Math.abs(Number(max)) / 4;
  let decimals = 0;
  if (step > 0 && step < 1) {
    decimals = Math.min(6, Math.ceil(-Math.log10(step) - 1e-12));
  }
  const format = (value, places) => {
    const text = Number(value).toFixed(places);
    return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };
  let labels = values.map((value) => format(value, decimals));
  while (new Set(labels).size < labels.length && decimals < 6) {
    decimals += 1;
    labels = values.map((value) => format(value, decimals));
  }
  return labels;
}

export function MuscleVolumeChart({ perMuscle }) {
  const rows = [...perMuscle].sort((a, b) => b.effectiveSets - a.effectiveSets);
  const { max } = niceScale(Math.max(...rows.map((m) => m.effectiveSets)));
  const anyLocked = rows.some((m) => m.stimulatingSets === null);

  const axisLabels = muscleAxisLabels(max);

  return (
    <div className="mv-chart stack">
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-key">
          <i className="legend-swatch legend-swatch--context" />
          Effective sets/wk
        </span>
        <span className="legend-key">
          <i className="legend-swatch legend-swatch--accent" />
          Stimulating (effort-weighted)
        </span>
      </div>
      <div className="mv-rows" style={{ "--mv-ticks": 4 }}>
        {rows.map((m, i) => {
          const effFrac = Math.min(m.effectiveSets / max, 1);
          const stimFrac =
            m.stimulatingSets === null ? null : Math.min(m.stimulatingSets / max, 1);
          const tip =
            m.stimulatingSets === null
              ? `${m.muscle}: ${fmt1(m.effectiveSets)} effective sets/wk · log RIR or RPE for stimulating`
              : `${m.muscle}: ${fmt1(m.effectiveSets)} effective · ${fmt1(m.stimulatingSets)} stimulating sets/wk`;
          /* --row staggers the bar charge top-to-bottom (analytics-motion.css). */
          return (
            <div
              key={m.muscle}
              className="mv-row chart-tip-host"
              tabIndex={0}
              aria-label={tip}
              data-tip={tip}
              style={{ "--row": i }}
            >
              <span className="mv-name">{m.muscle}</span>
              <div className="mv-track">
                <span
                  className="mv-bar mv-bar--effective"
                  style={{ width: `${effFrac * 100}%` }}
                />
                {stimFrac !== null ? (
                  <span
                    className="mv-bar mv-bar--stimulating"
                    style={{ width: `${stimFrac * 100}%` }}
                  />
                ) : null}
              </div>
              <span className="mv-val">
                {fmt1(m.effectiveSets)}
                {m.stimulatingSets !== null ? (
                  <span className="mv-val__stim">{fmt1(m.stimulatingSets)}</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mv-axis" aria-hidden="true">
        <span />
        <div className="mv-axis__ticks">
          {axisLabels.map((label, i) => (
            <span key={i} className="mv-axis__tick" style={{ left: `${i * 25}%` }}>
              {label}
            </span>
          ))}
        </div>
        <span className="mv-axis__spacer" />
      </div>
      {anyLocked ? (
        <p className="muted small analytics-chart-note">
          Muscles without RIR or RPE logged show effective sets only.
        </p>
      ) : null}
    </div>
  );
}
