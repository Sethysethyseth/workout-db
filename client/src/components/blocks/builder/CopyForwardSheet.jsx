import { useMemo, useState } from "react";
import { Stepper } from "../ui/Stepper.jsx";
import {
  MAX_WEEKS,
  normalizeUnit,
  previewCopyForward,
  skippedDeloadWeeks,
} from "./blockBuilderState.js";
import { BuilderSheet } from "./BuilderSheet.jsx";

function initialThrough(fromWeek, weekCount) {
  const minThrough = fromWeek + 1;
  return Math.min(Math.max(minThrough, weekCount), MAX_WEEKS);
}

function defaultLoadStep(unit) {
  return normalizeUnit(unit) === "kg" ? 2.5 : 5;
}

/**
 * Copy the selected week forward with an optional per-week load step.
 * Remount (via parent key) when reopened so steppers reset cleanly.
 */
export function CopyForwardSheet({
  open,
  onClose,
  fromWeek,
  state,
  unit,
  onApply,
}) {
  const u = normalizeUnit(unit);
  const stepSize = u === "kg" ? 1.25 : 2.5;
  const weekCount = state?.weeks?.length || 1;
  const minThrough = fromWeek + 1;

  const [throughWeek, setThroughWeek] = useState(() =>
    initialThrough(fromWeek, weekCount)
  );
  const [loadStep, setLoadStep] = useState(() => defaultLoadStep(unit));
  const [overwriteDeload, setOverwriteDeload] = useState(false);

  const deloads = useMemo(
    () => skippedDeloadWeeks(state, { fromWeek, throughWeek }),
    [state, fromWeek, throughWeek]
  );

  const preview = useMemo(
    () =>
      previewCopyForward(state, {
        fromWeek,
        throughWeek,
        loadStep,
        unit: u,
        overwriteDeload,
      }),
    [state, fromWeek, throughWeek, loadStep, u, overwriteDeload]
  );

  const replaceRange = useMemo(() => {
    if (throughWeek <= fromWeek) return null;
    const firstExisting = fromWeek + 1;
    const lastExisting = Math.min(throughWeek, weekCount);
    if (lastExisting < firstExisting) return null;
    if (firstExisting === lastExisting) return `Replaces week ${firstExisting}`;
    return `Replaces weeks ${firstExisting}-${lastExisting}`;
  }, [fromWeek, throughWeek, weekCount]);

  const skipPreview = useMemo(() => {
    if (overwriteDeload || deloads.length === 0) return null;
    return deloads
      .map((d) => `Skips week ${d.weekNum} (${d.label})`)
      .join(" · ");
  }, [overwriteDeload, deloads]);

  const canApply = throughWeek > fromWeek && throughWeek <= MAX_WEEKS;

  return (
    <BuilderSheet
      open={open}
      title="Copy forward"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!canApply}
            onClick={() => {
              if (!canApply) return;
              onApply?.({ fromWeek, throughWeek, loadStep, unit: u, overwriteDeload });
            }}
          >
            Apply
          </button>
        </>
      }
    >
      <p className="bk-copy-forward__lead">
        Copy week {fromWeek} to weeks {fromWeek + 1} through
      </p>
      <div className="bk-copy-forward__row">
        <Stepper
          value={throughWeek}
          min={minThrough}
          max={MAX_WEEKS}
          step={1}
          label="through week"
          onChange={setThroughWeek}
        />
      </div>

      <label className="bk-copy-forward__field">
        <span className="bk-settings__label">Add per week ({u})</span>
        <Stepper
          value={loadStep}
          min={0}
          max={50}
          step={stepSize}
          label={`load step ${u}`}
          format={(n) => String(n)}
          onChange={setLoadStep}
        />
      </label>

      {deloads.length > 0 ? (
        <label className="bk-copy-forward__deload">
          <input
            type="checkbox"
            checked={overwriteDeload}
            onChange={(e) => setOverwriteDeload(e.target.checked)}
          />
          <span>Also overwrite deload weeks</span>
        </label>
      ) : null}

      {preview.length > 0 ? (
        <ul className="bk-copy-forward__preview">
          {preview.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="bk-copy-forward__preview-empty">
          No weighted sets to preview.
        </p>
      )}

      {skipPreview ? (
        <p className="bk-copy-forward__skip" role="status">
          {skipPreview}
        </p>
      ) : null}

      {replaceRange ? (
        <p className="bk-copy-forward__warn" role="status">
          {replaceRange}
        </p>
      ) : null}
    </BuilderSheet>
  );
}
