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
  if (isCompact) {
    return (
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
    </div>
  );
}
