/**
 * RIR / RPE column toggles. Presentation matches quick workout log (quick-log-toggle* in index.css).
 */
export function RirRpeToggleRow({
  useRIR,
  useRPE,
  onUseRIRChange,
  onUseRPEChange,
  sectionLabel = "Per set",
  showSectionLabel = true,
  variant = "prefs",
}) {
  const isCompact = variant === "compact";
  const showEffortNudge = !useRIR && !useRPE;
  const effortNudge = showEffortNudge ? (
    <p className="muted small rir-rpe-effort-nudge">
      <span className="rir-rpe-effort-nudge__line">
        {"Effort logging off - volume still tracks, but effort-based analytics stay locked."}
      </span>
      <span className="rir-rpe-effort-nudge__line">
        {
          "Two sets of 10 can be worlds apart: one taken to the limit, one with five reps left. RIR is how LogChamp tells them apart."
        }
      </span>
    </p>
  ) : null;

  if (isCompact) {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <div className="checkbox-inline rir-rpe-inline-row">
          <span className="rir-rpe-inline-row__label">
            {showSectionLabel ? sectionLabel : "RIR / RPE"}
          </span>
          <div className="rir-rpe-inline-row__segmented" role="group" aria-label={sectionLabel}>
            <button
              type="button"
              className={`rir-rpe-inline-row__option ${useRIR ? "is-on" : ""}`}
              aria-pressed={useRIR}
              onClick={() => onUseRIRChange(!useRIR)}
            >
              RIR
            </button>
            <button
              type="button"
              className={`rir-rpe-inline-row__option ${useRPE ? "is-on" : ""}`}
              aria-pressed={useRPE}
              onClick={() => onUseRPEChange(!useRPE)}
            >
              RPE
            </button>
          </div>
        </div>
        <p className="muted small rir-rpe-toggle-hint" style={{ margin: 0, lineHeight: 1.35 }}>
          <span style={{ display: "block" }}>RIR — Reps in Reserve</span>
          <span style={{ display: "block" }}>RPE — Rating of Perceived Exertion</span>
        </p>
        {effortNudge}
      </div>
    );
  }

  return (
    <div className="quick-log-display-prefs__group stack">
      {showSectionLabel ? (
        <div className="quick-log-display-prefs__label muted small">{sectionLabel}</div>
      ) : null}
      <div className="quick-log-toggle-row row">
        <button
          type="button"
          className={`quick-log-toggle ${useRIR ? "quick-log-toggle--on" : ""}`}
          aria-pressed={useRIR}
          onClick={() => onUseRIRChange(!useRIR)}
        >
          RIR
        </button>
        <button
          type="button"
          className={`quick-log-toggle ${useRPE ? "quick-log-toggle--on" : ""}`}
          aria-pressed={useRPE}
          onClick={() => onUseRPEChange(!useRPE)}
        >
          RPE
        </button>
      </div>
      <p className="muted small rir-rpe-toggle-hint" style={{ margin: 0, lineHeight: 1.35 }}>
        <span style={{ display: "block" }}>RIR — Reps in Reserve</span>
        <span style={{ display: "block" }}>RPE — Rating of Perceived Exertion</span>
      </p>
      {effortNudge}
    </div>
  );
}
