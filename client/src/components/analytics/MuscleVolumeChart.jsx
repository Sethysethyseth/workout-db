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

export function MuscleVolumeChart({ perMuscle }) {
  const rows = [...perMuscle].sort((a, b) => b.effectiveSets - a.effectiveSets);
  const { max } = niceScale(Math.max(...rows.map((m) => m.effectiveSets)));
  const anyLocked = rows.some((m) => m.stimulatingSets === null);

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
        {rows.map((m) => {
          const effFrac = Math.min(m.effectiveSets / max, 1);
          const stimFrac =
            m.stimulatingSets === null ? null : Math.min(m.stimulatingSets / max, 1);
          const tip =
            m.stimulatingSets === null
              ? `${m.muscle}: ${fmt1(m.effectiveSets)} effective sets/wk · log RIR or RPE for stimulating`
              : `${m.muscle}: ${fmt1(m.effectiveSets)} effective · ${fmt1(m.stimulatingSets)} stimulating sets/wk`;
          return (
            <div
              key={m.muscle}
              className="mv-row chart-tip-host"
              tabIndex={0}
              aria-label={tip}
              data-tip={tip}
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
      {anyLocked ? (
        <p className="muted small analytics-chart-note">
          Muscles without RIR or RPE logged show effective sets only.
        </p>
      ) : null}
    </div>
  );
}
