import { Chip } from "../ui/Chip.jsx";
import { deviceUnitToFormat, normalizeUnit } from "./blockBuilderState.js";

/**
 * Draft banner: accept / discard / optional unit convert.
 */
export function DraftBanner({
  sourceUnit,
  deviceUnit,
  onAccept,
  onDiscard,
  onConvert,
  accepting = false,
}) {
  const src = sourceUnit ? normalizeUnit(sourceUnit) : null;
  const device = deviceUnitToFormat(deviceUnit);
  const needsConvert = src && src !== device;
  const srcLabel = src === "kg" ? "kg" : "lb";
  const deviceLabel = device === "kg" ? "kg" : "lb";

  return (
    <div className="bk-draft-banner" role="region" aria-label="Draft block">
      <div className="bk-draft-banner__lead">
        <Chip tone="accent">From Claude</Chip>
        <p className="bk-draft-banner__text">
          Review this draft, then save it to your library.
        </p>
      </div>
      {needsConvert ? (
        <p className="bk-draft-banner__convert">
          Loads were written in {srcLabel} —{" "}
          <button type="button" className="bk-draft-banner__link" onClick={onConvert}>
            Convert to {deviceLabel}
          </button>
        </p>
      ) : null}
      <div className="bk-draft-banner__actions">
        <button
          type="button"
          className="btn"
          disabled={accepting}
          onClick={onAccept}
        >
          {accepting ? "Saving…" : "Save to library"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
