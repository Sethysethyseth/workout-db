/**
 * Reps value formatting for analytics top-set display strings.
 * Integer stays bare; fractional keeps one decimal (mirrors formatEffortValue).
 */

/**
 * Integer stays integer; fractional keeps one decimal.
 * @param {number} n
 */
export function formatRepsValue(n) {
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}
