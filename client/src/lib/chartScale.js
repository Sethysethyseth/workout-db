/** Nice round axis scales for the analytics charts. Pure, no deps. */

function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const factor = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return factor * mag;
}

/** Strip float drift from accumulated tick values (0.30000000000000004 -> 0.3). */
function clean(n) {
  return Number(n.toFixed(10));
}

/**
 * Zero-based scale: { max, ticks } where max is the first clean step >= dataMax.
 * Degenerate input (<= 0, non-finite) falls back to a unit scale.
 */
export function niceScale(dataMax, targetTicks = 4) {
  if (!Number.isFinite(dataMax) || dataMax <= 0) return { max: 1, ticks: [0, 1] };
  const step = niceStep(dataMax / targetTicks);
  const max = clean(Math.ceil(dataMax / step - 1e-9) * step);
  const ticks = [];
  for (let t = 0; t <= max + step / 2; t += step) ticks.push(clean(t));
  return { max, ticks };
}

/**
 * Non-zero-based scale for value ranges (e1RM axes): { min, max, ticks }
 * snapped outward to clean steps. A flat domain gets padded so a single
 * value still renders mid-scale.
 */
export function niceRange(dataMin, dataMax, targetTicks = 4) {
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return { min: 0, max: 1, ticks: [0, 1] };
  }
  if (dataMin > dataMax) [dataMin, dataMax] = [dataMax, dataMin];
  if (dataMin === dataMax) {
    const pad = Math.max(Math.abs(dataMin) * 0.1, 1);
    dataMin -= pad;
    dataMax += pad;
  }
  const step = niceStep((dataMax - dataMin) / targetTicks);
  const min = clean(Math.floor(dataMin / step + 1e-9) * step);
  const max = clean(Math.ceil(dataMax / step - 1e-9) * step);
  const ticks = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(clean(t));
  return { min, max, ticks };
}
