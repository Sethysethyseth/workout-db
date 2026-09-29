/**
 * Parse a seconds field for timed-set logging.
 * Accepts bare seconds ("45") or mm:ss ("1:30", "0:45").
 * @param {unknown} input
 * @returns {number | null}
 */
export function parseSeconds(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (s === "") return null;

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isInteger(n) || n < 1) return null;
    return n;
  }

  const m = /^(\d+):([0-5]?\d)$/.exec(s);
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]);
  if (!Number.isInteger(total) || total < 1) return null;
  return total;
}
