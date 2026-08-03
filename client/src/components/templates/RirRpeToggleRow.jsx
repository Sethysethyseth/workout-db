/**
 * RIR / RPE either-or control. One active signal at a time; null means
 * nothing chosen yet (legacy both-false rows only - not user-selectable).
 * Presentation matches quick workout log (quick-log-toggle* in index.css).
 *
 * @param {"rir" | "rpe" | null} value
 * @param {(next: "rir" | "rpe") => void} onChange - never called with null
 * @param {boolean} showNudge - set false where the CALLER supplies its own
 *   null-state copy (the edit pages' required-choice prompt), or the same
 *   "two sets of 10" sentence renders twice back to back.
 */
export function RirRpeToggleRow({
  value,
  onChange,
  sectionLabel = "Per set",
  showSectionLabel = true,
  variant = "prefs",
  showNudge = true,
}) {
  const isCompact = variant === "compact";
  const rirOn = value === "rir";
  const rpeOn = value === "rpe";
  // Legacy both-false only - either-or cannot reach null via the control.
  const showEffortNudge = value === null && showNudge;
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

  function select(signal) {
    if (value === signal) return;
    onChange(signal);
  }

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
              className={`rir-rpe-inline-row__option ${rirOn ? "is-on" : ""}`}
              aria-pressed={rirOn}
              onClick={() => select("rir")}
            >
              RIR
            </button>
            <button
              type="button"
              className={`rir-rpe-inline-row__option ${rpeOn ? "is-on" : ""}`}
              aria-pressed={rpeOn}
              onClick={() => select("rpe")}
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
          className={`quick-log-toggle ${rirOn ? "quick-log-toggle--on" : ""}`}
          aria-pressed={rirOn}
          onClick={() => select("rir")}
        >
          RIR
        </button>
        <button
          type="button"
          className={`quick-log-toggle ${rpeOn ? "quick-log-toggle--on" : ""}`}
          aria-pressed={rpeOn}
          onClick={() => select("rpe")}
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
