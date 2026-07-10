/**
 * Effort value formatting — RIR/RPE-neutral display for analytics surfaces.
 * Absorbs the duplicated local `formatRir` copies.
 */

/**
 * Integer stays integer; fractional keeps one decimal.
 * @param {number} n
 */
export function formatEffortValue(n) {
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

/**
 * Format an effort for display: `"2 RIR"` or `"8 RPE"`.
 *
 * Unit resolution, in order:
 * 1. explicit `effortUnit` ("rir"|"rpe") wins;
 * 2. else the value's own logged unit (`rpe != null` -> RPE as-is;
 *    else `rir != null` -> RIR);
 * 3. else RIR.
 *
 * When rendering RPE from a normalized RIR value (matched-effort trend),
 * convert for display: `rpe = 10 - rir`.
 *
 * @param {{ rir?: number|null, rpe?: number|null, effortUnit?: "rir"|"rpe"|null }} [opts]
 */
export function formatEffort({ rir = null, rpe = null, effortUnit = null } = {}) {
  let unit;
  let value;

  if (effortUnit === "rpe" || effortUnit === "rir") {
    unit = effortUnit;
    if (unit === "rpe") {
      value = rpe != null ? rpe : rir != null ? 10 - rir : null;
    } else {
      value = rir != null ? rir : rpe != null ? 10 - rpe : null;
    }
  } else if (rpe != null) {
    unit = "rpe";
    value = rpe;
  } else if (rir != null) {
    unit = "rir";
    value = rir;
  } else {
    unit = "rir";
    value = null;
  }

  const label = unit === "rpe" ? "RPE" : "RIR";
  if (value == null || Number.isNaN(Number(value))) {
    return `— ${label}`;
  }
  return `${formatEffortValue(value)} ${label}`;
}
