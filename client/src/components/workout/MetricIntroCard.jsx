import { METRIC_INTRO_COPY } from "../../lib/metricIntros.js";

/** One-time dismissible intro for RPE or RIR on the live session screen. */
export function MetricIntroCard({ metric, onDismiss }) {
  const copy = METRIC_INTRO_COPY[metric];
  return (
    <div className="metric-intro-card" role="status">
      <p className="metric-intro-card__text">{copy}</p>
      <div className="metric-intro-card__actions">
        <button type="button" className="btn btn-secondary metric-intro-card__btn" onClick={onDismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
