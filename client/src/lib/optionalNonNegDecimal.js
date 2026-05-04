/**
 * Same rules as server `validateOptionalNonNegDecimal` (2-decimal cap, no silent rounding).
 *
 * @param {unknown} value
 * @param {{ maxDecimals: number, fieldName: string, allowZero?: boolean }} opts
 * @returns {{ ok: true, value: number | null } | { ok: false, error: string }}
 */
export function validateOptionalNonNegDecimal(value, opts) {
  const { maxDecimals, fieldName, allowZero = true } = opts;
  const errMsg = `${fieldName} must be a non-negative number with at most ${maxDecimals} decimal places`;

  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }

  const allowZeroResolved = allowZero !== false;

  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") {
      return { ok: true, value: null };
    }
    if (!/^\d+(\.\d+)?$/.test(t)) {
      return { ok: false, error: errMsg };
    }
    const parts = t.split(".");
    const frac = parts[1] || "";
    if (frac.length > maxDecimals) {
      return { ok: false, error: errMsg };
    }
    const num = Number(t);
    if (!Number.isFinite(num)) {
      return { ok: false, error: errMsg };
    }
    if (num < 0) {
      return { ok: false, error: errMsg };
    }
    if (!allowZeroResolved && num === 0) {
      return { ok: false, error: errMsg };
    }
    return { ok: true, value: num };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, error: errMsg };
    }
    if (value < 0) {
      return { ok: false, error: errMsg };
    }
    if (!allowZeroResolved && value === 0) {
      return { ok: false, error: errMsg };
    }
    const scaled = Math.round(value * 10 ** maxDecimals);
    const back = scaled / 10 ** maxDecimals;
    if (Math.abs(value - back) > 1e-9 * Math.max(1, Math.abs(value))) {
      return { ok: false, error: errMsg };
    }
    return { ok: true, value };
  }

  return { ok: false, error: errMsg };
}
